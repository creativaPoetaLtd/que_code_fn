'use client';

import PublicProfileView from '@/components/profile/PublicProfileView';

/**
 * The public profile page. The view itself lives in components/ so the same thing
 * can be opened as a modal from chat — one profile, one implementation.
 */
export default function WelcomeProfilePage() {
  return <PublicProfileView />;
}
