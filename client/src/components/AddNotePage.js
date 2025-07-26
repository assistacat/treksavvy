import React, { useState } from 'react';

function AddNotePage({ onCreate, onCancel }) {
  const [noteText, setNoteText] = useState('');

  const handleCreate = () => {
    if (!noteText.trim()) {
      alert('Please enter some text for the note.');
      return;
    }
    onCreate(noteText);
  };

  return (
    <div className="add-location-page">
      <h3>NOTE</h3>
      <textarea
        placeholder="enter text here…"
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        style={{
          width: '100%',
          height: '120px',
          marginBottom: '20px',
          fontSize: '1em',
          padding: '10px'
        }}
      />
      <div>
        <button
          onClick={handleCreate}
          disabled={!noteText.trim()}
        >
          CREATE
        </button>
        <button onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

export default AddNotePage;
