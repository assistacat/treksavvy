import React, { useState } from 'react';
import LocationCard from './LocationCard';

export default function SchedulePage({
  schedule,
  onFind,
  onAdd,
  onAddNote,
  onAddGroup,
  onViewGroup,
  onRemove,
  onRemoveGroup,
  onSave,
  onLoadSchedules,
  onClear,
  onExportPins,
  onConvertPDF,
  pdfMode
}) {
  const [expandedSlots, setExpandedSlots] = useState({});

  const formatDate = date => {
    const d = String(new Date(date).getDate()).padStart(2, '0');
    const m = String(new Date(date).getMonth() + 1).padStart(2, '0');
    const y = new Date(date).getFullYear();
    const weekday = new Date(date)
      .toLocaleDateString(undefined, { weekday: 'long' })
      .toUpperCase();
    return `${d}/${m}/${y} ${weekday}`;
  };

  const keyFor = (dayIndex, slot, insertIdx) =>
    `${dayIndex}-${slot}-${insertIdx}`;

  const toggle = (dayIndex, slot, insertIdx) => {
    const k = keyFor(dayIndex, slot, insertIdx);
    setExpandedSlots(prev => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="schedule-page" id="schedule-container">
      {schedule.map((day, dayIndex) => (
        <div key={dayIndex} className="day-schedule">

          {/* hide top buttons when converted to pdf */}
          {dayIndex === 0 && !pdfMode && (
            <>
              <div className="find-button-container">
                <button onClick={() => onFind(dayIndex)}>FIND LOCATION</button>
              </div>
              <div className="save-load-clear-container">
                <button onClick={onSave}>SAVE</button>
                <button onClick={onLoadSchedules}>LOAD</button>
                <button onClick={onClear}>CLEAR</button>
              </div>
              <div
                className="export-buttons-container"
                style={{ textAlign: 'center', marginBottom: 16 }}
              >
                <button onClick={onExportPins}>EXPORT PINS TO GOOGLE MAPS</button>
                <button onClick={onConvertPDF}>CONVERT SCHEDULE TO PDF</button>
              </div>
            </>
          )}

          <h3>{formatDate(day.date)}</h3>

          {['morning', 'noon', 'night'].map(slot => (
            <div key={slot} className="slot-section">
              <h4>{slot.toUpperCase()}</h4>

              {/* hide add button when converted to pdf */}
              {!pdfMode && (() => {
                const insertIdx = 0;
                const k = keyFor(dayIndex, slot, insertIdx);
                if (expandedSlots[k]) {
                  return (
                    <div>
                      <button onClick={() => onAdd(dayIndex, slot, insertIdx)}>
                        ADD LOCATION
                      </button>
                      <button onClick={() => onAddGroup(dayIndex, slot, insertIdx)}>
                        ADD GROUP
                      </button>
                      <button onClick={() => onAddNote(dayIndex, slot, insertIdx)}>
                        ADD NOTE
                      </button>
                      <button onClick={() => toggle(dayIndex, slot, insertIdx)}>
                        CANCEL
                      </button>
                    </div>
                  );
                }
                return (
                  <button onClick={() => toggle(dayIndex, slot, insertIdx)}>
                    ADD
                  </button>
                );
              })()}

              {day[slot].map((item, idx) => {
                const insertIdx = idx + 1;
                const k = keyFor(dayIndex, slot, insertIdx);
                const isGroup = item.locations !== undefined;
                const isNote = item.note !== undefined;

                // rendering when converted to pdf
                if (pdfMode) {
                  // show locations in group cards
                  if (isGroup) {
                    return (
                      <div
                        key={idx}
                        style={{
                          margin: '8px 0',
                          background: '#e0f7fa',
                          padding: 8
                        }}
                      >
                        <h4 style={{ textAlign: 'center' }}>
                          {item.name.toUpperCase()}
                        </h4>
                        {item.locations.map((loc, i) => (
                          <LocationCard
                            key={i}
                            location={loc}
                          />
                        ))}
                      </div>
                    );
                  }

                  // show note cards
                  if (isNote) {
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'yellow',
                          padding: '10px',
                          margin: '8px 0'
                        }}
                      >
                        {item.note}
                      </div>
                    );
                  }

                  // render location cards without remove button
                  return (
                    <LocationCard
                      key={idx}
                      location={item}
                    />
                  );
                }

                // interactive mode rendering
                return (
                  <div key={idx}>
                    {isGroup ? (
                      <div
                        className="location-card"
                        style={{
                          background: '#e0f7fa',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div className="location-card-content">
                          <strong>{item.name}</strong>
                        </div>
                        <div className="location-card-buttons-vertical">
                          <button
                            onClick={() => onViewGroup(dayIndex, slot, idx)}
                          >
                            VIEW
                          </button>
                          <button
                            onClick={() => onRemoveGroup(dayIndex, slot, idx)}
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    ) : (
                      <LocationCard
                        location={item}
                        onPrimary={() => onRemove(dayIndex, slot, idx)}
                        primaryLabel="REMOVE"
                      />
                    )}

                    {/* hide nested ADD buttons hidden when converted to PDF */}
                    {!pdfMode && (expandedSlots[k] ? (
                      <div>
                        <button
                          onClick={() =>
                            onAdd(dayIndex, slot, insertIdx)
                          }
                        >
                          ADD LOCATION
                        </button>
                        <button
                          onClick={() =>
                            onAddGroup(dayIndex, slot, insertIdx)
                          }
                        >
                          ADD GROUP
                        </button>
                        <button
                          onClick={() =>
                            onAddNote(dayIndex, slot, insertIdx)
                          }
                        >
                          ADD NOTE
                        </button>
                        <button onClick={() => toggle(dayIndex, slot, insertIdx)}>
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggle(dayIndex, slot, insertIdx)}
                      >
                        ADD
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}