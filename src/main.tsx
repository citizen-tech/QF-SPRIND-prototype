import { MantineProvider } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Schriften selbst ausgeliefert, nicht von einem fremden Dienst geladen.
// Bei einem Verwaltungswerkzeug ist das kein Detail: keine Anfrage verlässt
// die Seite.
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-serif/latin-400.css';
import '@fontsource/ibm-plex-serif/latin-400-italic.css';

import '@mantine/core/styles.css';
import './stil.css';

import App from './ui/App';
import { thema } from './ui/thema';

const wurzel = document.getElementById('wurzel');
if (!wurzel) throw new Error('Wurzelelement fehlt.');

createRoot(wurzel).render(
  <StrictMode>
    <MantineProvider theme={thema} defaultColorScheme="light" forceColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
);
