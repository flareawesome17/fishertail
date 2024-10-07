import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import logo from './fishertail_logo.jpeg'; // Import the logo image
import './header.css';

const Header = ({ onSearchClick }) => {
  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="FisherTail Logo" />
      </div>
      <h1>FisherTail</h1>

      {/* Search button */}
      <div className="header-search">
        <button onClick={onSearchClick} className="search-button">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <span>Search</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
