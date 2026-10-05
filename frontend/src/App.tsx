import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './features/auth';
import AppRoutes from './routes/AppRoutes';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        {/* {import.meta.env.DEV && <DevAuthSwitcher />} */}
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;