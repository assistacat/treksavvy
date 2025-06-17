from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import requests
import os

# for frontend
app = Flask(__name__)
CORS(app) 

# store pins
pin_storage = []

# test
@app.route('/api/test')
def test():
    return jsonify({"front": "back"})

# add new pin
@app.route('/api/pins', methods=['POST'])
def add_pin():
    new_pin = request.get_json()  # from front end
    if not new_pin or 'lat' not in new_pin or 'lng' not in new_pin:
        return (jsonify({"error": "invalid pin data"}), 400)
    pin_storage.append(new_pin)  # store
    return (jsonify({
        "status": "success",
        "pin": new_pin}), 201)

# get all pins
@app.route('/api/pins', methods=['GET'])
def get_pins():
    return jsonify(pin_storage)

# delete all pins
@app.route('/api/pins', methods=['DELETE'])
def clear_pins():
    pin_storage.clear()
    return (jsonify({"status": "cleared"}), 200)

# import pins
@app.route('/api/import-pins', methods=['POST'])
def import_pins():
    file = request.files.get('file')
    if not file:
        return (jsonify({"error": "no file uploaded"}), 400)
    
    try:
        content = file.read()
        data = json.loads(content)

        for pin in data.get('pins', []):
            if 'lat' in pin and 'lng' in pin:
                duplicate = False
                for existing in pin_storage:
                    if existing['lat'] == pin['lat'] and existing['lng'] == pin['lng']:
                        duplicate = True
                        break
                if not duplicate:
                    pin_storage.append(pin)
        
        return (jsonify({"message": "pins imported!"}), 200)
    
    except Exception:
        return (jsonify({"error": "invalid file"}), 500)
    
# filter system
@app.route('/api/discover', methods=['GET'])
def discover_places():
        lat = request.args.get('lat')
        lng = request.args.get('lng')
        radius = request.args.get('radius', 3000) #range of finder can be edited
        min_rating = float(request.args.get('min_rating', 0))
        min_reviews = int(request.args.get('min_reviews', 0))

        if not lat or not lng:
            return (jsonify({"error": "missing lat or lng"}), 400)
        
        try:
            endpoint = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            params = {
                "location": f"{lat},{lng}",
                "radius": radius,
                "key": "AIzaSyCNH9UJ-VEyJzfkX1SKwMb9K-8PDMsYvT0",
            }

            response = requests.get(endpoint, params=params)
            data = response.json()

            if "results" not in data:
                return (jsonify({"error": "no results from google places api"}), 500)
            
            filtered = []
            for place in data["results"]:
                rating = place.get("rating", 0)
                reviews = place.get("user_ratings_total", 0)

                if rating >= min_rating and reviews >= min_reviews:
                    filtered.append({
                        "name": place.get("name"),
                        "lat": place["geometry"]["location"]["lat"],
                        "lng": place["geometry"]["location"]["lng"],
                        "rating": rating,
                        "reviews": reviews,
                        "type": place.get("types", [])
                    })
            
            return (jsonify({"places": filtered}), 200)
        
        except Exception:
            return (jsonify({"error": "something went wrong while searching for places"}), 500)

        

