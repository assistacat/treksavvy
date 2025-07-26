import React from 'react';

function LocationCard({ location, onPrimary, primaryLabel, onSecondary, secondaryLabel }) {
  const formatCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const latHem = latNum >= 0 ? 'N' : 'S';
    const lngHem = lngNum >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(latNum).toFixed(4);
    const lngAbs = Math.abs(lngNum).toFixed(4);
    return `${latAbs}° ${latHem}, ${lngAbs}° ${lngHem}`;
  };

  return (
    <div className="location-card" style={location.note ? { background: 'yellow' } : {}}>
      <div className="location-card-content">
        {location.note ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{location.note}</div>
        ) : (
          <>
            <div className="location-card-top">
              <span><strong>{location.name}</strong></span>
              <span>{formatCoordinates(location.lat, location.lng)}</span>
            </div>
            <div className="location-card-line">RATING: {location.rating}</div>
            <div className="location-card-line">REVIEW COUNT: {location.reviews}</div>
            <div className="location-card-line">
              TYPE: {Array.isArray(location.type) ? location.type.join(', ') : location.type}
            </div>
          </>
        )}
      </div>
      {(onPrimary || onSecondary) && (
        <div className="location-card-buttons-vertical">
          {onPrimary   && <button onClick={onPrimary}>{primaryLabel}</button>}
          {onSecondary && <button onClick={onSecondary}>{secondaryLabel}</button>}
        </div>
      )}
    </div>
  );
}

export default LocationCard;