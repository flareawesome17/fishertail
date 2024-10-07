import React, { useState } from 'react';
import Modal from 'react-modal';

// Ensure that your app root element is set
Modal.setAppElement('#root');

const SettingsModal = ({ modalSettings, closeSettings, handleLogout, user }) => { // Accept user as a prop
  const [activeSection, setActiveSection] = useState('');

  const renderContent = () => {
    switch (activeSection) {
      case 'Profile':
        return (
          <div className='profile-content'>
            <img src={user.photoURL} alt='Profile' className='profile-picture' />
            <div className='profile-info'>
              <p><strong>Name:</strong> {user.displayName}</p>
              <p><strong>Email:</strong> {user.email}</p> {/* Or any other info you want to display */}
            </div>
          </div>
        );
      case 'About':
        return <div>A tracking system for a fishing boat is a web-based system that allows users to connect to a GPS tracker installed on a fishing boat. The purpose of this system is to track the longitude and latitude of the boat as it navigates the sea.</div>;
      
      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  return (
    <Modal
      isOpen={modalSettings}
      onRequestClose={closeSettings}
      contentLabel="Settings"
      className="modal-settings"
      overlayClassName="modal-overlay"
    >
      <aside className='settings-side-bar'>
        <h3>App Settings</h3>
        <ul>
          <li onClick={() => setActiveSection('Profile')}>Profile</li>
          <li onClick={() => setActiveSection('About')}>About FisherTail</li>
          
          <li onClick={handleLogout}>Logout</li> {/* Use the prop here */}
        </ul>
      </aside>

      <main className='settings-content'>
        {renderContent()}
      </main>

      <button type="button" className="settings-close" onClick={closeSettings}>Close</button>
    </Modal>
  );
};

export default SettingsModal;
