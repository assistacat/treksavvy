import pytest
from app import app  # assumes app.py is in the same folder

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/test')
    assert response.status_code == 200
    assert response.json == {"front": "back"}

def test_add_and_get_pin(client):
    test_pin = {"lat": 1.23, "lng": 4.56}
    add_response = client.post('/api/pins', json=test_pin)
    assert add_response.status_code == 201

    get_response = client.get('/api/pins')
    assert get_response.status_code == 200
    assert any(pin['lat'] == 1.23 and pin['lng'] == 4.56 for pin in get_response.json)

def test_clear_pins(client):
    response = client.delete('/api/pins')
    assert response.status_code == 200
    assert response.json['status'] == 'cleared'

    followup = client.get('/api/pins')
    assert followup.status_code == 200
    assert followup.json == []

def test_add_invalid_pin(client):
    response = client.post('/api/pins', json={"lat": 1.23})  # missing lng
    assert response.status_code == 400
