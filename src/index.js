import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Toggle this variable to enable or disable maintenance mode
const isMaintenance = true;

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isMaintenance) {
  // Redirect to maintenance page
  window.location.href = "/maintenance.html";
} else {
  root.render(<App />);
}
