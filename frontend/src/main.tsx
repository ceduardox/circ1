import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// En desarrollo, los service workers (p.ej. el de OneSignal) pueden cachear
// HTML/módulos viejos de Vite y provocar pantalla en blanco hasta un hard reload.
// Se desregistran solo en localhost; en producción OneSignal mantiene su SW para push.
async function unregisterServiceWorkers() {
  if (typeof window === 'undefined' || window.location.hostname !== 'localhost') return;
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch {
      // no bloquear el arranque
    }
  }
}
void unregisterServiceWorkers();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" theme="system" />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);