import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Lock, Upload, CheckCircle, AlertCircle, Loader2, Pencil, Trash2, ImagePlus } from 'lucide-react';
import Input from "@/components/ui/Input-ant";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfileData } from "@/hooks/use-profile-data";
import { LoadingSpinner, ErrorMessage, SuccessMessage, VerificationCard } from "./shared";

const VisibilityToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-sm dark:text-gray-300">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    {label}
  </label>
);

export const ProfileTab: React.FC = () => {
  const {
    loading,
    error,
    successMessage,
    userData,
    organizationData,
    profileFormData,
    fileUploadData,
    galleryItems,
    galleryLoading,
    gallerySubmitting,
    galleryItemLoading,
    updateProfileFormData,
    handleImageChange,
    handleLogoChange,
    handleOperationalDocumentChange,
    clearProfileImage,
    clearLogo,
    clearOperationalDocument,
    saveProfile,
    refreshProfile,
    uploadGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    formatFileSize,
  } = useProfileData();

  const [newGalleryCaption, setNewGalleryCaption] = useState("");
  const [newGalleryFile, setNewGalleryFile] = useState<File | null>(null);
  const [editCaptions, setEditCaptions] = useState<Record<string, string>>({});
  const [replaceFiles, setReplaceFiles] = useState<Record<string, File | null>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile();
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    handler: (file: File) => boolean
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handler(file);
    }
  };

  const handleGalleryUpload = async () => {
    if (!newGalleryFile) return;
    const ok = await uploadGalleryItem(newGalleryFile, newGalleryCaption);
    if (ok) {
      setNewGalleryFile(null);
      setNewGalleryCaption("");
      const input = document.getElementById('gallery-upload') as HTMLInputElement | null;
      if (input) input.value = '';
    }
  };

  const handleGalleryDelete = async (itemId: string) => {
    await deleteGalleryItem(itemId);
  };

  const handleGalleryUpdate = async (itemId: string) => {
    const captionValue = editCaptions[itemId];
    const imageFile = replaceFiles[itemId] || undefined;

    const updates: { caption?: string; image?: File } = {};
    if (captionValue !== undefined) {
      updates.caption = captionValue;
    }
    if (imageFile) {
      updates.image = imageFile;
    }

    const ok = await updateGalleryItem(itemId, updates);
    if (ok) {
      setReplaceFiles(prev => ({ ...prev, [itemId]: null }));
    }
  };

  const handleOpenPreview = (itemId: string) => {
    const index = galleryItems.findIndex(item => item.id === itemId);
    if (index >= 0) {
      setPreviewIndex(index);
    }
  };

  const handlePreviewPrevious = () => {
    if (previewIndex === null || galleryItems.length === 0) return;
    setPreviewIndex((previewIndex - 1 + galleryItems.length) % galleryItems.length);
  };

  const handlePreviewNext = () => {
    if (previewIndex === null || galleryItems.length === 0) return;
    setPreviewIndex((previewIndex + 1) % galleryItems.length);
  };

  const selectedPreviewItem = previewIndex !== null ? galleryItems[previewIndex] : null;

  if (loading) {
    return <LoadingSpinner text="Loading profile information..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refreshProfile} />;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {successMessage && (
          <SuccessMessage 
            message={successMessage}
            details={fileUploadData.profileImageFile ? "Profile image has been updated successfully!" : undefined}
          />
        )}
        
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="md:col-span-3 dark:bg-darkBg-card dark:border-darkBorder-light">
            <CardHeader>
              <CardTitle className="dark:text-white">Account & Profile Information</CardTitle>
              <CardDescription className="dark:text-gray-400">View your account details and update profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Model Fields - Read Only - Only show for individual users */}
              {!organizationData && userData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-darkBorder-light">
                    <User size={16} className="text-gray-500 dark:text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Information (Read-Only)</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        First name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{userData.firstName || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Last name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{userData.lastName || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Email
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{userData.email || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex items-center justify-between">
                        <Input 
                          id="phone" 
                          value={userData.phone} 
                          disabled
                          className="flex-1 mr-4"
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input 
                            type="checkbox" 
                            checked={profileFormData.showPhoneOnWelcome} 
                            onChange={e => updateProfileFormData({ showPhoneOnWelcome: e.target.checked })} 
                          />
                          Show on welcome page
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!organizationData && (
                <>
                  <Separator className="dark:bg-darkBorder-light" />
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Note: Account information (name, email, phone) cannot be edited here. Contact support if you need to update these details.
                  </div>
                  <Separator className="dark:bg-darkBorder-light" />
                </>
              )}

              {/* Organization Information Section */}
              {organizationData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-darkBorder-light">
                    <Shield size={16} className="text-gray-500 dark:text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization Information (Read-Only)</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="org-name" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Organization Name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{organizationData.name || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-type" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Organization Type
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{organizationData.type || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="owner-name" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Owner Name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{organizationData.ownerName || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-phone" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Owner Phone
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{organizationData.ownerPhone || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="owner-email" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Owner Email
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{organizationData.ownerEmail || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Contact Phone
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                        <span>{organizationData.contactPhone || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-tin" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Lock size={14} />
                      TIN Number
                    </Label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200 flex items-center justify-between">
                      <span>{organizationData.tinNumber || 'Not provided'}</span>
                      <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                    </div>
                  </div>

                  {/* Category Information */}
                  {organizationData.Category && (
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Lock size={14} />
                        Category
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{organizationData.Category.name}</span>
                            {organizationData.Category.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{organizationData.Category.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded">Read-only</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="dark:bg-darkBorder-light" />
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Note: Organization information cannot be edited here. Contact support if you need to update these details.
                  </div>
                  <Separator className="dark:bg-darkBorder-light" />
                </div>
              )}

              {/* Profile Model Fields - Editable */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-darkBorder-light">
                  <Shield size={16} className="text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Information (Editable)</h3>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Profile Type</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200">
                        {profileFormData.profileType === 'organization' ? 'Organization' : 'Individual'}
                      </div>
                    </div>
                    <VisibilityToggle
                      checked={profileFormData.showProfileTypeOnWelcome}
                      onChange={checked => updateProfileFormData({ showProfileTypeOnWelcome: checked })}
                      label="Show on welcome page"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Location Information</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="province" className="dark:text-gray-300">Province</Label>
                      <Input 
                        id="province" 
                        value={profileFormData.province} 
                        onChange={e => updateProfileFormData({ province: e.target.value })}
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district" className="dark:text-gray-300">District</Label>
                      <Input 
                        id="district" 
                        value={profileFormData.district} 
                        onChange={e => updateProfileFormData({ district: e.target.value })}
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector" className="dark:text-gray-300">Sector</Label>
                      <Input 
                        id="sector" 
                        value={profileFormData.sector} 
                        onChange={e => updateProfileFormData({ sector: e.target.value })}
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cell" className="dark:text-gray-300">Cell</Label>
                      <Input 
                        id="cell" 
                        value={profileFormData.cell} 
                        onChange={e => updateProfileFormData({ cell: e.target.value })}
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <VisibilityToggle
                      checked={profileFormData.showLocationOnWelcome}
                      onChange={checked => updateProfileFormData({ showLocationOnWelcome: checked })}
                      label="Show location on welcome page"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tin" className="dark:text-gray-300">TIN Number</Label>
                  <div className="flex items-center justify-between">
                    <Input 
                      id="tin" 
                      value={profileFormData.tinNumber} 
                      onChange={e => updateProfileFormData({ tinNumber: e.target.value })} 
                      placeholder="Tax identification number" 
                      className="flex-1 mr-4 dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                    />
                    <VisibilityToggle
                      checked={profileFormData.showTinOnWelcome}
                      onChange={checked => updateProfileFormData({ showTinOnWelcome: checked })}
                      label="Show on welcome page"
                    />
                  </div>
                </div>

                {/* Status Message input */}
                <div className="space-y-2">
                  <Label htmlFor="status-message" className="dark:text-gray-300">Status Message</Label>
                  <div className="flex items-center justify-between">
                    <Input 
                      id="status-message" 
                      value={profileFormData.statusMessage} 
                      onChange={e => updateProfileFormData({ statusMessage: e.target.value })} 
                      placeholder="Enter your status message" 
                      className="flex-1 mr-4 dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                    />
                    <VisibilityToggle
                      checked={profileFormData.showStatusMessageOnWelcome}
                      onChange={checked => updateProfileFormData({ showStatusMessageOnWelcome: checked })}
                      label="Show on welcome page"
                    />
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Social Media Links</Label>
                  <div className="flex justify-end">
                    <VisibilityToggle
                      checked={profileFormData.showSocialLinksOnWelcome}
                      onChange={checked => updateProfileFormData({ showSocialLinksOnWelcome: checked })}
                      label="Show on welcome page"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="dark:text-gray-300">Instagram</Label>
                      <Input
                        id="instagram"
                        value={profileFormData.instagram}
                        onChange={e => updateProfileFormData({ instagram: e.target.value })}
                        placeholder="https://instagram.com/your-handle"
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="dark:text-gray-300">Facebook</Label>
                      <Input
                        id="facebook"
                        value={profileFormData.facebook}
                        onChange={e => updateProfileFormData({ facebook: e.target.value })}
                        placeholder="https://facebook.com/your-page"
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="dark:text-gray-300">Twitter / X</Label>
                      <Input
                        id="twitter"
                        value={profileFormData.twitter}
                        onChange={e => updateProfileFormData({ twitter: e.target.value })}
                        placeholder="https://x.com/your-handle"
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="dark:text-gray-300">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={profileFormData.linkedin}
                        onChange={e => updateProfileFormData({ linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/your-profile"
                        className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Image Visibility */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Profile Image</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200">
                        Profile image upload section
                      </div>
                    </div>
                    <VisibilityToggle
                      checked={profileFormData.showProfileImageOnWelcome}
                      onChange={checked => updateProfileFormData({ showProfileImageOnWelcome: checked })}
                      label="Show on welcome page"
                    />
                  </div>
                </div>

                {/* Organization Logo Visibility */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Organization Logo</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-md text-gray-900 dark:text-gray-200">
                        Logo upload section
                      </div>
                    </div>
                    <VisibilityToggle
                      checked={profileFormData.showLogoOnWelcome}
                      onChange={checked => updateProfileFormData({ showLogoOnWelcome: checked })}
                      label="Show on welcome page"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Welcome Page Sections</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <VisibilityToggle checked={profileFormData.showCategoryOnWelcome} onChange={checked => updateProfileFormData({ showCategoryOnWelcome: checked })} label="Show category" />
                    <VisibilityToggle checked={profileFormData.showGalleryOnWelcome} onChange={checked => updateProfileFormData({ showGalleryOnWelcome: checked })} label="Show gallery" />
                    <VisibilityToggle checked={profileFormData.showOrgStatsOnWelcome} onChange={checked => updateProfileFormData({ showOrgStatsOnWelcome: checked })} label="Show organization stats" />
                    <VisibilityToggle checked={profileFormData.showActionsOnWelcome} onChange={checked => updateProfileFormData({ showActionsOnWelcome: checked })} label="Show actions section" />
                    <VisibilityToggle checked={profileFormData.showSendMoneyOnWelcome} onChange={checked => updateProfileFormData({ showSendMoneyOnWelcome: checked })} label="Show send money card" />
                    <VisibilityToggle checked={profileFormData.showContactFormOnWelcome} onChange={checked => updateProfileFormData({ showContactFormOnWelcome: checked })} label="Show contact form" />
                    <VisibilityToggle checked={profileFormData.showOtherInfoOnWelcome} onChange={checked => updateProfileFormData({ showOtherInfoOnWelcome: checked })} label="Show other info card" />
                    <VisibilityToggle checked={profileFormData.showFriendRequestOnWelcome} onChange={checked => updateProfileFormData({ showFriendRequestOnWelcome: checked })} label="Show friendship card" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end dark:border-t dark:border-darkBorder-light">
              <Button 
                type="submit" 
                className="bg-[#00B512] hover:bg-[#009E10] dark:bg-brand-gold dark:hover:bg-brand-goldHover text-white dark:text-[#00313A]" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving changes...</span>
                  </div>
                ) : (
                  'Save changes'
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-2 dark:bg-darkBg-card dark:border-darkBorder-light">
            <CardHeader>
              <CardTitle className="dark:text-white">Profile Picture & Documents</CardTitle>
              <CardDescription className="dark:text-gray-400">Update your profile image, logo, and operational documents</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Profile Image Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium dark:text-gray-300">Profile Image</Label>
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-darkBorder-light shadow-sm">
                    <AvatarImage 
                      src={fileUploadData.profileImagePreview || "/placeholder.svg?height=96&width=96"} 
                      alt="Profile" 
                    />
                    <AvatarFallback className="text-lg font-semibold bg-gray-100 dark:bg-darkBg-main dark:text-gray-300">
                      {userData?.firstName?.[0]}{userData?.lastName?.[0] || organizationData?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col items-center gap-2 w-full">
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif" 
                      id="profile-image-upload" 
                      style={{ display: 'none' }} 
                      onChange={e => handleFileInput(e, handleImageChange)} 
                    />
                    <label htmlFor="profile-image-upload" className="w-full">
                      <Button variant="outline" className="w-full hover:bg-gray-50 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-gray-800" asChild>
                        <span><Upload size={16} className="mr-2" />Upload new image</span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Click to browse or drag & drop an image file
                    </p>
                    
                    {(fileUploadData.profileImageFile || fileUploadData.profileImagePreview) && (
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 w-full" 
                        onClick={clearProfileImage}
                        type="button"
                      >
                        Remove image
                      </Button>
                    )}
                  </div>
                  
                  {fileUploadData.profileImageFile && (
                    <div className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">
                          {fileUploadData.profileImageFile.name} selected for upload
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Size: {formatFileSize(fileUploadData.profileImageFile.size)}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Type: {fileUploadData.profileImageFile.type.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="dark:bg-darkBorder-light" />

              {/* Organization Logo Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium dark:text-gray-300">Organization Logo</Label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif" 
                    id="logo-upload" 
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50" 
                    onChange={e => handleFileInput(e, handleLogoChange)} 
                  />
                  
                  {fileUploadData.logoFile && (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">
                          {fileUploadData.logoFile.name}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20" 
                        onClick={clearLogo}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="dark:bg-darkBorder-light" />

              {/* Operational Document Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium dark:text-gray-300">Operational Document</Label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif,application/pdf" 
                    id="operational-doc-upload" 
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400 dark:hover:file:bg-purple-900/50" 
                    onChange={e => handleFileInput(e, handleOperationalDocumentChange)} 
                  />
                  
                  {fileUploadData.operationalDocumentFile && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                          {fileUploadData.operationalDocumentFile.name}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20" 
                        onClick={clearOperationalDocument}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="dark:bg-darkBorder-light" />

              {/* Gallery Management Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium dark:text-gray-300">Welcome Page Gallery</Label>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-main space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="gallery-caption" className="text-xs text-gray-600 dark:text-gray-400">Caption (optional)</Label>
                      <Input
                        id="gallery-caption"
                        value={newGalleryCaption}
                        onChange={e => setNewGalleryCaption(e.target.value)}
                        placeholder="Add a caption for this image"
                        className="dark:bg-darkBg-card dark:text-white dark:border-darkBorder-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gallery-upload" className="text-xs text-gray-600 dark:text-gray-400">Image</Label>
                      <input
                        id="gallery-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif"
                        className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                        onChange={e => setNewGalleryFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGalleryUpload}
                    disabled={!newGalleryFile || gallerySubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {gallerySubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Uploading...</span>
                    ) : (
                      <span className="flex items-center gap-2"><ImagePlus size={16} />Upload to gallery</span>
                    )}
                  </Button>
                </div>

                {galleryLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading gallery...
                  </div>
                ) : galleryItems.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic border border-dashed border-gray-300 dark:border-darkBorder-light rounded-lg p-4 text-center">
                    No gallery images yet. Upload your first image above.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {galleryItems.map(item => {
                      const busy = !!galleryItemLoading[item.id];
                      const captionValue = editCaptions[item.id] ?? item.caption ?? "";
                      return (
                        <div key={item.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-darkBorder-light bg-white dark:bg-darkBg-main">
                          <div
                            className="aspect-[4/3] bg-gray-100 dark:bg-darkBg-card cursor-zoom-in"
                            onClick={() => handleOpenPreview(item.id)}
                            title="Open preview"
                          >
                            <img src={item.imageUrl} alt={item.caption || 'Gallery item'} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-3 space-y-3">
                            <div className="space-y-1">
                              <Label htmlFor={`caption-${item.id}`} className="text-xs text-gray-600 dark:text-gray-400">Caption</Label>
                              <Input
                                id={`caption-${item.id}`}
                                value={captionValue}
                                onChange={e => setEditCaptions(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="dark:bg-darkBg-card dark:text-white dark:border-darkBorder-light"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`replace-${item.id}`} className="text-xs text-gray-600 dark:text-gray-400">Replace image (optional)</Label>
                              <input
                                id={`replace-${item.id}`}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif"
                                className="w-full text-xs file:mr-3 file:py-1.5 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                                onChange={e => setReplaceFiles(prev => ({ ...prev, [item.id]: e.target.files?.[0] || null }))}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{new Date(item.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 dark:border-darkBorder-light dark:text-gray-300"
                                onClick={() => handleGalleryUpdate(item.id)}
                                disabled={busy}
                              >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} className="mr-1" />}
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleGalleryDelete(item.id)}
                                disabled={busy}
                              >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* File Requirements Info */}
              <div className="w-full p-4 bg-gray-50 dark:bg-darkBg-main border border-gray-200 dark:border-darkBorder-light rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Requirements</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Supported formats: PNG, JPG, JPEG, GIF, WebP, BMP, TIFF, JFIF, TIF</li>
                  <li>• Documents can also be PDF format</li>
                  <li>• Maximum file size: 5MB per file</li>
                  <li>• Gallery images can be up to 10MB</li>
                  <li>• Images will be automatically optimized</li>
                  <li>• For best results, use square images for profile pictures</li>
                </ul>
              </div>

              {/* Upload Status */}
              {(fileUploadData.profileImageFile || fileUploadData.logoFile || fileUploadData.operationalDocumentFile) && (
                <div className="w-full p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">Files ready for upload</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Click "Save changes" to upload your selected files
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Account Verification Card */}
      <Card className="mt-6 dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">Account Verification</CardTitle>
          <CardDescription className="dark:text-gray-400">Verify your identity to unlock all features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <VerificationCard
              title="Email verification"
              description="Your email has been verified"
              status="verified"
            />
            <VerificationCard
              title="ID verification"
              description="Upload a government-issued ID"
              status="required"
              onAction={() => {/* TODO: Implement ID verification */}}
            />
            <VerificationCard
              title="Address verification"
              description="Confirm your residential address"
              status="required"
              onAction={() => {/* TODO: Implement address verification */}}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gallery Lightbox */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          {selectedPreviewItem && (
            <div className="relative">
              <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
                <DialogTitle className="text-white text-sm font-medium">
                  {selectedPreviewItem.caption || 'Gallery image'}
                </DialogTitle>
                <p className="text-white/70 text-xs">
                  {new Date(selectedPreviewItem.createdAt).toLocaleString()} • {previewIndex! + 1} / {galleryItems.length}
                </p>
              </DialogHeader>

              <img
                src={selectedPreviewItem.imageUrl}
                alt={selectedPreviewItem.caption || 'Gallery preview'}
                className="w-full max-h-[80vh] object-contain bg-black"
              />

              {galleryItems.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviewPrevious}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 border-white/20 text-white hover:bg-black/60"
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviewNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 border-white/20 text-white hover:bg-black/60"
                  >
                    Next
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};