import React, { useState } from 'react';

function InitialPage({ onCreateSchedule }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      onCreateSchedule(startDate, endDate);
    } else {
      alert('Please enter both start and end dates in DD/MM/YYYY format.');
    }
  };

  return (
    <div className="initial-page">
      <div className="date-inputs">
        <label>START DATE</label>
        <input
          type="text"
          placeholder="DD/MM/YYYY"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>END DATE</label>
        <input
          type="text"
          placeholder="DD/MM/YYYY"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div className="create-button">
        <button onClick={handleSubmit}>CREATE SCHEDULE</button>
      </div>
    </div>
  );
}

export default InitialPage;