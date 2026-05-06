import React from 'react';
import { BACKEND } from "../utils/api";

const Home = () => {
  
  const redirectURL = encodeURIComponent("https://omevo.online/video");

  const handleLogin = (provider) => {
    window.location.href = `${BACKEND}/auth/${provider}?redirect=${redirectURL}`;
  };

  // Styles converted to a React style object
  const styles = {
    bodyWrapper: {
      margin: 0,
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #001f3f, #007bff)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      color: '#fff',
    },
    authContainer: {
      background: 'rgba(0,0,0,0.65)',
      padding: '40px',
      borderRadius: '15px',
      textAlign: 'center',
      width: '90%',
      maxWidth: '400px',
    },
    h1: {
      color: '#1db9ff',
    },
    paragraph: {
      marginTop: '0',
      marginBottom: '20px',
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '12px',
      marginBottom: '15px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '16px',
    },
    icon: {
      width: '24px',
      marginRight: '10px',
    },
    google: { background: '#fff', color: '#000' },
    discord: { background: '#5865f2', color: '#fff' },
    facebook: { background: '#1877f2', color: '#fff' },
  };

  return (
    <div style={styles.bodyWrapper}>
      <div style={styles.authContainer}>
        <h1 style={styles.h1}>Welcome to Omevo</h1>
        <p style={styles.paragraph}>Sign in to continue</p>

        <button
          style={{ ...styles.button, ...styles.google }}
          onClick={() => handleLogin('google')}
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            style={styles.icon} 
          />
          Sign in with Google
        </button>

        <button
          style={{ ...styles.button, ...styles.discord }}
          onClick={() => handleLogin('discord')}
        >
          <img 
            src="https://www.svgrepo.com/show/353655/discord-icon.svg" 
            alt="Discord" 
            style={styles.icon} 
          />
          Sign in with Discord
        </button>

        <button
          style={{ ...styles.button, ...styles.facebook }}
          onClick={() => handleLogin('facebook')}
        >
          <img 
            src="https://www.svgrepo.com/show/157806/facebook.svg" 
            alt="Facebook" 
            style={styles.icon} 
          />
          Sign in with Facebook
        </button>
      </div>
    </div>
  );
};

export default Home;
