import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { useAuth } from './store/auth';
import './index.css';

// Hydrate auth state on app start
const { hydrate } = useAuth.getState();
hydrate();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
