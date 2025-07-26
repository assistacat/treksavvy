import React, { useState } from 'react';

export default function AddSchedulePage({ onCreate, onCancel }) {
  const [name, setName] = useState('');

  return (
    <div className="add-location-page">
      <h3>SCHEDULE NAME</h3>
      <input
        type="text"
        placeholder="enter name here…"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '20px',
          fontSize: '1em'
        }}
      />
      <div>
        <button onClick={() => onCreate(name)}>CREATE</button>
        <button onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}