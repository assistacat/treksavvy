from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import requests
import os
itinerary_storage = []

# for frontend
app = Flask(__name__)
CORS(app)

# store pins
pin_storage = []

# test
@app.route('/api/test')
def test():
    return jsonify({"front": "back"}), 200

# add new pin
@app.route('/api/pins', methods=['POST'])
def add_pin():
    new_pin = request.get_json()
    if not new_pin or 'lat' not in new_pin or 'lng' not in new_pin:
        return jsonify({"error": "invalid pin data"}), 400

    pin_storage.append(new_pin)
    return jsonify({"status": "success", "pin": new_pin}), 201

# get all pins
@app.route('/api/pins', methods=['GET'])
def get_pins():
    return jsonify(pin_storage), 200

# delete all pins
@app.route('/api/pins', methods=['DELETE'])
def clear_pins():
    pin_storage.clear()
    return jsonify({"status": "cleared"}), 200

# import pins
@app.route('/api/import-pins', methods=['POST'])
def import_pins():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "no file uploaded"}), 400

    try:
        data = json.loads(file.read())
        for pin in data.get('pins', []):
            if 'lat' in pin and 'lng' in pin:
                if not any(p['lat'] == pin['lat'] and p['lng'] == pin['lng'] for p in pin_storage):
                    pin_storage.append(pin)
        return jsonify({"message": "pins imported!"}), 200

    except Exception:
        return jsonify({"error": "invalid file"}), 500

# filter system (with debug prints)
@app.route('/api/discover', methods=['GET'])
def discover_places():
    lat         = request.args.get('lat')
    lng         = request.args.get('lng')
    name_filter = request.args.get('name')
    type_filter = request.args.get('type')
    radius      = request.args.get('radius', 3000)
    min_rating  = float(request.args.get('min_rating', 0))
    min_reviews = int(request.args.get('min_reviews', 0))

    if not lat or not lng:
        return jsonify({"error": "missing lat or lng"}), 400

    # load API key from environment
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyBP2puwBvOyDwYbO6fQW2Ms1SUhngjP908")

    # build request params
    params = {
        "location": f"{lat},{lng}",
        "radius":   radius,
        "key":      api_key,
    }
    if type_filter:
        params["type"] = type_filter
    if name_filter:
        params["keyword"] = name_filter

    # DEBUGGING: print the Google API key and the outgoing params
    print("Using Google API key:", api_key)
    print("Outgoing params:", params)

    try:
        endpoint = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        resp = requests.get(endpoint, params=params)
        data = resp.json()

        # DEBUGGING: print the raw Google response
        print("Raw Google response:", data)

        if "results" not in data:
            return jsonify({"error": "no results from google places api"}), 500

        filtered = []
        for place in data["results"]:
            rating = place.get("rating", 0)
            reviews = place.get("user_ratings_total", 0)
            if rating >= min_rating and reviews >= min_reviews:
                filtered.append({
                    "name":    place.get("name"),
                    "lat":     place["geometry"]["location"]["lat"],
                    "lng":     place["geometry"]["location"]["lng"],
                    "rating":  rating,
                    "reviews": reviews,
                    "type":    place.get("types", [])
                })

        return jsonify({"places": filtered}), 200

    except Exception as e:
        print("Error in /api/discover:", e)
        return jsonify({"error": "something went wrong while searching for places"}), 500
    

 # address -> lat/lng (smart discovery support)
@app.route('/api/geocode', methods=['GET'])
def geocode_address():
    address = request.args.get('address')
    if not address:
        return jsonify({"error": "missing address parameter"}), 400

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyBP2puwBvOyDwYbO6fQW2Ms1SUhngjP908")
    endpoint = "https://maps.googleapis.com/maps/api/geocode/json"

    params = {
        "address": address,
        "key": api_key
    }

    try:
        resp = requests.get(endpoint, params=params)
        data = resp.json()

        # DEBUGGING: print raw geocode results
        print("Geocode response:", data)

        if not data["results"]:
            return jsonify({"error": "no results found for address"}), 404

        location = data["results"][0]["geometry"]["location"]
        return jsonify({
            "lat": location["lat"],
            "lng": location["lng"]
        }), 200

    except Exception as e:
        print("Error in /api/geocode:", e)
        return jsonify({"error": "something went wrong during geocoding"}), 500
    
@app.route('/api/smart-add', methods=['GET'])
def smart_add():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    radius = request.args.get('radius', 1000)  # default 1000m
    min_rating = float(request.args.get('min_rating', 0))
    min_reviews = int(request.args.get('min_reviews', 0))

    if not lat or not lng:
        return jsonify({"error": "missing lat or lng"}), 400

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyBP2puwBvOyDwYbO6fQW2Ms1SUhngjP908")
    endpoint = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "key": api_key
    }

    try:
        resp = requests.get(endpoint, params=params)
        data = resp.json()

        if "results" not in data:
            return jsonify({"error": "no results from google places api"}), 500

        added = []
        for place in data["results"]:
            rating = place.get("rating", 0)
            reviews = place.get("user_ratings_total", 0)

            if rating >= min_rating and reviews >= min_reviews:
                pin = {
                    "name": place.get("name"),
                    "lat": place["geometry"]["location"]["lat"],
                    "lng": place["geometry"]["location"]["lng"],
                    "rating": rating,
                    "reviews": reviews,
                    "type": place.get("types", [])
                }
                # avoid duplicates
                if not any(p["lat"] == pin["lat"] and p["lng"] == pin["lng"] for p in pin_storage):
                    pin_storage.append(pin)
                    added.append(pin)

        return jsonify({"status": "smart added", "added_pins": added}), 200

    except Exception as e:
        print("Error in /api/smart-add:", e)
        return jsonify({"error": "something went wrong during smart add"}), 500

@app.route('/api/export/kml', methods=['GET'])
def export_kml():
    kml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<kml xmlns="http://www.opengis.net/kml/2.2">',
           '<Document>']

    for pin in pin_storage:
        kml.append(f'''
        <Placemark>
            <name>{pin.get("name", "Unnamed")}</name>
            <Point>
                <coordinates>{pin["lng"]},{pin["lat"]},0</coordinates>
            </Point>
        </Placemark>
        ''')

    kml.append('</Document></kml>')
    kml_str = '\n'.join(kml)

    return app.response_class(kml_str, mimetype='application/vnd.google-earth.kml+xml')

@app.route('/api/export/geojson', methods=['GET'])
def export_geojson():
    features = []
    for pin in pin_storage:
        features.append({
            "type": "Feature",
            "properties": {
                "name": pin.get("name"),
                "rating": pin.get("rating", 0),
                "reviews": pin.get("reviews", 0)
            },
            "geometry": {
                "type": "Point",
                "coordinates": [pin["lng"], pin["lat"]]
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    return jsonify(geojson), 200

# store activity blocks
activity_blocks = []

# create new activity block
@app.route('/api/blocks', methods=['POST'])
def create_block():
    data = request.get_json()
    name = data.get('name')
    pins = data.get('pins')

    if not name or not pins:
        return jsonify({"error": "missing name or pins"}), 400

    # validate all pins have lat/lng
    for pin in pins:
        if 'lat' not in pin or 'lng' not in pin:
            return jsonify({"error": "each pin must have lat and lng"}), 400

    block = {
        "name": name,
        "pins": pins
    }
    activity_blocks.append(block)
    return jsonify({"status": "block created", "block": block}), 201

# get all activity blocks
@app.route('/api/blocks', methods=['GET'])
def get_blocks():
    return jsonify(activity_blocks), 200

# delete all activity blocks
@app.route('/api/blocks', methods=['DELETE'])
def clear_blocks():
    activity_blocks.clear()
    return jsonify({"status": "all blocks cleared"}), 200

# add a custom pin (manual block)
@app.route('/api/custom-pin', methods=['POST'])
def add_custom_pin():
    data = request.get_json()
    name = data.get('name')
    lat  = data.get('lat', None)
    lng  = data.get('lng', None)

    if not name:
        return jsonify({"error": "missing name for custom pin"}), 400

    custom_pin = {
        "name": name,
        "custom": True  # flag it
    }

    # optional lat/lng
    if lat is not None and lng is not None:
        custom_pin["lat"] = lat
        custom_pin["lng"] = lng

    pin_storage.append(custom_pin)
    return jsonify({"status": "custom pin added", "pin": custom_pin}), 201

# save itinerary
@app.route('/api/itinerary', methods=['POST'])
def save_itinerary():
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "invalid itinerary format"}), 400

    # overwrite
    itinerary_storage.clear()
    itinerary_storage.extend(data)

    return jsonify({"status": "itinerary saved", "items": len(itinerary_storage)}), 200

# get saved itinerary
@app.route('/api/itinerary', methods=['GET'])
def get_itinerary():
    return jsonify(itinerary_storage), 200

# clear itinerary
@app.route('/api/itinerary', methods=['DELETE'])
def clear_itinerary():
    itinerary_storage.clear()
    return jsonify({"status": "itinerary cleared"}), 200

# set TCP port to 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)