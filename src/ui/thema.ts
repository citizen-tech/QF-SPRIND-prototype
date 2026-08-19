import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Amtsblau — die einzige kräftige Farbe der Oberfläche. Sie trägt ausschließlich
// Werte des Quadratic Funding. Vergleichsverfahren bleiben grau.
const amt: MantineColorsTuple = [
  '#eff4f8',
  '#dde7ef',
  '#b8cbdd',
  '#93b0cb',
  '#7599bc',
  '#6289b2',
  '#5782ae',
  '#476f99',
  '#2d5f8b',
  '#12456d',
];

// Ocker — ausschließlich für Hinweise: synthetische Daten, modellierte
// Verfahren, erreichte Obergrenzen. Nie dekorativ.
const ocker: MantineColorsTuple = [
  '#fbf6ea',
  '#f5ecd8',
  '#ead7ac',
  '#dfc07d',
  '#d6ad57',
  '#d1a13f',
  '#cf9b32',
  '#b78725',
  '#a3771d',
  '#8a5a0b',
];

const graphit: MantineColorsTuple = [
  '#f5f6f7',
  '#e9ebed',
  '#d2d6da',
  '#b8bec6',
  '#a2aab4',
  '#939ca8',
  '#8a94a2',
  '#78818e',
  '#6a737f',
  '#59626e',
];

export const thema = createTheme({
  primaryColor: 'amt',
  primaryShade: 9,
  colors: { amt, ocker, graphit },

  // Oberfläche in Plex Sans, jede Zahl in Plex Mono. Der Gegenstand ist
  // Nachrechenbarkeit — die Ziffern bekommen ein eigenes Gesicht.
  fontFamily:
    "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontFamilyMonospace: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",

  headings: {
    fontFamily:
      "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.05rem', lineHeight: '1.15' },
      h2: { fontSize: '1.3rem', lineHeight: '1.25' },
      h3: { fontSize: '1.02rem', lineHeight: '1.35' },
      h4: { fontSize: '0.9rem', lineHeight: '1.4' },
    },
  },

  defaultRadius: 'sm',
  radius: { sm: '3px', md: '5px' },

  white: '#ffffff',
  black: '#101418',

  components: {
    Button: { defaultProps: { fw: 500 } },
    Table: { defaultProps: { verticalSpacing: 'xs', horizontalSpacing: 'md' } },
  },
});
