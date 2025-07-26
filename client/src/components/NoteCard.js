import React from 'react';

export default function NoteCard({ text, onRemove }) {
  return (
    <div className="note-card">
      <div className="note-text">{text}</div>
      <button onClick={onRemove}>REMOVE</button>
    </div>
  );
}