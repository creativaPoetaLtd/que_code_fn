"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Copy, CreditCard, Send, Share2 } from 'lucide-react';
import baseUrl from '@/helpers/baseUrl';
import { getUserBalance } from '@/helpers/api';

interface AccountInfoProps {
    userId: string;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ userId }) => {
        const router = useRouter();
    
    const [user, setUser] = useState({ firstName: '', lastName: '', qrCode: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            console.log('AccountInfo received userId:', userId);
            console.log('Type of userId:', typeof userId);
            console.log('URL pathname:', window.location.pathname);

            const authToken = localStorage.getItem('authToken');
            if (authToken) {
                try {
                    const base64Url = authToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));
                    console.log('Token payload:', payload);

                    if (!userId || userId === 'undefined') {
                        const tokenUserId = payload?.userId || payload?.id || payload?.sub;
                        console.log('Fallback userId from token:', tokenUserId);

                        if (tokenUserId) {
                            await fetchUserDataById(tokenUserId);
                            return;
                        }
                    }
                } catch (tokenError) {
                    console.error('Error decoding token:', tokenError);
                }
            }

            if (!userId || userId === 'undefined') {
                setError('User ID is not available. Please try logging in again.');
                setLoading(false);
                return;
            }
            await fetchUserDataById(userId);
            // Fetch wallet balance
            setBalanceLoading(true);
            setBalanceError(null);
            try {
                console.log('AccountInfo - fetching balance for userId:', userId);
                const response = await getUserBalance(userId);
                console.log('AccountInfo - balance response received:', response);
                
                if (response.success && response.data) {
                    setBalance(Number(response.data.balance));
                } else {
                    setBalanceError('Invalid balance data received');
                }
            } catch (err) {
                console.error('AccountInfo - balance fetch error:', err);
                setBalanceError('Could not fetch balance');
            } finally {
                setBalanceLoading(false);
            }
        };

        const fetchUserDataById = async (id: string) => {
            try {
                setLoading(true);
                setError(null);

                const authToken = localStorage.getItem('authToken');
                const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

                console.log('Fetching user data for ID:', id);

                const userUrl = `${baseUrl}/users/${id}`;
                const profileUrl = `${baseUrl}/profiles?userId=${encodeURIComponent(id)}`;
                console.log('User API URL:', userUrl);
                console.log('Profile API URL:', profileUrl);

                const [userRes, profileRes] = await Promise.allSettled([
                    axios.get(userUrl, { headers }),
                    axios.get(profileUrl, { headers }),
                ]);

                let firstName = '';
                let lastName = '';
                let qrCode = '';

                if (userRes.status === 'fulfilled') {
                    const userData = userRes.value.data;
                    console.log('User data received:', userData);
                    firstName = userData.firstName || '';
                    lastName = userData.lastName || '';
                } else {
                    const err = userRes.reason;
                    console.error('Error fetching user data:', err);
                }

                if (profileRes.status === 'fulfilled') {
                    const profile = profileRes.value.data;
                    console.log('Profile data received:', profile);
                    qrCode = profile.qrCode || '';
                } else {
                    const err = profileRes.reason;
                    console.error('Error fetching user profile:', err);
                    if (axios.isAxiosError(err)) {
                        const status = err.response?.status;
                        console.error('Profile API Error Status:', status);
                        console.error('Profile API Error Data:', err.response?.data);
                        if (status === 400) {
                            // Keep non-blocking; still show user names if available
                            setError((prev) => prev ?? 'Missing profile query.');
                        }
                    }
                }

                if (!firstName && !lastName && !qrCode) {
                    setError('Failed to load user data. Please try again.');
                }

                setUser({
                    firstName,
                    lastName,
                    qrCode,
                });
            } catch (error) {
                console.error('Unexpected error fetching profile/user:', error);
                setError('Failed to load user data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const handleCopy = async () => {
        try {
            const userLink = `https://yourdomain.com/welcome/${userId}`;
            await navigator.clipboard.writeText(userLink);
            console.log('URL copied to clipboard');
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                const userLink = `https://yourdomain.com/welcome/${userId}`;
                await navigator.share({
                    title: 'My QR Code',
                    url: userLink,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            handleCopy();
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <p className="ml-4 text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <div className="space-x-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Retry
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('authToken');
                                    window.location.href = '/auth/login';
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Re-login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const userLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/welcome/${userId}`;


    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
            <div className="mb-6 sm:mb-8">
                <p className="text-sm sm:text-md font-medium text-[#00313A]">Hello👋 Welcome Back!!</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#00313A] mt-1">
                    {user.firstName} {user.lastName}
                </h3>
                
                {/* Balance Display */}
                <div className="mt-4 p-4 bg-gradient-to-r from-[#00313A] to-[#00252e] rounded-lg">
                    <p className="text-sm text-gray-300 mb-1">Available Balance</p>
                    <h4 className="text-2xl font-bold text-white">
                        {balanceLoading ? 'Loading...' : balanceError ? balanceError : `RWF ${balance?.toLocaleString()}`}
                    </h4>
                    <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-green-400">+12.5% this month</span>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                    <div className="bg-[#EEF4FF] p-3 sm:p-4 rounded-lg">
                        {user.qrCode ? (
                            <img
                                src={user.qrCode}
                                alt="QR Code"
                                className="w-32 sm:w-40 md:w-48 h-auto object-contain"
                            />
                        ) : (
                            <div className="w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500">No QR Code</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4">
                    <div className="w-full sm:w-auto">
                        <p className="text-sm md:text-md text-gray-600 px-3 py-2 bg-[#EEF4FF] rounded-lg truncate max-w-[280px] sm:max-w-none">
                            <a
                                href={userLink}
                                className="text-[#00313A] hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {userLink}
                            </a>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center w-10 h-10 bg-[#EEF4FF] rounded-full hover:bg-gray-200 transition"
                            aria-label="Share"
                        >
                            <Share2 size={20} color="#00B512" />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center w-10 h-10 bg-[#EEF4FF] rounded-full hover:bg-gray-200 transition"
                            aria-label="Copy"
                        >
                            <Copy size={20} color="#00B512" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-center gap-8 sm:gap-12 mt-6 sm:mt-8">
                    <button 
                    onClick={() => router.push('/home/transfer')}
                    className="flex flex-col items-center group"
                    >
                        <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                            <Send size={24} className="text-green-600" />
                        </span>
                        <span className="text-sm font-medium text-gray-700">Send</span>
                    </button>
                    <button className="flex flex-col items-center group">
                        <span className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                            <CreditCard size={24} className="text-green-600" />
                        </span>
                        <span className="text-sm font-medium text-gray-700">Top Up</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountInfo;
