"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input, Button } from 'antd';
import { User, Heart, Shield, Sparkles, Star, Gift, DollarSign, CreditCard, Coins, Banknote, Wallet } from 'lucide-react';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';

interface UserData {
  name?: string;
  profileImage?: string;
  avatar?: string;
  phone?: string;
  statusMessage?: string;
  showPhoneOnWelcome?: boolean;
  showProfileImageOnWelcome?: boolean;
  showStatusMessageOnWelcome?: boolean;
}

const WelcomeProfilePage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserData>({});
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${baseUrl}/users/${userId}`);
        const data = response.data;
        
        let name = '';
        if (data.firstName || data.lastName) {
          name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        } else if (data.name) {
          name = data.name;
        } else if (data.username) {
          name = data.username;
        } else if (data.displayName) {
          name = data.displayName;
        } else {
          name = 'User';
        }
        
        setUser({
          name,
          profileImage: data.profileImage || '',
          avatar: data.avatar || data.photo || data.profilePicture || '',
          phone: data.phone || data.phoneNumber || data.mobile || '',
          statusMessage: data.statusMessage || '',
          showPhoneOnWelcome: data.showPhoneOnWelcome !== undefined ? data.showPhoneOnWelcome : true,
          showProfileImageOnWelcome: data.showProfileImageOnWelcome !== undefined ? data.showProfileImageOnWelcome : true,
          showStatusMessageOnWelcome: data.showStatusMessageOnWelcome !== undefined ? data.showStatusMessageOnWelcome : true,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser({ 
          name: 'User', 
          profileImage: '',
          avatar: '',
          phone: '',
          statusMessage: '',
          showPhoneOnWelcome: true,
          showProfileImageOnWelcome: true,
          showStatusMessageOnWelcome: true,
        });
        setError(`Could not load profile data for user ID: ${userId.substring(0, 8)}...`);
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSubmit = () => {
    if (!amount || !password) {
      alert('Please fill in both amount and password');
      return;
    }
    
    console.log('Submitting:', { amount, password, userId });
  };

  // Function to get the display image (prioritize profileImage over avatar)
  const getDisplayImage = () => {
    return user.profileImage || user.avatar || '';
  };

  if (loading) {
    return (
      <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#013f47] via-[#025059] to-[#01363d] flex items-center justify-center relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
  {/* Background blur circles */}
  <div className="absolute top-10 left-10 w-32 h-32 bg-[#00B512]/10 rounded-full blur-xl animate-pulse"></div>
  <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#1fd331]/10 rounded-full blur-xl animate-pulse delay-700"></div>
  <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
  <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-[#00B512]/5 rounded-full blur-lg animate-pulse delay-500"></div>

  {/* Floating icons - LEFT SIDE */}
  <div className="absolute top-16 left-[10%] animate-bounce delay-1000">
    <DollarSign className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-1/3 left-[20%] animate-bounce delay-1500">
    <CreditCard className="w-5 h-5 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute top-2/3 left-[15%] animate-bounce delay-2500">
    <Coins className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute bottom-1/3 left-[25%] animate-bounce delay-3500">
    <Banknote className="w-5 h-5 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute top-[80%] left-[12%] animate-bounce delay-4500">
    <Wallet className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-[20%] left-[28%] animate-bounce delay-5500">
    <DollarSign className="w-5 h-5 text-[#1fd331]/20 animate-pulse" />
  </div>

  {/* Floating icons - RIGHT SIDE */}
  <div className="absolute top-20 right-[10%] animate-bounce delay-1200">
    <CreditCard className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-1/2 right-[20%] animate-bounce delay-2200">
    <Coins className="w-5 h-5 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute bottom-1/3 right-[15%] animate-bounce delay-3200">
    <Banknote className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-[75%] right-[25%] animate-bounce delay-4200">
    <Wallet className="w-7 h-7 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute top-[10%] right-[12%] animate-bounce delay-5200">
    <DollarSign className="w-5 h-5 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute bottom-[15%] right-[28%] animate-bounce delay-6200">
    <CreditCard className="w-6 h-6 text-[#1fd331]/25 animate-pulse" />
  </div>
</div>

        
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-12 flex flex-col items-center max-w-md w-full mx-4 relative z-10">
          {/* Decorative top border */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          
          <div className="relative mt-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00B512]/30 border-t-[#00B512] mb-6 shadow-lg"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#00B512] animate-pulse" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-[#00313A] font-semibold text-lg">Loading profile...</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-[#00B512] animate-pulse" />
              <Star className="w-4 h-4 text-[#1fd331] animate-pulse delay-150" />
              <Star className="w-4 h-4 text-[#00B512] animate-pulse delay-300" />
            </div>
          </div>
        </div>
        
        <div className="lg:hidden">
          <Navigation /> 
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gradient-to-br from-[#013f47] via-[#025059] to-[#01363d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements with floating money icons */}
      <div className="absolute inset-0 overflow-hidden">
  {/* Background blur circles */}
  <div className="absolute top-10 left-10 w-32 h-32 bg-[#00B512]/10 rounded-full blur-xl animate-pulse"></div>
  <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#1fd331]/10 rounded-full blur-xl animate-pulse delay-700"></div>
  <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
  <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-[#00B512]/5 rounded-full blur-lg animate-pulse delay-500"></div>

  {/* Floating icons - LEFT SIDE */}
  <div className="absolute top-16 left-[10%] animate-bounce delay-1000">
    <DollarSign className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-1/3 left-[20%] animate-bounce delay-1500">
    <CreditCard className="w-5 h-5 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute top-2/3 left-[15%] animate-bounce delay-2500">
    <Coins className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute bottom-1/3 left-[25%] animate-bounce delay-3500">
    <Banknote className="w-5 h-5 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute top-[80%] left-[12%] animate-bounce delay-4500">
    <Wallet className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-[20%] left-[28%] animate-bounce delay-5500">
    <DollarSign className="w-5 h-5 text-[#1fd331]/20 animate-pulse" />
  </div>

  {/* Floating icons - RIGHT SIDE */}
  <div className="absolute top-20 right-[10%] animate-bounce delay-1200">
    <CreditCard className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-1/2 right-[20%] animate-bounce delay-2200">
    <Coins className="w-5 h-5 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute bottom-1/3 right-[15%] animate-bounce delay-3200">
    <Banknote className="w-6 h-6 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute top-[75%] right-[25%] animate-bounce delay-4200">
    <Wallet className="w-7 h-7 text-[#1fd331]/25 animate-pulse" />
  </div>
  <div className="absolute top-[10%] right-[12%] animate-bounce delay-5200">
    <DollarSign className="w-5 h-5 text-[#00B512]/25 animate-pulse" />
  </div>
  <div className="absolute bottom-[15%] right-[28%] animate-bounce delay-6200">
    <CreditCard className="w-6 h-6 text-[#1fd331]/25 animate-pulse" />
  </div>
</div>

      
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col items-center max-w-md w-full relative z-10 transform hover:scale-[1.02] transition-all duration-300">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
          <Gift className="w-8 h-8 text-white" />
        </div>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-6 w-full mt-4 shadow-sm">
            <p className="text-sm font-medium text-center">{error}</p>
          </div>
        )}
        
        {/* Profile Section: Enhanced with profile image/avatar and status message */}
        <div className="flex flex-col items-center w-full mb-8 mt-4">
           {/* Enhanced Name and Details */}
        <div className="text-center w-full">
            <h1 className="text-2xl font-bold text-[#00313A] mb-2 leading-tight">
              <b>{user.name}</b> 
              <span className="inline-block ml-2 text-xl">💸</span>
            </h1>
            </div>
          {/* Enhanced Avatar/Profile Image */}
          {user.showProfileImageOnWelcome && (
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00313A] to-[#025059] rounded-full flex items-center justify-center shadow-xl border-4 border-white/20 overflow-hidden">
                {getDisplayImage() ? (
                  <img
                    src={getDisplayImage()}
                    alt="User Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Fallback to User icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                {/* Fallback User icon (hidden by default, shown on image error) */}
                {getDisplayImage() && (
                  <User className="w-12 h-12 text-white hidden absolute inset-0 m-auto" />
                )}
              </div>
              {/* Multiple decorative elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <Star className="w-3 h-3 text-[#00B512]" />
              </div>
            </div>
          )}

          {/* Enhanced Name and Details */}
          <div className="text-center w-full">
            
            {/* Status Message - Display when available */}
            {user.showStatusMessageOnWelcome && user.statusMessage && (
              <div className="bg-gradient-to-r from-[#00B512]/10 to-[#1fd331]/10 rounded-xl px-4 py-2 mb-3 border border-[#00B512]/20">
                <p className="text-[#00313A] text-sm font-medium italic">
                  "{user.statusMessage}"
                </p>
              </div>
            )}
            
            {user.showPhoneOnWelcome && user.phone && (
              <p className="text-[#00313A]/80 font-medium text-sm mb-3">
                <b>Tel: </b>+{user.phone}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00B512] animate-pulse" />
              <span className="text-sm text-[#00313A] font-medium">Send Money</span>
              <Sparkles className="w-4 h-4 text-[#1fd331] animate-pulse delay-300" />
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00B512]/30 to-transparent mb-6"></div>
        
        {/* Debug Info */}
        {error && (
          <div className="bg-gray-50 rounded-2xl px-4 py-2 mb-6 shadow-inner">
            <p className="text-xs text-gray-400 text-center">
              Profile ID: {userId.substring(0, 8)}...
            </p>
          </div>
        )}
        
        {/* Enhanced Form */}
        <div className="w-full space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
              <span>Amount ($) </span>
              <Sparkles className="w-3 h-3 text-[#00B512] animate-pulse" />
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
              style={{
                fontSize: '16px',
                fontWeight: '500'
              }}
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
              <span>Password</span>
              <Shield className="w-3 h-3 text-[#1fd331] animate-pulse delay-150" />
            </label>
            <Input.Password
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
              style={{
                fontSize: '16px',
                fontWeight: '500'
              }}
            />
          </div>
          
          <Button 
            type="primary" 
            className="w-full h-12 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:from-[#00B512] hover:to-[#1fd331] transform"
            onClick={handleSubmit}
            disabled={!amount || !password}
            style={{
              fontSize: '16px',
              letterSpacing: '0.5px'
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <b>Next</b>
            </span>
          </Button>
        </div>
        
        {/* Enhanced Footer */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Star className="w-3 h-3 text-[#00B512] animate-pulse" />
            <Star className="w-3 h-3 text-[#1fd331] animate-pulse delay-150" />
            <Star className="w-3 h-3 text-[#00B512] animate-pulse delay-300" />
          </div>
          <p className="text-xs text-[#00313A] font-medium">
            QiewCode Made with <Heart className="w-3 h-3 text-[#00B512] inline mx-1 animate-pulse" />for you
          </p>
        </div>
      </div>
      
    </div>
    <div className="lg:hidden">
      <Navigation />
    </div>
    </>
  );
};

export default WelcomeProfilePage;