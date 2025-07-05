// client/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import pdfjs from react-pdf
import { pdfjs } from 'react-pdf';

// THIS IS THE CRITICAL LINE
// Make sure this path EXACTLY matches the file name and location in client/public/
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`; // Or /pdf.worker.min.js if that's the name

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);