import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import InitialPage from './components/InitialPage';
import SchedulePage from './components/SchedulePage';
import FindLocationPage from './components/FindLocationPage';
import AddLocationPage from './components/AddLocationPage';
import AddNotePage from './components/AddNotePage';
import AddGroupPage from './components/AddGroupPage';
import GroupLocationsPage from './components/GroupLocationsPage';
import AddSchedulePage from './components/AddSchedulePage';
import LoadSchedulesPage from './components/LoadSchedulesPage';

function App() {
  // session persistence state hooks
  const [page, setPage] = useState(() => {
    return localStorage.getItem('page') || 'initial';
  });
  const [schedule, setSchedule] = useState(() => {
    const stored = localStorage.getItem('schedule');
    return stored ? JSON.parse(stored) : [];
  });
  const [savedSchedules, setSavedSchedules] = useState(() => {
    const stored = localStorage.getItem('savedSchedules');
    return stored ? JSON.parse(stored) : [];
  });
  const [savedLocations, setSavedLocations] = useState(() => {
    const stored = localStorage.getItem('savedLocations');
    return stored ? JSON.parse(stored) : [];
  });
  const [startingLocation, setStartingLocation] = useState(() => {
    const stored = localStorage.getItem('startingLocation');
    return stored ? JSON.parse(stored) : null;
  });

  const [context, setContext] = useState({});
  const [pdfMode, setPdfMode] = useState(false);

  // store information with localStorage 
  useEffect(() => { localStorage.setItem('page', page); }, [page]);
  useEffect(() => { localStorage.setItem('schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('savedSchedules', JSON.stringify(savedSchedules)); }, [savedSchedules]);
  useEffect(() => { localStorage.setItem('savedLocations', JSON.stringify(savedLocations)); }, [savedLocations]);
  useEffect(() => { localStorage.setItem('startingLocation', JSON.stringify(startingLocation)); }, [startingLocation]);

  // date page for creating schedule 
  const createSchedule = (startDate, endDate) => {
    const [dd1, mm1, yyyy1] = startDate.split('/');
    const [dd2, mm2, yyyy2] = endDate.split('/');
    let start = new Date(yyyy1, mm1 - 1, dd1);
    let end = new Date(yyyy2, mm2 - 1, dd2);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({ date: new Date(d), morning: [], noon: [], night: [] });
    }
    setSchedule(days);
    setPage('schedule');
  };

  // navigation helpers
  const navFind       = dateIndex => { setContext({ mode:'find', dateIndex }); setPage('find'); };
  const navAdd        = (di, slot, idx) => { setContext({ mode:'schedule-add', dateIndex:di, slot, insertIdx:idx }); setPage('add'); };
  const navNote       = (di, slot, idx) => { setContext({ mode:'note', dateIndex:di, slot, insertIdx:idx }); setPage('note'); };
  const navGroup      = (di, slot, idx) => { setContext({ mode:'group-create', dateIndex:di, slot, insertIdx:idx }); setPage('group'); };
  const navViewGroup  = (di, slot, gi)  => { setContext({ mode:'group-view', dateIndex:di, slot, groupIdx:gi }); setPage('groupLocations'); };
  const navSave       = () => setPage('saveSchedule');
  const navLoad       = () => setPage('loadSchedules');
  const navClear      = () => setSchedule(schedule.map(d => ({ date:d.date, morning:[], noon:[], night:[] })));

  // import location
  const importLocation = loc => {
    setSavedLocations(prev =>
      prev.some(p => p.lat===loc.lat && p.lng===loc.lng) ? prev : [...prev, loc]
    );
  };

  // select location (check duplicate locations for groups)
  const selectLocation = loc => {
    const { mode, dateIndex, slot, insertIdx, groupIdx } = context;
    if (mode === 'schedule-add') {
      const s = [...schedule];
      const arr = [...s[dateIndex][slot]];
      arr.splice(insertIdx, 0, loc);
      s[dateIndex][slot] = arr;
      setSchedule(s);
      return setPage('schedule');
    }
    if (mode === 'group-add') {
      const s = [...schedule];
      const grp = { ...s[dateIndex][slot][groupIdx] };
      if (!grp.locations.some(l => l.lat===loc.lat && l.lng===loc.lng)) {
        grp.locations = [...grp.locations, loc];
        s[dateIndex][slot][groupIdx] = grp;
        setSchedule(s);
      } else {
        alert('This location is already in the group.');
      }
      return setPage('groupLocations');
    }
    setStartingLocation(loc);
    setPage('find');
  };

  // remove locations
  const removeFromSchedule       = (di, slot, idx) => {
    const s = [...schedule];
    s[di][slot] = s[di][slot].filter((_,i)=>i!==idx);
    setSchedule(s);
  };
  const removeGroup              = (di, slot, gi) => {
    const s = [...schedule];
    s[di][slot] = s[di][slot].filter((_,i)=>i!==gi);
    setSchedule(s);
  };
  const removeLocationFromGroup  = idx => {
    const { dateIndex, slot, groupIdx } = context;
    const s = [...schedule];
    const grp = { ...s[dateIndex][slot][groupIdx] };
    grp.locations = grp.locations.filter((_,i)=>i!==idx);
    s[dateIndex][slot][groupIdx] = grp;
    setSchedule(s);
  };
  const removeSavedLocation      = idx => setSavedLocations(prev=>prev.filter((_,i)=>i!==idx));

  // create note 
  const createNote = text => {
    const { dateIndex, slot, insertIdx } = context;
    const s = [...schedule];
    const arr = [...s[dateIndex][slot]];
    arr.splice(insertIdx, 0, { note:text });
    s[dateIndex][slot] = arr;
    setSchedule(s);
    setPage('schedule');
  };

  // create group 
  const createGroup = name => {
    const { dateIndex, slot, insertIdx } = context;
    const s = [...schedule];
    const arr = [...s[dateIndex][slot]];
    arr.splice(insertIdx, 0, { name, locations:[] });
    s[dateIndex][slot] = arr;
    setSchedule(s);
    setPage('schedule');
  };

  // save schedule
  const createScheduleEntry = name => {
    setSavedSchedules(prev=>[...prev,{name,data:JSON.parse(JSON.stringify(schedule))}]);
    setPage('loadSchedules');
  };

  // load schedule
  const loadSchedule = idx => {
    setSchedule(JSON.parse(JSON.stringify(savedSchedules[idx].data)));
    setPage('schedule');
  };

  // delete saved schedule
  const deleteSchedule = idx => {
    setSavedSchedules(prev=>prev.filter((_,i)=>i!==idx));
  };

  // export pins to google maps 
  const handleExportPins = async () => {
    // clear any existing pins
    await fetch('/api/pins', { method:'DELETE' });

    // gather all location pins from location cards and group cards
    const pins = [];
    schedule.forEach(day =>
      ['morning','noon','night'].forEach(slot =>
        day[slot].forEach(item => {
          if (item.lat!=null && item.lng!=null) {
            pins.push(item);
          } else if (item.locations) {
            pins.push(...item.locations);
          }
        })
      )
    );

    // post each pin to the backend
    await Promise.all(
      pins.map(loc =>
        fetch('/api/pins', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({
            name:loc.name,
            lat:loc.lat,
            lng:loc.lng,
            rating:loc.rating,
            reviews:loc.reviews,
            type:loc.type
          })
        })
      )
    );

    // launch the map
    window.open(`${window.location.origin}/export-map.html`, '_blank');
  };

  // convert schedule to pdf with multiple pages 
  const handleConvertPDF = async () => {
    setPdfMode(true);
    await new Promise(r=>setTimeout(r,100));

    const container = document.getElementById('schedule-container');
    html2canvas(container,{ scale:2 })
      .then(canvas=>{
        const pdf = new jsPDF('p','pt','a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = pdfW/imgW;
        const sliceH = pdfH/ratio;

        let offsetY = 0;
        while(offsetY < imgH) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgW;
          pageCanvas.height = Math.min(sliceH, imgH-offsetY);
          pageCanvas
            .getContext('2d')
            .drawImage(canvas,0,offsetY,imgW,pageCanvas.height,0,0,imgW,pageCanvas.height);

          if(offsetY>0) pdf.addPage();
          pdf.addImage(
            pageCanvas.toDataURL('image/png'),
            'PNG',
            0,0,
            pdfW, pageCanvas.height*ratio
          );

          offsetY += sliceH;
        }

        pdf.save('schedule.pdf');
      })
      .catch(err => {
        console.error(err);
        alert('Could not generate PDF.');
      })
      .finally(() => setPdfMode(false));
  };

  // rendering
  return (
    <>
      {page==='initial' && <InitialPage onCreateSchedule={createSchedule} />}

      {page==='schedule' && (
        <SchedulePage
          schedule={schedule}
          onFind={navFind}
          onAdd={navAdd}
          onAddNote={navNote}
          onAddGroup={navGroup}
          onViewGroup={navViewGroup}
          onRemove={removeFromSchedule}
          onRemoveGroup={removeGroup}
          onSave={navSave}
          onLoadSchedules={navLoad}
          onClear={navClear}
          onExportPins={handleExportPins}
          onConvertPDF={handleConvertPDF}
          pdfMode={pdfMode}
        />
      )}

      {page==='find' && (
        <FindLocationPage
          onImport={importLocation}
          onBack={()=>setPage('schedule')}
          savedLocations={savedLocations}
          startingLocation={startingLocation}
          setStartingLocation={setStartingLocation}
          goToAddPage={()=>{
            setContext({mode:'find-add'});
            setPage('add');
          }}
        />
      )}

      {page==='add' && (
        <AddLocationPage
          savedLocations={savedLocations}
          onSelect={selectLocation}
          onRemove={removeSavedLocation}
          onBack={()=>{
            if(context.mode==='schedule-add') return setPage('schedule');
            if(context.mode==='group-add') return setPage('groupLocations');
            return setPage('find');
          }}
        />
      )}

      {page==='note' && (
        <AddNotePage
          onCreate={createNote}
          onCancel={()=>setPage('schedule')}
        />
      )}

      {page==='group' && (
        <AddGroupPage
          onCreate={createGroup}
          onCancel={()=>setPage('schedule')}
        />
      )}

      {page==='groupLocations' && (()=>{
        const {dateIndex,slot,groupIdx} = context;
        const group = schedule[dateIndex][slot][groupIdx];
        return (
          <GroupLocationsPage
            group={group}
            onRemoveLoc={removeLocationFromGroup}
            onAddLoc={()=>{
              setContext({mode:'group-add',dateIndex,slot,groupIdx});
              setPage('add');
            }}
            onBack={()=>setPage('schedule')}
          />
        );
      })()}

      {page==='saveSchedule' && (
        <AddSchedulePage
          onCreate={createScheduleEntry}
          onCancel={()=>setPage('schedule')}
        />
      )}

      {page==='loadSchedules' && (
        <LoadSchedulesPage
          savedSchedules={savedSchedules}
          onLoad={loadSchedule}
          onDelete={deleteSchedule}
          onBack={()=>setPage('schedule')}
        />
      )}
    </>
  );
}

export default App;
