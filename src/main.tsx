import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './stil.css';

const wurzel = document.getElementById('wurzel');
if (!wurzel) throw new Error('Wurzelelement fehlt.');

createRoot(wurzel).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
