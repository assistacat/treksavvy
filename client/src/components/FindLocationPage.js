import React, { useState, useEffect } from 'react';
import LocationCard from './LocationCard';

export default function FindLocationPage({
  onImport,
  onBack,
  savedLocations,
  startingLocation,
  setStartingLocation,
  goToAddPage,
}) {
  const [filters, setFilters] = useState({
    name: '',
    rating: '',
    reviews: '',
    type: '',
    radius: '',
  });
  const [results, setResults] = useState([]);

  // retrieve user's current location once 
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos =>
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        err => console.error('Geolocation error:', err)
      );
    }
  }, []);

  const handleChange = e =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleSearch = async () => {
    const { lat, lng } = startingLocation
      ? { lat: startingLocation.lat, lng: startingLocation.lng }
      : userCoords;

    if (lat == null || lng == null) {
      alert('Unable to determine your starting coordinates.');
      return;
    }
    if (filters.radius && isNaN(Number(filters.radius))) {
      alert('Radius must be a number (in meters).');
      return;
    }

    const params = new URLSearchParams({ lat, lng });
    if (filters.name)    params.set('name', filters.name);
    if (filters.type)    params.set('type', filters.type);
    if (filters.rating)  params.set('min_rating', filters.rating);
    if (filters.reviews) params.set('min_reviews', filters.reviews);
    if (filters.radius)  params.set('radius', filters.radius);

    try {
      const res = await fetch(`/api/discover?${params.toString()}`);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Error ${res.status}: ${body}`);
      }
      const { places = [] } = await res.json();
      setResults(places.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)));
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  // import all visible search results except locations already saved 
  const handleAddAll = () => {
    const toAdd = results.filter(
      loc => !savedLocations.some(p => p.lat === loc.lat && p.lng === loc.lng)
    );
    toAdd.forEach(loc => onImport(loc));
  };

  return (
    <div className="find-location-page">
      {/* STARTING LOCATION */}
      <div className="starting-location" style={{ marginBottom: 20 }}>
        <h3 style={{ textAlign: 'center' }}>STARTING LOCATION</h3>
        {!startingLocation ? (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button
              onClick={goToAddPage}
              style={{ background: '#ccc', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
            >
              CURRENT LOCATION
            </button>
          </div>
        ) : (
          <div className="starting-location-card">
            <LocationCard
              location={startingLocation}
              onSecondary={() => setStartingLocation(null)}
              secondaryLabel="REMOVE"
            />
          </div>
        )}
      </div>

      {/* FILTERS */}
      <div className="filters">
        <div className="row">
          <label>NAME</label>
          <input
            name="name"
            value={filters.name}
            onChange={handleChange}
            placeholder="enter location name…"
          />
        </div>
        <div className="row">
          <label>RATING</label>
          <input
            name="rating"
            value={filters.rating}
            onChange={handleChange}
            placeholder="0.0–5.0"
          />
          <label>REVIEW COUNT</label>
          <input
            name="reviews"
            value={filters.reviews}
            onChange={handleChange}
            placeholder="number"
          />
          <label>TYPE</label>
          <input
            name="type"
            value={filters.type}
            onChange={handleChange}
            placeholder="e.g. restaurant"
          />
        </div>
        <div className="row">
          <label>RADIUS (m)</label>
          <input
            name="radius"
            value={filters.radius}
            onChange={handleChange}
            placeholder="e.g. 2000"
          />
        </div>
        <div className="row">
          <button onClick={handleSearch}>SEARCH</button>
        </div>
      </div>

      {/* RESULTS */}
      <div className="results">
        {results.map((loc, idx) => (
          <LocationCard
            key={idx}
            location={loc}
            onPrimary={() => onImport(loc)}
            primaryLabel="IMPORT"
          />
        ))}
      </div>

      {/* ADD ALL LOCATIONS + BACK */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={handleAddAll}>ADD ALL LOCATIONS</button>
        <button onClick={onBack}>BACK</button>
      </div>
    </div>
  );
}