import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import baseUrl from "@/helpers/baseUrl";
import { useUserInfo } from "@/hooks/use-user-info";
import { useAuthToken } from "@/hooks/use-auth-token";
import { toast } from "@/hooks/use-toast";
import { 
  UserData, 
  OrganizationData, 
  ProfileData, 
  ProfileFormData, 
  FileUploadData,
  GalleryItem,
  ApiResponse 
} from "@/types/settings.types";

export const useProfileData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // User/Organization data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  
  // Profile data
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // Form data
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    profileType: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    tinNumber: "",
    statusMessage: "",
    showPhoneOnWelcome: true,
    showProfileImageOnWelcome: true,
    showStatusMessageOnWelcome: true,
    showProfileTypeOnWelcome: true,
    showLocationOnWelcome: true,
    showTinOnWelcome: true,
    showLogoOnWelcome: true,
    showCategoryOnWelcome: true,
    showSocialLinksOnWelcome: true,
    showGalleryOnWelcome: true,
    showOrgStatsOnWelcome: true,
    showActionsOnWelcome: true,
    showSendMoneyOnWelcome: true,
    showContactFormOnWelcome: true,
    showOtherInfoOnWelcome: true,
    showFriendRequestOnWelcome: true,
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  });
  
  // File upload data
  const [fileUploadData, setFileUploadData] = useState<FileUploadData>({
    profileImageFile: null,
    profileImagePreview: null,
    logoFile: null,
    operationalDocumentFile: null,
  });

  // Gallery data
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySubmitting, setGallerySubmitting] = useState(false);
  const [galleryItemLoading, setGalleryItemLoading] = useState<Record<string, boolean>>({});

  const userInfo = useUserInfo();
  const { getToken } = useAuthToken();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateGalleryImage = (file: File): boolean => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'image/webp', 'image/bmp', 'image/tiff', 'image/jfif', 'image/tif'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (PNG, JPG, JPEG, GIF, WebP, BMP, TIFF, JFIF, TIF)",
        variant: "destructive",
      });
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size (${formatFileSize(file.size)}) exceeds the 10MB limit.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const resolveGalleryBaseUrl = () => {
    if (organizationData?.id) {
      return `${baseUrl}/organizations/${organizationData.id}/gallery`;
    }
    if (userInfo.userId) {
      return `${baseUrl}/profiles/${userInfo.userId}/gallery`;
    }
    return null;
  };

  const fetchGallery = useCallback(async () => {
    const galleryUrl = resolveGalleryBaseUrl();
    if (!galleryUrl) return;

    try {
      setGalleryLoading(true);
      const authToken = getToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const response = await axios.get(galleryUrl, { headers });
      setGalleryItems(Array.isArray(response.data?.items) ? response.data.items : []);
    } catch {
      setGalleryItems([]);
    } finally {
      setGalleryLoading(false);
    }
  }, [organizationData?.id, userInfo.userId, getToken]);

  const uploadGalleryItem = async (file: File, caption: string): Promise<boolean> => {
    if (!validateGalleryImage(file)) return false;
    const galleryUrl = resolveGalleryBaseUrl();
    if (!galleryUrl) return false;

    try {
      setGallerySubmitting(true);
      const authToken = getToken();
      if (!authToken) {
        toast({ title: "Authentication required", description: "Please log in again.", variant: "destructive" });
        return false;
      }

      const formData = new FormData();
      formData.append('image', file);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      await axios.post(galleryUrl, formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      toast({ title: "Uploaded", description: "Gallery image uploaded successfully." });
      await fetchGallery();
      return true;
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.response?.data?.message || "Could not upload image.",
        variant: "destructive",
      });
      return false;
    } finally {
      setGallerySubmitting(false);
    }
  };

  const updateGalleryItem = async (
    itemId: string,
    updates: { caption?: string; image?: File }
  ): Promise<boolean> => {
    const galleryUrl = resolveGalleryBaseUrl();
    if (!galleryUrl) return false;

    const hasCaption = typeof updates.caption === 'string';
    const hasImage = !!updates.image;
    if (!hasCaption && !hasImage) {
      toast({ title: "No changes", description: "Provide a new caption and/or image.", variant: "destructive" });
      return false;
    }

    if (updates.image && !validateGalleryImage(updates.image)) {
      return false;
    }

    try {
      setGalleryItemLoading(prev => ({ ...prev, [itemId]: true }));
      const authToken = getToken();
      if (!authToken) {
        toast({ title: "Authentication required", description: "Please log in again.", variant: "destructive" });
        return false;
      }

      const formData = new FormData();
      if (hasImage && updates.image) {
        formData.append('image', updates.image);
      }
      if (hasCaption && updates.caption !== undefined) {
        formData.append('caption', updates.caption);
      }

      await axios.put(`${galleryUrl}/${itemId}`, formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      toast({ title: "Updated", description: "Gallery item updated successfully." });
      await fetchGallery();
      return true;
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.response?.data?.message || "Could not update item.",
        variant: "destructive",
      });
      return false;
    } finally {
      setGalleryItemLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const deleteGalleryItem = async (itemId: string): Promise<boolean> => {
    const galleryUrl = resolveGalleryBaseUrl();
    if (!galleryUrl) return false;

    try {
      setGalleryItemLoading(prev => ({ ...prev, [itemId]: true }));
      const authToken = getToken();
      if (!authToken) {
        toast({ title: "Authentication required", description: "Please log in again.", variant: "destructive" });
        return false;
      }

      await axios.delete(`${galleryUrl}/${itemId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      toast({ title: "Deleted", description: "Gallery item deleted." });
      await fetchGallery();
      return true;
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || "Could not delete item.",
        variant: "destructive",
      });
      return false;
    } finally {
      setGalleryItemLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const fetchUserAndProfile = useCallback(async () => {
    if (!userInfo.isAuthenticated || !userInfo.userId) {
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const authToken = getToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      const userUrl = `${baseUrl}/users/${userInfo.userId}`;
      const organizationUrl = `${baseUrl}/organizations/${userInfo.userId}`;

      const [userRes, organizationRes] = await Promise.allSettled([
        axios.get(userUrl, { headers }),
        axios.get(organizationUrl, { headers }),
      ]);

      let effectiveUserId = userInfo.userId;
      let effectiveOrganizationId = "";

      // Handle user data
      if (userRes.status === 'fulfilled') {
        const data = userRes.value.data;
        setUserData({
          id: userInfo.userId,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
        });
        setOrganizationData(null);
      } else if (organizationRes.status === 'fulfilled') {
        // Handle organization data
        const orgData = organizationRes.value.data;
        setOrganizationData({
          id: userInfo.userId,
          name: orgData.name || "",
          type: orgData.type || "",
          ownerName: orgData.ownerName || "",
          ownerPhone: orgData.ownerPhone || "",
          ownerEmail: orgData.ownerEmail || "",
          contactPhone: orgData.contactPhone || "",
          tinNumber: orgData.tinNumber || "",
          categoryId: orgData.categoryId || "",
          Category: orgData.Category,
        });
        setUserData(null);
        effectiveUserId = "";
        effectiveOrganizationId = userInfo.userId;
      }

      // Fetch profile data
      const profileUrl = `${baseUrl}/profiles?userId=${encodeURIComponent(effectiveUserId)}&organizationId=${encodeURIComponent(effectiveOrganizationId)}`;
      
      try {
        const profileRes = await axios.get(profileUrl, { headers });
        const profile = profileRes.data;
        
        setProfileId(profile.id || null);
        setProfileData(profile);
        
        // Update form data with profile data
        setProfileFormData({
          profileType: profile.type || "",
          province: profile.province || "",
          district: profile.district || "",
          sector: profile.sector || "",
          cell: profile.cell || "",
          tinNumber: profile.tinNumber || "",
          statusMessage: profile.statusMessage || "",
          showPhoneOnWelcome: profile.showPhoneOnWelcome !== undefined ? profile.showPhoneOnWelcome : true,
          showProfileImageOnWelcome: profile.showProfileImageOnWelcome !== undefined ? profile.showProfileImageOnWelcome : true,
          showStatusMessageOnWelcome: profile.showStatusMessageOnWelcome !== undefined ? profile.showStatusMessageOnWelcome : true,
          showProfileTypeOnWelcome: profile.showProfileTypeOnWelcome !== undefined ? profile.showProfileTypeOnWelcome : true,
          showLocationOnWelcome: profile.showLocationOnWelcome !== undefined ? profile.showLocationOnWelcome : true,
          showTinOnWelcome: profile.showTinOnWelcome !== undefined ? profile.showTinOnWelcome : true,
          showLogoOnWelcome: profile.showLogoOnWelcome !== undefined ? profile.showLogoOnWelcome : true,
          showCategoryOnWelcome: profile.showCategoryOnWelcome !== undefined ? profile.showCategoryOnWelcome : true,
          showSocialLinksOnWelcome: profile.showSocialLinksOnWelcome !== undefined ? profile.showSocialLinksOnWelcome : true,
          showGalleryOnWelcome: profile.showGalleryOnWelcome !== undefined ? profile.showGalleryOnWelcome : true,
          showOrgStatsOnWelcome: profile.showOrgStatsOnWelcome !== undefined ? profile.showOrgStatsOnWelcome : true,
          showActionsOnWelcome: profile.showActionsOnWelcome !== undefined ? profile.showActionsOnWelcome : true,
          showSendMoneyOnWelcome: profile.showSendMoneyOnWelcome !== undefined ? profile.showSendMoneyOnWelcome : true,
          showContactFormOnWelcome: profile.showContactFormOnWelcome !== undefined ? profile.showContactFormOnWelcome : true,
          showOtherInfoOnWelcome: profile.showOtherInfoOnWelcome !== undefined ? profile.showOtherInfoOnWelcome : true,
          showFriendRequestOnWelcome: profile.showFriendRequestOnWelcome !== undefined ? profile.showFriendRequestOnWelcome : true,
          instagram: profile.socialLinks?.instagram || "",
          facebook: profile.socialLinks?.facebook || "",
          twitter: profile.socialLinks?.twitter || "",
          linkedin: profile.socialLinks?.linkedin || "",
        });
        
        // Update file preview if profile image exists
        if (profile.profileImage) {
          setFileUploadData(prev => ({
            ...prev,
            profileImagePreview: profile.profileImage,
          }));
        }

        const galleryBaseUrl = effectiveOrganizationId
          ? `${baseUrl}/organizations/${effectiveOrganizationId}/gallery`
          : `${baseUrl}/profiles/${effectiveUserId}/gallery`;
        try {
          setGalleryLoading(true);
          const galleryRes = await axios.get(galleryBaseUrl, { headers });
          setGalleryItems(Array.isArray(galleryRes.data?.items) ? galleryRes.data.items : []);
        } catch {
          setGalleryItems([]);
        } finally {
          setGalleryLoading(false);
        }
      } catch (profileError) {
        // Profile might not exist yet, which is fine
      }

      if (userRes.status === 'rejected' && organizationRes.status === 'rejected') {
        setError('Failed to load user data.');
      }
    } catch (err) {
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  }, [userInfo.isAuthenticated, userInfo.userId, getToken]);

  const updateProfileFormData = (updates: Partial<ProfileFormData>) => {
    setProfileFormData(prev => ({ ...prev, ...updates }));
  };

  const updateFileUploadData = (updates: Partial<FileUploadData>) => {
    setFileUploadData(prev => ({ ...prev, ...updates }));
  };

  const handleImageChange = (file: File) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/jfif', 'image/tif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (PNG, JPG, JPEG, GIF, WebP, BMP, TIFF, JFIF, TIF)",
        variant: "destructive",
      });
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size (${formatFileSize(file.size)}) exceeds the 5MB limit. Please select a smaller image.`,
        variant: "destructive",
      });
      return false;
    }
    
    setError("");
    setFileUploadData(prev => ({
      ...prev,
      profileImageFile: file,
      profileImagePreview: URL.createObjectURL(file),
    }));
    
    toast({
      title: "Image selected",
      description: `${file.name} has been selected for upload.`,
    });
    
    return true;
  };

  const handleLogoChange = (file: File) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/jfif', 'image/tif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid logo file type",
        description: "Please select a valid image file for the logo",
        variant: "destructive",
      });
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Logo file too large",
        description: `Logo file size (${formatFileSize(file.size)}) exceeds the 5MB limit.`,
        variant: "destructive",
      });
      return false;
    }
    
    setFileUploadData(prev => ({ ...prev, logoFile: file }));
    toast({
      title: "Logo selected",
      description: `${file.name} has been selected for upload.`,
    });
    
    return true;
  };

  const handleOperationalDocumentChange = (file: File) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff', 'image/jfif', 'image/tif',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid document file type",
        description: "Please select a valid file (Images or PDF)",
        variant: "destructive",
      });
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Document file too large",
        description: `Document file size (${formatFileSize(file.size)}) exceeds the 5MB limit.`,
        variant: "destructive",
      });
      return false;
    }
    
    setFileUploadData(prev => ({ ...prev, operationalDocumentFile: file }));
    toast({
      title: "Document selected",
      description: `${file.name} has been selected for upload.`,
    });
    
    return true;
  };

  const clearProfileImage = () => {
    setFileUploadData(prev => ({
      ...prev,
      profileImageFile: null,
      profileImagePreview: null,
    }));
    toast({
      title: "Profile image removed",
      description: "Profile image has been removed. Save changes to apply.",
    });
  };

  const clearLogo = () => {
    setFileUploadData(prev => ({ ...prev, logoFile: null }));
    toast({
      title: "Logo removed",
      description: "Logo has been removed. Save changes to apply.",
    });
  };

  const clearOperationalDocument = () => {
    setFileUploadData(prev => ({ ...prev, operationalDocumentFile: null }));
    toast({
      title: "Document removed",
      description: "Operational document has been removed. Save changes to apply.",
    });
  };

  const saveProfile = async (): Promise<boolean> => {
    if (!userInfo.userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please log in again.",
        variant: "destructive",
      });
      return false;
    }

    if (!profileFormData.profileType) {
      toast({
        title: "Validation Error",
        description: "Please select a profile type.",
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const authToken = getToken();
      const authHeader = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const hasFiles = !!(fileUploadData.profileImageFile || fileUploadData.logoFile || fileUploadData.operationalDocumentFile);

      const profilePayload = {
        type: profileFormData.profileType,
        ...(organizationData ? 
          { organizationId: organizationData.id } : 
          { userId: userInfo.userId }
        ),
        province: profileFormData.province || undefined,
        district: profileFormData.district || undefined,
        sector: profileFormData.sector || undefined,
        cell: profileFormData.cell || undefined,
        tinNumber: profileFormData.tinNumber || undefined,
        statusMessage: profileFormData.statusMessage,
        showPhoneOnWelcome: profileFormData.showPhoneOnWelcome,
        showProfileImageOnWelcome: profileFormData.showProfileImageOnWelcome,
        showStatusMessageOnWelcome: profileFormData.showStatusMessageOnWelcome,
        showProfileTypeOnWelcome: profileFormData.showProfileTypeOnWelcome,
        showLocationOnWelcome: profileFormData.showLocationOnWelcome,
        showTinOnWelcome: profileFormData.showTinOnWelcome,
        showLogoOnWelcome: profileFormData.showLogoOnWelcome,
        showCategoryOnWelcome: profileFormData.showCategoryOnWelcome,
        showSocialLinksOnWelcome: profileFormData.showSocialLinksOnWelcome,
        showGalleryOnWelcome: profileFormData.showGalleryOnWelcome,
        showOrgStatsOnWelcome: profileFormData.showOrgStatsOnWelcome,
        showActionsOnWelcome: profileFormData.showActionsOnWelcome,
        showSendMoneyOnWelcome: profileFormData.showSendMoneyOnWelcome,
        showContactFormOnWelcome: profileFormData.showContactFormOnWelcome,
        showOtherInfoOnWelcome: profileFormData.showOtherInfoOnWelcome,
        showFriendRequestOnWelcome: profileFormData.showFriendRequestOnWelcome,
        socialLinks: {
          instagram: profileFormData.instagram || undefined,
          facebook: profileFormData.facebook || undefined,
          twitter: profileFormData.twitter || undefined,
          linkedin: profileFormData.linkedin || undefined,
        },
      };

      let response;

      if (profileId) {
        // Update existing profile
        if (hasFiles) {
          const formData = new FormData();
          Object.entries(profilePayload).forEach(([key, value]) => {
            if (value !== undefined) {
              if (key === 'socialLinks') {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, String(value));
              }
            }
          });

          if (fileUploadData.profileImageFile) {
            formData.append('profileImage', fileUploadData.profileImageFile);
          }
          if (fileUploadData.logoFile) {
            formData.append('logo', fileUploadData.logoFile);
          }
          if (fileUploadData.operationalDocumentFile) {
            formData.append('operationalDocument', fileUploadData.operationalDocumentFile);
          }

          response = await axios.put(`${baseUrl}/profiles/${profileId}`, formData, { 
            headers: authHeader 
          });
        } else {
          response = await axios.put(`${baseUrl}/profiles/${profileId}`, profilePayload, {
            headers: {
              ...authHeader,
              'Content-Type': 'application/json'
            }
          });
        }
      } else {
        // Create new profile
        if (hasFiles) {
          const formData = new FormData();
          Object.entries(profilePayload).forEach(([key, value]) => {
            if (value !== undefined) {
              if (key === 'socialLinks') {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, String(value));
              }
            }
          });

          if (fileUploadData.profileImageFile) {
            formData.append('profileImage', fileUploadData.profileImageFile);
          }
          if (fileUploadData.logoFile) {
            formData.append('logo', fileUploadData.logoFile);
          }
          if (fileUploadData.operationalDocumentFile) {
            formData.append('operationalDocument', fileUploadData.operationalDocumentFile);
          }

          response = await axios.post(`${baseUrl}/profiles`, formData, { 
            headers: authHeader 
          });
        } else {
          response = await axios.post(`${baseUrl}/profiles`, profilePayload, {
            headers: {
              ...authHeader,
              'Content-Type': 'application/json'
            }
          });
        }

        // Set profile ID for newly created profile
        if (response.data?.data?.id) {
          setProfileId(response.data.data.id);
        } else if (response.data?.id) {
          setProfileId(response.data.id);
        }
      }

      // Clear file states after successful save
      setFileUploadData({
        profileImageFile: null,
        profileImagePreview: fileUploadData.profileImagePreview,
        logoFile: null,
        operationalDocumentFile: null,
      });

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      
      setSuccessMessage("Profile information updated successfully!");
      setError("");
      
      // Refresh profile data
      await fetchUserAndProfile();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      
      return true;
    } catch (err: any) {
      let errorMessage = 'Failed to update profile.';
      if (err.response) {
        if (err.response.data?.message) {
          errorMessage = 'Failed to update profile: ' + err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to update this profile.';
        } else if (err.response.status === 404) {
          errorMessage = 'Profile not found.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cleanup effect for file preview URLs
  useEffect(() => {
    return () => {
      if (fileUploadData.profileImagePreview && fileUploadData.profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(fileUploadData.profileImagePreview);
      }
    };
  }, [fileUploadData.profileImagePreview]);

  // Initial data fetch
  useEffect(() => {
    if (userInfo.isAuthenticated && userInfo.userId) {
      fetchUserAndProfile();
    }
  }, [fetchUserAndProfile]);

  useEffect(() => {
    if (userInfo.isAuthenticated && userInfo.userId) {
      fetchGallery();
    }
  }, [userInfo.isAuthenticated, userInfo.userId, organizationData?.id, fetchGallery]);

  return {
    loading,
    error,
    successMessage,
    userData,
    organizationData,
    profileData,
    profileFormData,
    fileUploadData,
    galleryItems,
    galleryLoading,
    gallerySubmitting,
    galleryItemLoading,
    updateProfileFormData,
    updateFileUploadData,
    handleImageChange,
    handleLogoChange,
    handleOperationalDocumentChange,
    clearProfileImage,
    clearLogo,
    clearOperationalDocument,
    saveProfile,
    refreshProfile: fetchUserAndProfile,
    refreshGallery: fetchGallery,
    uploadGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    formatFileSize,
  };
};