from flask import Flask, request, jsonify
from flask_cors import CORS
import json

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