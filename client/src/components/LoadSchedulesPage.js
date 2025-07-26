import React from 'react';

export default function LoadSchedulesPage({
  savedSchedules,
  onLoad,
  onDelete,
  onBack
}) {
  return (
    <div className="add-location-page">
      <h3>SAVED SCHEDULES</h3>

      {savedSchedules.length === 0 ? (
        <p style={{ textAlign: 'center', margin: '20px 0' }}>
          No schedules saved.
        </p>
      ) : (
        savedSchedules.map((sch, idx) => (
          <div
            key={idx}
            className="location-card"
            style={{ background: '#a5f49c', display: 'flex', justifyContent: 'space-between' }}
          >
            <strong style={{ alignSelf: 'center' }}>{sch.name}</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => onLoad(idx)}>LOAD</button>
              <button onClick={() => onDelete(idx)}>DELETE</button>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button onClick={onBack}>BACK</button>
      </div>
    </div>
  );
}
