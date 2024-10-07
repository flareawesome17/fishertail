import React from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from './fishertail_logo.jpeg'; // Import the logo image
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';



const Login = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User:', user);
      navigate('/'); // Navigate after successful login
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="FisherTail Logo" />
        </div>
        <h1>FisherTail</h1>
        
      </header>

      {/* Login Container */}
      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">Login</h2>
          <button onClick={handleLogin} className="login-button">
            Login with Google
          </button>
        </div>
      </div>
    </>
  );
};

export default Login;
