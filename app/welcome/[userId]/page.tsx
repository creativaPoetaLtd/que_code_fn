"use client"
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button } from 'antd';
import { User, Heart, Shield, Sparkles, Star, Gift, DollarSign, CreditCard, Coins, Banknote, Wallet, Instagram, Facebook, Twitter, Mail, MessageSquare, Plus } from 'lucide-react';
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

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const WelcomeProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserData>({});
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    message: ''
  });

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        try {
          const base64Url = authToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          
          // Check if token is not expired
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            const loggedInUserId = payload?.userId || payload?.id || payload?.sub;
            if (loggedInUserId) {
              setIsLoggedIn(true);
              setCurrentUserId(loggedInUserId);
            }
          } else {
            // Token is expired, remove it
            localStorage.removeItem('authToken');
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    
    checkAuthStatus();
  }, []);

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

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Please fill in all contact form fields');
      return;
    }
    
    console.log('Contact form submitted:', contactForm);
    // Here you would typically send the contact form data to your backend
    alert('Message sent successfully!');
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleAddFriend = () => {
    console.log('Add friend clicked for user:', userId);
    // Here you would implement the add friend functionality
    alert('Friend request sent!');
  };

  const handleSocialMediaClick = (platform: string) => {
    console.log(`Opening ${platform} for user:`, userId);
    // Here you would implement social media links
    alert(`${platform} link clicked!`);
  };

  const handleLoginClick = () => {
    router.push('/auth/login');
  };

  const handleSignupClick = () => {
    router.push('/auth/signup');
  };

  // Function to get the display image (prioritize profileImage over avatar)
  const getDisplayImage = () => {
    return user.profileImage || user.avatar || '';
  };

  if (loading) {
    return (
      <>
      <Header />
        <div className="min-h-screen bg-gradient-to-br from-[#013f47] via-[#025059] to-[#01363d] flex items-center justify-center px-4 relative overflow-hidden">
          {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-[#00B512]/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-[#1fd331]/10 rounded-full blur-xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
            
            {/* Floating Money Icons */}
            {[DollarSign, CreditCard, Coins, Banknote, Wallet].map((Icon, index) => (
              <div key={index} className={`absolute animate-bounce delay-${(index + 1) * 1000}`} 
                   style={{
                     top: `${Math.random() * 80 + 10}%`,
                     left: `${Math.random() * 80 + 10}%`,
                   }}>
                <Icon className="w-4 h-4 md:w-6 md:h-6 text-[#00B512]/25 animate-pulse" />
  </div>
            ))}
  </div>

          {/* Loading Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex flex-col items-center max-w-md w-full relative z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          
            <div className="relative mt-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00B512]/30 border-t-[#00B512] mb-6 shadow-lg"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#00B512] animate-pulse" />
          </div>
          
            <div className="text-center space-y-3">
            <p className="text-[#00313A] font-semibold text-lg">Loading profile...</p>
              <div className="flex items-center justify-center gap-2">
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
      <div className="min-h-screen bg-gradient-to-br from-[#013f47] via-[#025059] to-[#01363d] relative overflow-hidden">
        {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
          {/* Large Background Circles */}
          <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 bg-[#00B512]/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-[#1fd331]/10 rounded-full blur-xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-18 h-18 md:w-28 md:h-28 lg:w-36 lg:h-36 bg-[#00B512]/5 rounded-full blur-lg animate-pulse delay-500"></div>

          {/* Floating Money Icons */}
          {[
            { Icon: DollarSign, position: 'top-16 left-[10%]', delay: 1000 },
            { Icon: CreditCard, position: 'top-1/3 left-[20%]', delay: 1500 },
            { Icon: Coins, position: 'top-2/3 left-[15%]', delay: 2500 },
            { Icon: Banknote, position: 'bottom-1/3 left-[25%]', delay: 3500 },
            { Icon: Wallet, position: 'top-[80%] left-[12%]', delay: 4500 },
            { Icon: CreditCard, position: 'top-20 right-[10%]', delay: 1200 },
            { Icon: Coins, position: 'top-1/2 right-[20%]', delay: 2200 },
            { Icon: Banknote, position: 'bottom-1/3 right-[15%]', delay: 3200 },
            { Icon: Wallet, position: 'top-[75%] right-[25%]', delay: 4200 },
            { Icon: DollarSign, position: 'top-[10%] right-[12%]', delay: 5200 },
          ].map(({ Icon, position, delay }, index) => (
            <div key={index} className={`absolute ${position} animate-bounce delay-${delay}`}>
              <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[#00B512]/25 animate-pulse" />
  </div>
          ))}
  </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 py-8 lg:py-12 flex items-center justify-center min-h-screen relative z-10">
          {/* Desktop Layout: Two Column */}
          <div className="hidden lg:flex w-full max-w-6xl xl:max-w-7xl gap-8 xl:gap-12 items-center">
            {/* Left Side - Profile Information */}
            <div className="flex-1 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 xl:p-12 relative">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
          <Gift className="w-8 h-8 text-white" />
        </div>
        
        {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-6 mt-4 shadow-sm">
            <p className="text-sm font-medium text-center">{error}</p>
          </div>
        )}
        
              {/* Profile Section */}
              <div className="flex flex-col items-center mt-6 mb-8">
                {/* Avatar */}
                {user.showProfileImageOnWelcome && (
                  <div className="relative mb-6">
                    <div className="w-32 h-32 xl:w-40 xl:h-40 bg-gradient-to-br from-[#00313A] to-[#025059] rounded-full flex items-center justify-center shadow-xl border-4 border-white/20 overflow-hidden">
                      {getDisplayImage() ? (
                        <img
                          src={getDisplayImage()}
                          alt="User Profile"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <User className="w-16 h-16 xl:w-20 xl:h-20 text-white" />
                      )}
                      {getDisplayImage() && (
                        <User className="w-16 h-16 xl:w-20 xl:h-20 text-white hidden absolute inset-0 m-auto" />
                      )}
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Star className="w-4 h-4 text-[#00B512]" />
                    </div>
                  </div>
                )}

                {/* User Details */}
        <div className="text-center w-full">
                  <h1 className="text-3xl xl:text-4xl font-bold text-[#00313A] mb-3 leading-tight">
              <b>{user.name}</b> 
                    <span className="inline-block ml-3 text-2xl xl:text-3xl">💸</span>
            </h1>
                  
                  {user.showStatusMessageOnWelcome && user.statusMessage && (
                    <div className="bg-gradient-to-r from-[#00B512]/10 to-[#1fd331]/10 rounded-xl px-6 py-3 mb-4 border border-[#00B512]/20 max-w-md mx-auto">
                      <p className="text-[#00313A] text-sm font-medium italic">
                        "{user.statusMessage}"
                      </p>
                    </div>
                  )}
                  
                  {user.showPhoneOnWelcome && user.phone && (
                    <p className="text-[#00313A]/80 font-medium text-sm mb-4">
                      <b>Tel: </b>+{user.phone}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Sparkles className="w-5 h-5 text-[#00B512] animate-pulse" />
                    <span className="text-lg font-semibold text-[#00313A]">Send Money</span>
                    <Sparkles className="w-5 h-5 text-[#1fd331] animate-pulse delay-300" />
                  </div>
                </div>

                {/* Social Media Icons */}
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => handleSocialMediaClick('Instagram')}
                    className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                  >
                    <Instagram className="w-7 h-7 text-white" />
                  </button>
                  <button
                    onClick={() => handleSocialMediaClick('Facebook')}
                    className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                  >
                    <Facebook className="w-7 h-7 text-white" />
                  </button>
                  <button
                    onClick={() => handleSocialMediaClick('Twitter')}
                    className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                  >
                    <Twitter className="w-7 h-7 text-white" />
                  </button>
                </div>
              </div>

              {/* Debug Info */}
              {error && (
                <div className="bg-gray-50 rounded-2xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">
                    Profile ID: {userId.substring(0, 8)}...
                  </p>
                </div>
              )}
            </div>

            {/* Right Side - Forms */}
            <div className="flex-1 space-y-6">
              {isLoggedIn ? (
                /* Logged in user forms */
                <div className="space-y-6">
                  {/* Money Transfer Form */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 xl:p-10">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-[#00313A] mb-2">Send Money</h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-[#00B512] to-[#1fd331] rounded-full mx-auto"></div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Amount ($)</span>
                          <Sparkles className="w-4 h-4 text-[#00B512] animate-pulse" />
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="h-14 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Password</span>
                          <Shield className="w-4 h-4 text-[#1fd331] animate-pulse delay-150" />
                        </label>
                        <Input.Password
                          placeholder="Enter password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="h-14 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Message</span>
                          <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                        </label>
                        <Input.TextArea
                          placeholder="Enter a message (optional)"
                          className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        type="primary" 
                        className="w-full h-14 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform text-lg"
                        onClick={handleSubmit}
                        disabled={!amount || !password}
                      >
                        <b>Send Money</b>
                      </Button>
                    </div>
                  </div>

                  {/* Add Friend Card */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
                    <Button 
                      type="default" 
                      className="w-full h-14 bg-white border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white transform text-lg"
                      onClick={handleAddFriend}
                    >
                      <span className="flex items-center justify-center gap-3">
                        {/* <Plus className="w-5 h-5" /> */}
                        <b>Add Friend</b>
                      </span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Non-logged in user forms */
                <div className="space-y-6">
                  {/* Money Transfer Form */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 xl:p-10">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-[#00313A] mb-2">Send Money</h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-[#00B512] to-[#1fd331] rounded-full mx-auto"></div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Amount ($)</span>
                          <Sparkles className="w-4 h-4 text-[#00B512] animate-pulse" />
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="h-14 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Message</span>
                          <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                        </label>
                        <Input.TextArea
                          placeholder="Enter a message (optional)"
                          className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        type="primary" 
                        className="w-full h-14 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform text-lg"
                        onClick={handleSubmit}
                        disabled={!amount}
                      >
                        <b>Next</b>
                      </Button>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 xl:p-10">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-[#00313A] mb-2">Contact {user.name}</h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-[#00B512] to-[#1fd331] rounded-full mx-auto"></div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Your Name</span>
                          <User className="w-4 h-4 text-[#00B512] animate-pulse" />
                        </label>
                        <Input
                          placeholder="Enter your name"
                          value={contactForm.name}
                          onChange={e => setContactForm({...contactForm, name: e.target.value})}
                          className="h-14 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Email</span>
                          <Mail className="w-4 h-4 text-[#1fd331] animate-pulse delay-150" />
                        </label>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={contactForm.email}
                          onChange={e => setContactForm({...contactForm, email: e.target.value})}
                          className="h-14 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#00313A] flex items-center gap-2">
                          <span>Message</span>
                          <MessageSquare className="w-4 h-4 text-[#00B512] animate-pulse" />
                        </label>
                        <Input.TextArea
                          placeholder="Enter your message"
                          value={contactForm.message}
                          onChange={e => setContactForm({...contactForm, message: e.target.value})}
                          className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md text-lg"
                          rows={4}
                        />
                      </div>
                      
                      <Button 
                        type="primary" 
                        className="w-full h-14 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform text-lg"
                        onClick={handleContactSubmit}
                        disabled={!contactForm.name || !contactForm.email || !contactForm.message}
                      >
                        <span className="flex items-center justify-center gap-3">
                          {/* <MessageSquare className="w-5 h-5" /> */}
                          <b>Send Message</b>
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Auth Buttons */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-[#00313A] mb-2">Join Our Platform</h3>
                      <p className="text-sm text-[#00313A]/70">Already have an account? Sign in to access more features</p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        type="default" 
                        className="flex-1 h-14 bg-white border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white transform text-lg"
                        onClick={handleLoginClick}
                      >
                        <b>Login</b>
                      </Button>
                      <Button 
                        type="default" 
                        className="flex-1 h-14 bg-[#00B512] border-2 border-[#00B512] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#1fd331] transform text-lg"
                        onClick={handleSignupClick}
                      >
                        <b>Sign Up</b>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout: Single Column */}
          <div className="lg:hidden w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 relative transform hover:scale-[1.02] transition-all duration-300">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-6 mt-4 shadow-sm">
                  <p className="text-sm font-medium text-center">{error}</p>
                </div>
              )}
              
              {/* Mobile Profile Section */}
              <div className="flex flex-col items-center w-full mb-6 mt-4">
                {/* Mobile Avatar */}
          {user.showProfileImageOnWelcome && (
            <div className="relative mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#00313A] to-[#025059] rounded-full flex items-center justify-center shadow-xl border-4 border-white/20 overflow-hidden">
                {getDisplayImage() ? (
                  <img
                    src={getDisplayImage()}
                    alt="User Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                        <User className="w-10 h-10 text-white" />
                )}
                {getDisplayImage() && (
                        <User className="w-10 h-10 text-white hidden absolute inset-0 m-auto" />
                )}
              </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#00B512] to-[#1fd331] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Heart className="w-3 h-3 text-white" />
              </div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Star className="w-2 h-2 text-[#00B512]" />
              </div>
            </div>
          )}

                {/* Mobile User Details */}
          <div className="text-center w-full">
                  <h1 className="text-xl font-bold text-[#00313A] mb-2 leading-tight">
                    <b>{user.name}</b> 
                    <span className="inline-block ml-2 text-lg">💸</span>
                  </h1>
            
            {user.showStatusMessageOnWelcome && user.statusMessage && (
                    <div className="bg-gradient-to-r from-[#00B512]/10 to-[#1fd331]/10 rounded-xl px-3 py-2 mb-3 border border-[#00B512]/20">
                      <p className="text-[#00313A] text-xs font-medium italic">
                  "{user.statusMessage}"
                </p>
              </div>
            )}
            
            {user.showPhoneOnWelcome && user.phone && (
                    <p className="text-[#00313A]/80 font-medium text-xs mb-3">
                <b>Tel: </b>+{user.phone}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#00B512] animate-pulse" />
              <span className="text-sm text-[#00313A] font-medium">Send Money</span>
                    <Sparkles className="w-3 h-3 text-[#1fd331] animate-pulse delay-300" />
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
        
              {/* Mobile Forms based on authentication status */}
              {isLoggedIn ? (
                // Mobile logged in user interface
                <div className="w-full space-y-4">
                  {/* Mobile Money Transfer Form */}
          <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
              <span>Amount ($) </span>
              <Sparkles className="w-3 h-3 text-[#00B512] animate-pulse" />
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
                      className="h-10 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{ fontSize: '14px', fontWeight: '500' }}
            />
          </div>
          
          <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
              <span>Password</span>
              <Shield className="w-3 h-3 text-[#1fd331] animate-pulse delay-150" />
            </label>
            <Input.Password
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
                      className="h-10 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
                      <span>Message</span>
                      <MessageSquare className="w-3 h-3 text-[#00B512] animate-pulse" />
                    </label>
                    <Input.TextArea
                      placeholder="Enter a message (optional)"
                      className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      rows={3}
                      style={{ fontSize: '14px', fontWeight: '500' }}
            />
          </div>
          
          <Button 
            type="primary" 
                    className="w-full h-10 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
            onClick={handleSubmit}
            disabled={!amount || !password}
                    style={{ fontSize: '14px', letterSpacing: '0.5px' }}
                  >
                    <b>Next</b>
                  </Button>

                  {/* Mobile Add Friend Button */}
                  <Button 
                    type="default" 
                    className="w-full h-10 bg-white border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white transform"
                    onClick={handleAddFriend}
                    style={{ fontSize: '14px', letterSpacing: '0.5px' }}
          >
            <span className="flex items-center justify-center gap-2">
                      {/* <Plus className="w-4 h-4" /> */}
                      <b>Add Friend</b>
                    </span>
                  </Button>

                  {/* Mobile Social Media Icons */}
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      onClick={() => handleSocialMediaClick('Instagram')}
                      className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Instagram className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleSocialMediaClick('Facebook')}
                      className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Facebook className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleSocialMediaClick('Twitter')}
                      className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Twitter className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                // Mobile non-logged in user interface
                <div className="w-full space-y-4">
                  {/* Mobile Money Transfer Form */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
                      <span>Amount ($) </span>
                      <Sparkles className="w-3 h-3 text-[#00B512] animate-pulse" />
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="h-10 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
                      <span>Message</span>
                      <MessageSquare className="w-3 h-3 text-[#00B512] animate-pulse" />
                    </label>
                    <Input.TextArea
                      placeholder="Enter a message (optional)"
                      className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      rows={3}
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    />
                  </div>
                  
                  <Button 
                    type="primary" 
                    className="w-full h-10 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
                    onClick={handleSubmit}
                    disabled={!amount}
                    style={{ fontSize: '14px', letterSpacing: '0.5px' }}
                  >
              <b>Next</b>
                  </Button>

                  {/* Mobile Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00B512]/30 to-transparent my-4"></div>

                  {/* Mobile Contact Form */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
                      <span>Your Name</span>
                      <User className="w-3 h-3 text-[#00B512] animate-pulse" />
                    </label>
                    <Input
                      placeholder="Enter your name"
                      value={contactForm.name}
                      onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      className="h-10 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
                      <span>Email</span>
                      <Mail className="w-3 h-3 text-[#1fd331] animate-pulse delay-150" />
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={contactForm.email}
                      onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      className="h-10 rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#00313A] flex items-center gap-2">
                      <span>Message</span>
                      <MessageSquare className="w-3 h-3 text-[#00B512] animate-pulse" />
                    </label>
                    <Input.TextArea
                      placeholder="Enter your message"
                      value={contactForm.message}
                      onChange={e => setContactForm({...contactForm, message: e.target.value})}
                      className="rounded-xl border-2 border-[#00313A]/10 focus:border-[#00B512] transition-all duration-300 shadow-sm hover:shadow-md"
                      rows={3}
                      style={{ fontSize: '14px', fontWeight: '500' }}
                    />
                  </div>
                  
                  <Button 
                    type="primary" 
                    className="w-full h-10 bg-gradient-to-r from-[#00B512] to-[#1fd331] border-none rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
                    onClick={handleContactSubmit}
                    disabled={!contactForm.name || !contactForm.email || !contactForm.message}
                    style={{ fontSize: '14px', letterSpacing: '0.5px' }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {/* <MessageSquare className="w-4 h-4" /> */}
                      <b>Send Message</b>
            </span>
          </Button>

                  {/* Mobile Social Media Icons */}
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      onClick={() => handleSocialMediaClick('Instagram')}
                      className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Instagram className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleSocialMediaClick('Facebook')}
                      className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Facebook className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => handleSocialMediaClick('Twitter')}
                      className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 transform"
                    >
                      <Twitter className="w-5 h-5 text-white" />
                    </button>
        </div>
        
                  {/* Mobile Login and Signup Buttons */}
                  <div className="flex gap-3 mt-4">
                    <Button 
                      type="default" 
                      className="flex-1 h-10 bg-white border-2 border-[#00B512] text-[#00B512] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#00B512] hover:text-white transform"
                      onClick={handleLoginClick}
                      style={{ fontSize: '14px', letterSpacing: '0.5px' }}
                    >
                      <b>Login</b>
                    </Button>
                    <Button 
                      type="default" 
                      className="flex-1 h-10 bg-[#00B512] border-2 border-[#00B512] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#1fd331] transform"
                      onClick={handleSignupClick}
                      style={{ fontSize: '14px', letterSpacing: '0.5px' }}
                    >
                      <b>Sign Up</b>
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Mobile Footer */}
              <div className="mt-6 text-center space-y-2">
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
      </div>
      
        {/* Mobile Navigation */}
    <div className="lg:hidden">
      <Navigation />
        </div>
    </div>
    </>
  );
};

export default WelcomeProfilePage;