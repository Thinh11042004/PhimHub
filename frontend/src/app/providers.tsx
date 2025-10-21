import React from 'react';
// import { QueryClientProvider } from '@tanstack/react-query';
// import { RouterProvider } from 'react-router-dom';
// import { ThemeProvider } from 'styled-components';
// import { Toaster } from 'react-hot-toast';

const Providers = ({ children }: { children: React.ReactNode }) => {
  // Wrap with QueryClient, Router, Theme, Toaster, etc.
  return <>{children}</>;
};

export default Providers;
