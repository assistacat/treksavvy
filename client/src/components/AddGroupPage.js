import React, { useState } from 'react';

function AddGroupPage({ onCreate, onCancel }) {
  const [groupName, setGroupName] = useState('');

  return (
    <div className="add-location-page">
      <h3>LOCATION GROUP NAME</h3>
      <input
        type="text"
        placeholder="enter name here…"
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '20px', fontSize: '1em' }}
      />
      <div>
        <button onClick={() => onCreate(groupName)}>CREATE</button>
        <button onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

export default AddGroupPage;
