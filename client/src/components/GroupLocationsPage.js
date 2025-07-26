import React from 'react';
import LocationCard from './LocationCard';

export default function GroupLocationsPage({
  group,
  onRemoveLoc,
  onAddLoc,
  onBack
}) {
  return (
    <div className="add-location-page">
      <h3>{group.name.toUpperCase()}</h3>

      {group.locations.length === 0 ? (
        <p style={{ textAlign: 'center', margin: '20px 0' }}>No locations yet.</p>
      ) : (
        group.locations.map((loc, idx) => (
          <LocationCard
            key={idx}
            location={loc}
            onSecondary={() => onRemoveLoc(idx)}
            secondaryLabel="REMOVE"
          />
        ))
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={onAddLoc}>ADD LOCATION</button>
        <button onClick={onBack}>BACK</button>
      </div>
    </div>
  );
}
