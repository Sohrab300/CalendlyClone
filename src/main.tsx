import {initSentry} from './lib/sentry';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ErrorBoundary} from '@sentry/react';
import App from './App.tsx';
import './index.css';

initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
