"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Copy, CreditCard, Send, Share2, User, Download, Square, Plus } from 'lucide-react';
import baseUrl from '@/helpers/baseUrl';
import { getUserBalance, getEntityBalance } from '@/helpers/api';

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
            const authToken = localStorage.getItem('authToken');
            if (authToken) {
                try {
                    const base64Url = authToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));

                    if (!userId || userId === 'undefined') {
                        const tokenUserId = payload?.userId || payload?.id || payload?.sub;

                        if (tokenUserId) {
                            await fetchUserDataById(tokenUserId);
                            return;
                        }
                    }
                } catch (tokenError) {
                    throw new Error('Invalid token');
                }
            }

            if (!userId || userId === 'undefined') {
                setError('User ID is not available. Please try logging in again.');
                setLoading(false);
                return;
            }
            await fetchUserDataById(userId);
            // Fetch wallet balance - try both user and organization
            setBalanceLoading(true);
            setBalanceError(null);
            try {

                // First try as user
                let response;
                try {
                    response = await getEntityBalance(userId, 'user');
                } catch (userError) {
                    // If user fails, try as organization
                    response = await getEntityBalance(userId, 'organization');
                    throw userError;
                }

                if (response.success && response.data) {
                    setBalance(Number(response.data.balance));
                } else {
                    setBalanceError('Invalid balance data received');
                }
            } catch (err) {
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
                // Try user endpoint first, then organization endpoint
                const userUrl = `${baseUrl}/users/${id}`;
                const organizationUrl = `${baseUrl}/organizations/${id}`;
                const profileUrl = `${baseUrl}/profiles?userId=${encodeURIComponent(id)}&organizationId=${encodeURIComponent(id)}`;

                const [userRes, organizationRes, profileRes] = await Promise.allSettled([
                    axios.get(userUrl, { headers }),
                    axios.get(organizationUrl, { headers }),
                    axios.get(profileUrl, { headers }),
                ]);

                let firstName = '';
                let lastName = '';
                let qrCode = '';

                // Check if user data was successful
                if (userRes.status === 'fulfilled') {
                    const userData = userRes.value.data;
                    firstName = userData.firstName || '';
                    lastName = userData.lastName || '';
                } else if (organizationRes.status === 'fulfilled') {
                    // If user failed but organization succeeded, use organization data
                    const orgData = organizationRes.value.data;
                    firstName = orgData.name || '';
                    lastName = '';
                } else {
                    const userErr = userRes.reason;
                    const orgErr = organizationRes.reason;
                }

                if (profileRes.status === 'fulfilled') {
                    const profile = profileRes.value.data;
                    qrCode = profile.qrCode || '';
                } else {
                    const err = profileRes.reason;
                    if (axios.isAxiosError(err)) {
                        const status = err.response?.status;
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
        } catch (error) {
            throw new Error('Failed to copy link');
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
                throw new Error('Failed to share link');
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
                                    router.push('/logout');
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header with Profile Link */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-end">
                <button 
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#00B512] text-[#00B512] hover:bg-[#00B512]/5 transition-colors text-sm font-medium"
                >
                    <User size={18} />
                    <span>See your profile page</span>
                </button>
            </div>

            {/* QR Code Section */}
            <div className="p-6 sm:p-8 flex flex-col items-center">
                <div className="bg-[#00B512]/10 border-2 border-[#00B512] p-6 sm:p-8 rounded-3xl mb-6">
                    {user.qrCode ? (
                        <img
                            src={user.qrCode}
                            alt="QR Code"
                            className="w-48 sm:w-56 h-auto object-contain"
                        />
                    ) : (
                        <div className="w-48 sm:w-56 h-48 sm:h-56 bg-gray-300 rounded-lg flex items-center justify-center">
                            <span className="text-gray-600">No QR Code</span>
                        </div>
                    )}
                </div>

                {/* Share Link Section */}
                <div className="w-full max-w-2xl mb-6">
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 rounded-2xl p-3 sm:p-4">
                        <input
                            type="text"
                            value={userLink}
                            readOnly
                            className="flex-1 bg-transparent text-xs sm:text-sm text-gray-600 outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#00313A] hover:bg-[#004D5C] transition text-white"
                                aria-label="Copy"
                                title="Copy"
                            >
                                <Copy size={18} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#00313A] hover:bg-[#004D5C] transition text-white"
                                aria-label="Share"
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <button
                        onClick={() => router.push('/home/transfer')}
                        className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 border-gray-200 hover:border-[#00B512] hover:bg-[#00B512]/5 transition-colors group"
                    >
                        <Send size={24} className="text-green-500 group-hover:text-[#00B512]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Send</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 border-gray-200 hover:border-[#00B512] hover:bg-[#00B512]/5 transition-colors group">
                        <Download size={24} className="text-green-500 group-hover:text-[#00B512]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Request</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 border-gray-200 hover:border-[#00B512] hover:bg-[#00B512]/5 transition-colors group">
                        <CreditCard size={24} className="text-green-500 group-hover:text-[#00B512]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Pay</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 border-gray-200 hover:border-[#00B512] hover:bg-[#00B512]/5 transition-colors group">
                        <Plus size={24} className="text-green-500 group-hover:text-[#00B512]" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Top up</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountInfo;
