import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Standalone browser preview: cap the body width so the UI doesn't stretch
// edge-to-edge on wide displays. Inside Figma the plugin iframe is its own
// constraint, so we don't apply the cap there.
if (window.parent === window) {
  document.body.classList.add('standalone');
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
