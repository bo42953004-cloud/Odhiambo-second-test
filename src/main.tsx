import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './digit-tools/index.css';
import App from './digit-tools/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
