'use client';

import type React from 'react';

import store from '@/lib/redux-store';
import { Provider } from 'react-redux';
import { NotificationProvider } from '@/context/NotificationContext';
import { ChatProvider } from '@/context/ChatContext';
import { AuthProvider } from '@/context/AuthContext';

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>{children}</ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </Provider>
  );
};

export default ClientProvider;
