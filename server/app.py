from flask import Flask, request, jsonify
from flask_cors import CORS

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