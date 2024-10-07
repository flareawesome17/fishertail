import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import './History.css'; // Optional: for styling

const History = ({ deviceId }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const historyRef = ref(db, `devices/${deviceId}/history`);

    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      const historyArray = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : [];
      setHistory(historyArray);
    });

    return () => unsubscribe();
  }, [deviceId]);

  return (
    <div className="history-container">
      <h2>Device History for {deviceId}</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td>{new Date(entry.timestamp).toLocaleString()}</td>
              <td>{entry.latitude}</td>
              <td>{entry.longitude}</td>
              <td>{entry.speed} km/h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
