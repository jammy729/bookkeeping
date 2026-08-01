import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { BusinessProvider } from './context/BusinessContext';
import './i18n';
import App from './App';
import './index.css';

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="bookkeeping-theme">
        <BusinessProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BusinessProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
