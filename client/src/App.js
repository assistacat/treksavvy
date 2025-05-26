import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [pins, setPins] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, dayIndex: null, section: null });

  // Create schedule array between start and end dates
  const createSchedule = (start, end) => {
    const startDt = new Date(start);
    const endDt = new Date(end);
    const days = [];
    for (let d = new Date(startDt); d <= endDt; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        morning: [],
        noon: [],
        night: []
      });
    }
    return days;
  };

  // Handle schedule generation
  const handleGenerate = () => {
    if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
      setSchedule(createSchedule(startDate, endDate));
    } else {
      alert('Please enter a valid date range.');
    }
  };

  // Fetch pins from backend
  const importPins = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pins');
      const data = await res.json();
      setPins(data);
    } catch (err) {
      console.error(err);
      alert('Error loading pins');
    }
  };

  // Modal controls
  const openModal = (dayIndex, section) => setModal({ isOpen: true, dayIndex, section });
  const closeModal = () => setModal({ isOpen: false, dayIndex: null, section: null });

  // Add selected pin to a schedule slot
  const addPinToSchedule = (pin) => {
    setSchedule(prev => {
      const updated = [...prev];
const slot = updated[modal.dayIndex][modal.section];
      if (!slot.some(p => p.lat === pin.lat && p.lng === pin.lng)) {
        updated[modal.dayIndex][modal.section] = [...slot, pin];
      }
      return updated;
    });
    closeModal();
  };

  // Remove selected pin from a schedule slot
  const removePinFromSchedule = (dayIndex, section, pinIndex) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[dayIndex][section] = updated[dayIndex][section].filter((_, idx) => idx !== pinIndex);
      return updated;
    });
  };

  return (
    <div className="App">
      <header>
        <h1>TrekSavvy</h1>
      </header>
      <section className="controls">
        <label>
          Start Date:&nbsp;
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        <label>
          &nbsp;End Date:&nbsp;
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
        &nbsp;<button onClick={handleGenerate}>Generate Schedule</button>
        &nbsp;<button onClick={importPins}>Import Pins</button>
      </section>

      {schedule.length > 0 && (
        <div className="schedule">
          {schedule.map((day, idx) => (
            <div className="day" key={idx}>
              <h2>
                {day.date
                  .toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                  .replace(',', '')}
              </h2>

              {['morning', 'noon', 'night'].map(section => (
                <div className="section" key={section}>
                  <h3>{section.charAt(0).toUpperCase() + section.slice(1)}</h3>
                  <ul>
                    {day[section].map((pin, i) => (
                      <li key={i}>{`Lat: ${pin.lat}, Lng: ${pin.lng}`}
                       <button
                          onClick={() => removePinFromSchedule(idx, section, i)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Remove {}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => openModal(idx, section)}>
                    Add Pin
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {modal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Select a Pin</h3>
            <ul>
              {pins.map((pin, i) => (
                <li key={i}>
                  <button onClick={() => addPinToSchedule(pin)}>
                    {`Pin ${i + 1}: (${pin.lat}, ${pin.lng})`}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
