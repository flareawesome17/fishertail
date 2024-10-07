import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, get, child, remove } from 'firebase/database';
import { loadModules } from 'esri-loader';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faTrash } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import logo from './fishertail_logo.jpeg'; // Import the logo image
import compassImage from './compass.png'; // Import the compass image
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
import SettingsModal from './Settings.js'; // Adjust the path if needed
import EmergencySms from './EmergencySms.js'; // Adjust the path if needed
import './header.css';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS





// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

Modal.setAppElement('#root');

const FisherTail = ({user, logout}) => {
  const [location, setLocation] = useState({ lat: 0, lng: 0, speed: 0 });
  const [view, setView] = useState(null);
  const [graphicsLayer, setGraphicsLayer] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [deviceID, setDeviceID] = useState('');
  const [userName, setUserName] = useState('');
  const [address, setaddress] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [modalSettings, setSettingsIsOpen] = useState(false);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [smsIsOpen, setSmsIsOpen] = useState(false);
  const [history, setHistory] = useState([]); // Initialize as an empty array

  

  useEffect(() => {
    const devicesRef = ref(database, 'devices');
    onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDevices(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        setFilteredDevices(Object.keys(data).map(key => ({ id: key, ...data[key] })));
  
        // Do not automatically select a device, unless user picks it
        // We only set the device data for selectedDevice, not active updates.
        if (selectedDevice) {
          const selectedDeviceData = data[selectedDevice];
          if (selectedDeviceData) {
            const newLocation = {
              lat: selectedDeviceData.latitude || 0,
              lng: selectedDeviceData.longitude || 0,
              speed: selectedDeviceData.speed || 0,
              lastUpdated: selectedDeviceData.timestamp || Date.now(),
              user: selectedDeviceData.userName || 'Unknown',
              deviceID: selectedDeviceData.deviceId || '',
              address: selectedDeviceData.address || '',
              history: selectedDeviceData.history ? Object.values(selectedDeviceData.history) : [] // Ensure history is fetched
            };
            setLocation(newLocation);
            setHistory(selectedDeviceData.history ? Object.values(selectedDeviceData.history) : []);
          }
        }
      }
    });
  }, [selectedDevice],[showAllDevices]); // Re-run the effect only when the selected device changes
  
  

  useEffect(() => {
    loadModules([
      'esri/views/MapView',
      'esri/WebMap',
      'esri/Graphic',
      'esri/layers/GraphicsLayer',
      'esri/geometry/Point',
      'esri/widgets/Compass'
    ])
      .then(([MapView, WebMap, Graphic, GraphicsLayer, Point, Compass]) => {
        const webMap = new WebMap({
          basemap: 'streets-navigation-vector',
        });

        const view = new MapView({
          container: 'map',
          map: webMap,
          center: [121.7740, 12.8797], // Center the map to the Philippines
          zoom: 5, // Adjust the zoom level as needed
          ui: {
            components: [] // Remove all default UI components
          }
        });

        const graphicsLayer = new GraphicsLayer();
        webMap.add(graphicsLayer);

        const compass = new Compass({
          view: view,
        });

        // Add only specific UI components you want
        view.ui.add(compass, 'top-left');

        setView(view);
        setGraphicsLayer(graphicsLayer);
      })
      .catch((err) => console.error(err));

    return () => {
      if (view) {
        view.destroy();
        setView(null);
      }
    };
  }, []);

  useEffect(() => {
    if (view && graphicsLayer) {
      loadModules(['esri/Graphic', 'esri/geometry/Point'])
        .then(([Graphic, Point]) => {
          graphicsLayer.removeAll(); // Clear previous graphics

          if (showAllDevices) {
            // Render all devices on the map
            devices.forEach((device) => {
              const deviceRef = ref(database, `/devices/${device.id}`); // Use the correct key for fetching
              onValue(deviceRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                  const point = new Point({
                    longitude: data.longitude,
                    latitude: data.latitude,
                  });

                  const markerSymbol = {
                    type: 'simple-marker',
                    color: 'orange',
                    outline: {
                      color: 'red',
                      width: 1,
                    },
                  };

                  const markerGraphic = new Graphic({
                    geometry: point,
                    symbol: markerSymbol,
                  });

                  graphicsLayer.add(markerGraphic);
                }
              });
            });
          } else if (selectedDevice) {
            // Render the selected device only
            const point = new Point({
              longitude: location.lng,
              latitude: location.lat,
            });

            const markerSymbol = {
              type: 'simple-marker',
              color: 'red',
              outline: {
                color: 'orange',
                width: 1,
              },
            };

            const markerGraphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
            });

            graphicsLayer.add(markerGraphic);
          }

          // Optionally, adjust map center to fit all device markers
          if (showAllDevices && devices.length > 0) {
            const centerLat = devices.reduce((sum, d) => sum + (d.latitude || 0), 0) / devices.length;
            const centerLng = devices.reduce((sum, d) => sum + (d.longitude || 0), 0) / devices.length;
            view.center = [centerLng, centerLat];
            view.zoom = 9; // Adjust zoom level
          } else if (selectedDevice) {
            view.center = [location.lng, location.lat];
          }
        })
        .catch((err) => console.error(err));
    }
  }, [location, view, graphicsLayer, showAllDevices, devices, selectedDevice]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkDeviceStatus();
    }, 60000); // Check every minute
  
    return () => clearInterval(interval); // Clean up on unmount
  }, [devices]); // Re-run the check whenever the devices array changes
  


  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };



  const openSettings = () => {
    setSettingsIsOpen(true);
  }
  
  const closeSettings = () => {
    setSettingsIsOpen(false);
  }

  const openSms = () => {
    setSmsIsOpen(true);
  }

  const closeSms = () => {
    setSmsIsOpen(false);
  }

  const handleSearchClick = () => {
    setShowSearch(!showSearch); // Toggle search visibility
    setSearchError(''); // Clear any previous errors
  };

  const emergencyHotlines = ['09154545879']; // Example hotlines

  const handleSendEmergencySms = () => {
    // Logic for sending SMS
    console.log("Sending emergency SMS...");
    // Close the SMS modal after sending
    setSmsIsOpen(false);
  };


  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  
    if (value) {
      const filtered = devices.filter(device => {
        const matchesDeviceId = device.deviceId.toString().includes(value);
        const matchesUserName = device.userName.toLowerCase().includes(value.toLowerCase());
        return matchesDeviceId || matchesUserName;
      });
  
      setFilteredDevices(filtered);
  
      if (filtered.length === 0) {
        setSearchError('Device not found');
      } else {
        setSearchError(''); // Reset error if found
      }
    } else {
      setFilteredDevices(devices); // Restore the full list when search query is empty
      setSearchError('');
    }
  };

  const checkDeviceStatus = () => {
    const thirtyMinutesInMs = 30 * 60 * 1000; // 30 minutes in milliseconds
    const currentTime = Date.now();
    const devicesToWarn = [];
  
    devices.forEach(device => {
      const lastUpdatedTime = device.timestamp || 0;
      const timeSinceLastUpdate = currentTime - lastUpdatedTime;
  
      if (timeSinceLastUpdate > thirtyMinutesInMs) {
        devicesToWarn.push({ ...device, timeSinceLastUpdate });
      }
    });
  
    if (devicesToWarn.length > 0) {
      devicesToWarn.forEach(device => {
        const timeSinceLastUpdate = device.timeSinceLastUpdate;
        const hours = Math.floor(timeSinceLastUpdate / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        let durationMessage = '';
  
        if (weeks > 0) {
          durationMessage = `${weeks} week${weeks > 1 ? 's' : ''}`;
        } else if (days > 0) {
          durationMessage = `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
          durationMessage = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
          const minutes = Math.floor((timeSinceLastUpdate % (1000 * 60 * 60)) / (1000 * 60));
          durationMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
  
        // Show toast notification for each device that has stopped transmitting
        toast.warning(
          `The device with device ID: ${device.deviceId} - ${device.userName} has stopped transmitting for over ${durationMessage}!`,
          {
            position: "top-right",
            autoClose: 10000, // Automatically close after 60 seconds
          }
        );
      });
    }
  };
  
  
  
  

  const updateLocationInFirebase = (newLocation, history) => {
    const deviceRef = ref(database, `/devices/${selectedDevice}`);
    update(deviceRef, {
      latitude: newLocation.lat,
      longitude: newLocation.lng,
      
      timestamp: newLocation.timestamp,
      history: [...(history || []), {
        latitude: newLocation.lat,
        longitude: newLocation.lng,
        timestamp: newLocation.timestamp,
      }]
    });
  };
  
  

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    const devicesRef = ref(database, 'devices');
    const newDeviceKey = `device${devices.length + 1}`;

    const newDeviceData = {
        deviceId: deviceID,
        userName: userName,
        address: address,
        timestamp: 0,
        latitude: 0,
        longitude: 0,
        speed: 0,
    };

    try {
        await update(devicesRef, { [newDeviceKey]: newDeviceData });
        setDeviceID('');
        setUserName('');
        closeModal();
        toast.success(`Device ${deviceID} ${userName} added successfully.`);
    } catch (error) {
        console.error("Error adding device:", error);
        toast.error("Error adding device. Please try again."); // Display error toast
    }
};

  

 

const handleDelete = async (deviceId) => {
  // Show confirmation dialog
  const confirmDelete = window.confirm("Are you sure you want to delete this device?");
  
  if (confirmDelete) {
      const deviceRef = ref(database, `/devices/${deviceId}`);
      try {
          await remove(deviceRef);
          setDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
          toast.success(`The ${deviceId} deleted successfully.`); // Success notification

          // Clear selection if the deleted device was selected
          if (selectedDevice === deviceId) {
              setSelectedDevice('');
              setShowAllDevices(false);
          }
      } catch (error) {
          toast.error("Error deleting device. Please try again."); // Display error toast
      }
  } else {
      toast.info("Device deletion canceled."); // Info message if canceled
  }
};

 
  
  
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
  
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12; // Convert to 12-hour format
    hours = hours ? hours : 12; // If hours = 0, set it to 12 (midnight)
  
    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  const LocationHistory = ({ history }) => {
    if (!history || history.length === 0) {
        return <div>No history available</div>; // Handle empty history
    }

    return (
        <div className="location-history">
          <h3>Device Location History</h3>
            {history.map((item, index) => (
                <div key={index}>
                    <p>Lat: {item.latitude}</p>
                    <p>Lng: {item.longitude}</p>
                    <p>Timestamp: {new Date(item.timestamp).toLocaleString()}</p>
                </div>
            ))}
        </div>
    );
};

  


  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="FisherTail Logo" />
        </div>
        <h1>FisherTail</h1>
       
        <div className="header-search">
          <button onClick={handleSearchClick} className="search-button">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <span>Search</span>
          </button>
        </div>

      
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className='navigation'><h2>Navigation</h2>
          <ul>
            <li onClick={openModal}>Add Device</li>
            <li onClick={openSettings}>Settings</li>
            <li onClick={openSms}>Send Emergency SMS</li>
           
          </ul>
          <h2>Device List</h2>
        </div>
        <div>
        <ul className='devices'>
          {devices.map((device) => (
            <li key={device.id} onClick={() => {
              setSelectedDevice(device.id); // Use the 'id' of the device object
              setShowAllDevices(false);
            }}>
              {device.deviceId.toUpperCase()} {/* Convert the 'deviceId' to uppercase */}
              <div className="device-actions">
                <FontAwesomeIcon
                  icon={faTrash}
                  onClick={() => handleDelete(device.id)} // Use 'id' for deletion
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </li>
          ))}
        </ul>

        </div>
        {/*<button onClick={() => setShowAllDevices(!showAllDevices)}>
          {showAllDevices ? 'Show Selected Device' : 'Show All Devices'}
        </button>*/}
        <footer className='footer'>
          <p>&copy; 2024 FisherTail</p>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
        <div className="info-box">
          <h3>Device Current Location</h3>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.lng}</p>
          <p>Speed: {location.speed} km/h</p>
          <p>Last Updated: {formatDate(location.lastUpdated)}</p>
        </div>

        <div className="device-details-box">
          <h3>Vessel Owner</h3>
          <p>User's Name: {location.user}</p>
          <p>Device ID: {location.deviceID}</p>
          <p>Address: {location.address}</p>
        </div>

        <LocationHistory history={location.history} /> {/* Pass the history here */}

        {/* Compass Image */}
        <div className="compass-container">
          <img src={compassImage} alt="Compass" className="compass" />
        </div>
      </main>


      {showSearch && (
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by Device ID or Username"
            value={query}
            onChange={handleSearchChange}
          />
          {searchError && <p className="error-message">{searchError}</p>}
          <ul className="search-results">
            {filteredDevices.map((device) => (
              <li
                key={device.id}
                className="search-result-item"
                onClick={() => {
                  setSelectedDevice(device.id);
                  setShowAllDevices(false);
                  setShowSearch(false);
                }}
              >
                {device.deviceId} - {device.userName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ToastContainer /> {/* ToastContainer component to display the toast notifications */}




      {/* Add Device Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Add Device"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>Add Device</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Registration ID:
            <input
              type="text"
              value={deviceID}
              onChange={(e) => setDeviceID(e.target.value)}
              required
            />
          </label>
          <label>
            User's Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </label>
          <label>
            Address:
            <input
              type="text"
              value={address}
              onChange={(e) => setaddress(e.target.value)}
              required
            />
          </label>
          <button type="submit">Add Device</button>
          <button type="button" onClick={closeModal}>Close</button>
        </form>
      </Modal>

      {/* Settings */}
      {modalSettings && (
        <SettingsModal
          modalSettings={modalSettings}
          closeSettings={closeSettings}
          handleLogout={logout}
          user={user} // Pass user information
        />
      )}

      {/* Emergency SMS modal */}
      <EmergencySms 
        isOpen={smsIsOpen} 
        onRequestClose={closeSms} 
        onSend={handleSendEmergencySms} 
          
        /> 



      
    </div>
  );
};

export default FisherTail;

