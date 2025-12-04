'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const { isLoggedIn, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    // Redirect if not logged in
    if (!isLoggedIn) {
      router.push('/auth/login?returnUrl=/admin');
      return;
    }

    // Check if user has admin privileges (adjust this logic based on your user structure)
    // if (user && !user.isAdmin && !user.isSuperAdmin && user.accountType !== 'admin' && user.accountType !== 'super_admin') {
    //   router.push('/home');
    //   return;
    // }
  }, [isLoggedIn, user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-700">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  // Check admin privileges
//   if (user && !user.isAdmin && !user.isSuperAdmin && user.accountType !== 'admin' && user.accountType !== 'super_admin') {
//     return (
//       <div 
//         className="min-h-screen flex items-center justify-center text-white"
//         style={{
//           background: `radial-gradient(1400px 900px at 10% -10%, #17624b 0%, #06130f 35%, #040f0c 100%)`
//         }}
//       >
//         <div className="text-center">
//           <div className="text-xl font-semibold mb-2">Access Denied</div>
//           <div className="text-slate-400 mb-4">You don't have permission to access the admin dashboard.</div>
//           <button
//             onClick={() => router.push('/home')}
//             className="px-4 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-500 transition-colors"
//           >
//             Return to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

  return <AdminDashboard />;
}