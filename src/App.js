import React, { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logout } from './firebase'; // Import authentication functions
import Login from './Login';
import FisherTail from './Fishertail';
import SettingsModal from './Settings'; // Import SettingsModal
import EmergencySms from './EmergencySms'; // Import EmergencySms
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for Settings modal
  const [isEmergencySmsOpen, setIsEmergencySmsOpen] = useState(false); // State for EmergencySms modal

  // Monitor authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); // Sign out the user
      setUser(null); // Update state to reflect the user is logged out
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  };

  const openSettings = () => setIsModalOpen(true);
  const closeSettings = () => setIsModalOpen(false);
  
  const openEmergencySms = () => setIsEmergencySmsOpen(true);
  const closeEmergencySms = () => setIsEmergencySmsOpen(false);

  return (
    <div className="App">
      {user ? (
        <>
          <FisherTail user={user} logout={handleLogout} /> {/* Render FisherTail if logged in */}
          <button onClick={openSettings}>Settings</button> {/* Button to open settings modal */}
          <button onClick={openEmergencySms}>Send Emergency SMS</button> {/* Button to open Emergency SMS modal */}
          
          <SettingsModal 
            modalSettings={isModalOpen} 
            closeSettings={closeSettings} 
            handleLogout={handleLogout} 
          />

          <EmergencySms 
            isOpen={isEmergencySmsOpen} 
            onRequestClose={closeEmergencySms} 
          /> {/* Emergency SMS modal */}

        </>
      ) : (
        <Login loginWithGoogle={loginWithGoogle} /> // Render Login page if not logged in
      )}
    </div>
  );
}

export default App;
