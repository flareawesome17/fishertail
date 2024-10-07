import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { getDatabase, ref, onValue } from 'firebase/database';
import axios from 'axios';
import Select from 'react-select';
import './EmergencySms.css';
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

Modal.setAppElement('#root');

const EmergencySms = ({ isOpen, onRequestClose }) => {
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceData, setDeviceData] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationHistory, setLocationHistory] = useState([]);

    const phone = '+639073192870'; // Coast Guard Sample Number

    // Fetch devices from Firebase
    useEffect(() => {
        const db = getDatabase();
        const devicesRef = ref(db, 'devices');

        const unsubscribe = onValue(devicesRef, (snapshot) => {
            const devices = snapshot.val();
            if (devices) {
                const devicesArray = Object.keys(devices).map(key => ({
                    deviceId: key,
                    userName: devices[key].userName,
                }));
                setDeviceData(devicesArray);
            } else {
                setDeviceData([]);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Fetch current location and last 5 history locations for the selected device
    const handleDeviceSelection = (selectedOption) => {
        if (!selectedOption) {
            setSelectedDevice(null);
            setCurrentLocation(null);
            setLocationHistory([]);
            return;
        }

        const selectedDeviceInfo = deviceData.find(device => device.deviceId === selectedOption.deviceId);
        
        if (selectedDeviceInfo) {
            setSelectedDevice(selectedDeviceInfo); 
        } else {
            setSelectedDevice(null);
            return;
        }

        const db = getDatabase();

        // Fetch current location data directly from the selected device
        const currentLocationRef = ref(db, `devices/${selectedOption.deviceId}`);
        const unsubscribeLocation = onValue(currentLocationRef, (snapshot) => {
            const deviceData = snapshot.val();
            if (deviceData) {
                const currentLoc = {
                    latitude: deviceData.latitude || 0,
                    longitude: deviceData.longitude || 0,
                    timestamp: deviceData.timestamp || Date.now(),
                };
                setCurrentLocation(currentLoc);

                // Fetch last 5 locations from history
                const history = deviceData.history || {};
                const lastFiveLocations = Object.values(history).slice(-5); 
                setLocationHistory(lastFiveLocations);
            } else {
                setCurrentLocation(null);
                setLocationHistory([]);
            }
        });

        return () => {
            unsubscribeLocation();
        };
    };

    // Helper to format the time difference
    const getTimeDifference = (lastTimestamp) => {
        const now = Date.now();
        const diffInSeconds = Math.floor((now - lastTimestamp) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} second(s)`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute(s)`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour(s)`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day(s)`;
        } else {
            const weeks = Math.floor(diffInSeconds / 604800);
            return `${weeks} week(s)`;
        }
    };

    // Handle sending an SMS using SMSChef API
    const sendEmergencySMS = async () => {
        if (!selectedDevice || !currentLocation) {
            toast.info('Please select a device and ensure current location data is available.');
            return;
        }
    
        const timeDifference = getTimeDifference(currentLocation.timestamp);
        let message = `Emergency Alert: The vessel (${selectedDevice.userName} - ${selectedDevice.deviceId}) has stopped transmitting for over ${timeDifference}. The last known location is Latitude: ${currentLocation.latitude}, Longitude: ${currentLocation.longitude}. Last updated: ${new Date(currentLocation.timestamp).toLocaleString()}.\n\n`;
    
        if (locationHistory.length > 0) {
            message += 'Location History (Last 5):\n';
            locationHistory.forEach((location, index) => {
                message += `#${index + 1}: Latitude: ${location.latitude}, Longitude: ${location.longitude}, Timestamp: ${new Date(location.timestamp).toLocaleString()}\n`;
            });
        } else {
            message += 'No location history available.';
        }
    
        console.log("SMS Message Body:", message);
    
        try {
            const response = await axios.post('http://localhost/php/index.php', {
                phone: phone,
                message: message,
            }, {
                headers: {
                    'Content-Type': 'application/json' // Set the content type to JSON
                }
            });
    
            if (response.data.success) {
                toast.success('Emergency SMS sent successfully.');
            } else {
                toast.error('Failed to send emergency SMS. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error.message);
            toast.error(`Failed to send emergency SMS: ${error.message}`);
        }
    };
    

    

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose} 
            contentLabel="Emergency SMS" 
            className="modal-sms" 
            overlayClassName="modal-overlay"
        >
            <h2 className="modal-title">Send Emergency SMS</h2>

            <div className="device-selection">
                <label className="device-label">Select Device:</label>
                <Select 
                    className="device-dropdown"
                    options={deviceData.map(device => ({
                        value: device.deviceId,
                        label: `${device.userName} - ${device.deviceId}`,
                        deviceId: device.deviceId
                    }))}
                    onChange={handleDeviceSelection}
                    placeholder="Search and select a device"
                    isClearable
                />
            </div>

            {currentLocation ? (
                <div className="location-info">
                    <p className="location-header"><strong>Current Location:</strong></p>
                    <p className="location-data">Latitude: {currentLocation.latitude}</p>
                    <p className="location-data">Longitude: {currentLocation.longitude}</p>
                    <p className="location-data">Last Updated: {new Date(currentLocation.timestamp).toLocaleString()}</p>
                </div>
            ) : (
                <p>No current location data available for the selected device.</p>
            )}

            {locationHistory.length > 0 ? (
                <div className="location-info">
                    <p className="location-header"><strong>Location History (Last 5):</strong></p>
                    {locationHistory.map((location, index) => (
                        <div key={index} className="location-history-item">
                            <p className="location-data">Latitude: {location.latitude}</p>
                            <p className="location-data">Longitude: {location.longitude}</p>
                            <p className="location-data">Timestamp: {new Date(location.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No location history available for the selected device.</p>
            )}

            <div className="button-group">
                <button onClick={sendEmergencySMS} className="send-sms-button">Send Emergency SMS to Coast Guard</button>
                <button onClick={onRequestClose} className="close-modal-button">Close</button>
            </div>

        </Modal>
    );
};

export default EmergencySms;
