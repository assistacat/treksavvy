import React from 'react';
import LocationCard from './LocationCard';

function AddLocationPage({ savedLocations, onSelect, onRemove, onBack }) {
  return (
    <div className="add-location-page">
      {savedLocations.map((loc, idx) => (
        <LocationCard
          key={idx}
          location={loc}
          onPrimary={() => onSelect(loc)}
          primaryLabel="SELECT"
          onSecondary={() => onRemove(idx)}
          secondaryLabel="REMOVE"
        />
      ))}
      <button onClick={onBack}>BACK</button>
    </div>
  );
}

export default AddLocationPage;