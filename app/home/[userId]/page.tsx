import { HomePageLayout } from '@/components/HomePageLayout';
import React from 'react';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const UserHomePage = () => {
  return <HomePageLayout />;
};

export default UserHomePage; 