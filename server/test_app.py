import pytest
from unittest.mock import Mock
import app as app_module
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


MAP_ROUTES = [
    '/api/discover?lat=1&lng=2',
    '/api/geocode?address=Singapore',
    '/api/smart-add?lat=1&lng=2',
]


@pytest.mark.parametrize('url', MAP_ROUTES)
@pytest.mark.parametrize('key', [None, '', '   '])
def test_maps_fail_closed_without_server_key(client, monkeypatch, url, key):
    if key is None:
        monkeypatch.delenv('GOOGLE_MAPS_API_KEY', raising=False)
    else:
        monkeypatch.setenv('GOOGLE_MAPS_API_KEY', key)
    get = Mock()
    monkeypatch.setattr(app_module.requests, 'get', get)
    response = client.get(url)
    assert response.status_code == 503
    assert response.json == {'error': 'Google Maps service is not configured'}
    get.assert_not_called()


@pytest.mark.parametrize('url', MAP_ROUTES)
def test_server_key_is_used_without_being_logged(client, monkeypatch, capsys, url):
    key = 'test-server-secret'
    monkeypatch.setenv('GOOGLE_MAPS_API_KEY', key)
    upstream = Mock()
    upstream.json.return_value = {'results': [
        {'geometry': {'location': {'lat': 1, 'lng': 2}}, 'rating': 5,
         'user_ratings_total': 10, 'name': 'Place'}
    ]}
    get = Mock(return_value=upstream)
    monkeypatch.setattr(app_module.requests, 'get', get)
    response = client.get(url)
    assert response.status_code == 200
    assert get.call_args.kwargs['params']['key'] == key
    captured = capsys.readouterr()
    assert key not in captured.out + captured.err + response.get_data(as_text=True)


@pytest.mark.parametrize('url', MAP_ROUTES)
def test_upstream_errors_cannot_leak_credentials(client, monkeypatch, capsys, url):
    key = 'test-server-secret'
    monkeypatch.setenv('GOOGLE_MAPS_API_KEY', key)
    monkeypatch.setattr(app_module.requests, 'get', Mock(side_effect=RuntimeError(key)))
    response = client.get(url)
    assert response.status_code == 500
    captured = capsys.readouterr()
    assert key not in captured.out + captured.err + response.get_data(as_text=True)


def test_browser_config_never_returns_the_server_key(client, monkeypatch):
    monkeypatch.setenv('GOOGLE_MAPS_API_KEY', 'private-server-key')
    monkeypatch.setenv('GOOGLE_MAPS_BROWSER_API_KEY', 'public-restricted-browser-key')
    response = client.get('/api/maps-config')
    assert response.status_code == 200
    assert response.json == {'browserApiKey': 'public-restricted-browser-key'}
    assert 'private-server-key' not in response.get_data(as_text=True)


def test_browser_config_does_not_fall_back_to_server_key(client, monkeypatch):
    monkeypatch.setenv('GOOGLE_MAPS_API_KEY', 'private-server-key')
    monkeypatch.delenv('GOOGLE_MAPS_BROWSER_API_KEY', raising=False)
    response = client.get('/api/maps-config')
    assert response.status_code == 503
    assert 'private-server-key' not in response.get_data(as_text=True)
