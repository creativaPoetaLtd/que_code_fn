import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Lock, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Input from "@/components/ui/Input-ant";
import { Label } from "@/components/ui/label";
import { useProfileData } from "@/hooks/use-profile-data";
import { LoadingSpinner, ErrorMessage, SuccessMessage, VerificationCard } from "./shared";

export const ProfileTab: React.FC = () => {
  const {
    loading,
    error,
    successMessage,
    userData,
    organizationData,
    profileFormData,
    fileUploadData,
    updateProfileFormData,
    handleImageChange,
    handleLogoChange,
    handleOperationalDocumentChange,
    clearProfileImage,
    clearLogo,
    clearOperationalDocument,
    saveProfile,
    refreshProfile,
    formatFileSize,
  } = useProfileData();

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
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Account & Profile Information</CardTitle>
              <CardDescription>View your account details and update profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Model Fields - Read Only - Only show for individual users */}
              {!organizationData && userData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User size={16} className="text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">Account Information (Read-Only)</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        First name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{userData.firstName || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Last name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{userData.lastName || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Email
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{userData.email || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
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
                  <Separator />
                  <div className="text-sm text-gray-500 italic">
                    Note: Account information (name, email, phone) cannot be edited here. Contact support if you need to update these details.
                  </div>
                  <Separator />
                </>
              )}

              {/* Organization Information Section */}
              {organizationData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Shield size={16} className="text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">Organization Information (Read-Only)</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="org-name" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Organization Name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{organizationData.name || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-type" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Organization Type
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{organizationData.type || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="owner-name" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Owner Name
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{organizationData.ownerName || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-phone" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Owner Phone
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{organizationData.ownerPhone || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="owner-email" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Owner Email
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{organizationData.ownerEmail || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Contact Phone
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                        <span>{organizationData.contactPhone || 'Not provided'}</span>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-tin" className="text-gray-600 flex items-center gap-2">
                      <Lock size={14} />
                      TIN Number
                    </Label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 flex items-center justify-between">
                      <span>{organizationData.tinNumber || 'Not provided'}</span>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                    </div>
                  </div>

                  {/* Category Information */}
                  {organizationData.Category && (
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gray-600 flex items-center gap-2">
                        <Lock size={14} />
                        Category
                      </Label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{organizationData.Category.name}</span>
                            {organizationData.Category.description && (
                              <p className="text-sm text-gray-500 mt-1">{organizationData.Category.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />
                  <div className="text-sm text-gray-500 italic">
                    Note: Organization information cannot be edited here. Contact support if you need to update these details.
                  </div>
                  <Separator />
                </div>
              )}

              {/* Profile Model Fields - Editable */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Shield size={16} className="text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Profile Information (Editable)</h3>
                </div>

                <div className="space-y-2">
                  <Label>Profile Type</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {profileFormData.profileType === 'organization' ? 'Organization' : 'Individual'}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={profileFormData.showProfileTypeOnWelcome} 
                        onChange={e => updateProfileFormData({ showProfileTypeOnWelcome: e.target.checked })} 
                      />
                      Show on welcome page
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location Information</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="province">Province</Label>
                      <Input 
                        id="province" 
                        value={profileFormData.province} 
                        onChange={e => updateProfileFormData({ province: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input 
                        id="district" 
                        value={profileFormData.district} 
                        onChange={e => updateProfileFormData({ district: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector</Label>
                      <Input 
                        id="sector" 
                        value={profileFormData.sector} 
                        onChange={e => updateProfileFormData({ sector: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cell">Cell</Label>
                      <Input 
                        id="cell" 
                        value={profileFormData.cell} 
                        onChange={e => updateProfileFormData({ cell: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={profileFormData.showLocationOnWelcome} 
                        onChange={e => updateProfileFormData({ showLocationOnWelcome: e.target.checked })} 
                      />
                      Show location on welcome page
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tin">TIN Number</Label>
                  <div className="flex items-center justify-between">
                    <Input 
                      id="tin" 
                      value={profileFormData.tinNumber} 
                      onChange={e => updateProfileFormData({ tinNumber: e.target.value })} 
                      placeholder="Tax identification number" 
                      className="flex-1 mr-4"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={profileFormData.showTinOnWelcome} 
                        onChange={e => updateProfileFormData({ showTinOnWelcome: e.target.checked })} 
                      />
                      Show on welcome page
                    </label>
                  </div>
                </div>

                {/* Status Message input */}
                <div className="space-y-2">
                  <Label htmlFor="status-message">Status Message</Label>
                  <div className="flex items-center justify-between">
                    <Input 
                      id="status-message" 
                      value={profileFormData.statusMessage} 
                      onChange={e => updateProfileFormData({ statusMessage: e.target.value })} 
                      placeholder="Enter your status message" 
                      className="flex-1 mr-4"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={profileFormData.showStatusMessageOnWelcome} 
                        onChange={e => updateProfileFormData({ showStatusMessageOnWelcome: e.target.checked })} 
                      />
                      Show on welcome page
                    </label>
                  </div>
                </div>

                {/* Profile Image Visibility */}
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        Profile image upload section
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={profileFormData.showProfileImageOnWelcome} 
                        onChange={e => updateProfileFormData({ showProfileImageOnWelcome: e.target.checked })} 
                      />
                      Show on welcome page
                    </label>
                  </div>
                </div>

                {/* Organization Logo Visibility */}
                <div className="space-y-2">
                  <Label>Organization Logo</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        Logo upload section
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={profileFormData.showLogoOnWelcome} 
                        onChange={e => updateProfileFormData({ showLogoOnWelcome: e.target.checked })} 
                      />
                      Show on welcome page
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-[#00B512] hover:bg-[#009E10]" 
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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Picture & Documents</CardTitle>
              <CardDescription>Update your profile image, logo, and operational documents</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Profile Image Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium">Profile Image</Label>
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-gray-200 shadow-sm">
                    <AvatarImage 
                      src={fileUploadData.profileImagePreview || "/placeholder.svg?height=96&width=96"} 
                      alt="Profile" 
                    />
                    <AvatarFallback className="text-lg font-semibold bg-gray-100">
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
                      <Button variant="outline" className="w-full hover:bg-gray-50" asChild>
                        <span><Upload size={16} className="mr-2" />Upload new image</span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 text-center">
                      Click to browse or drag & drop an image file
                    </p>
                    
                    {(fileUploadData.profileImageFile || fileUploadData.profileImagePreview) && (
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full" 
                        onClick={clearProfileImage}
                        type="button"
                      >
                        Remove image
                      </Button>
                    )}
                  </div>
                  
                  {fileUploadData.profileImageFile && (
                    <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">
                          {fileUploadData.profileImageFile.name} selected for upload
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-blue-600">
                          Size: {formatFileSize(fileUploadData.profileImageFile.size)}
                        </p>
                        <p className="text-xs text-blue-600">
                          Type: {fileUploadData.profileImageFile.type.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Organization Logo Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium">Organization Logo</Label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif" 
                    id="logo-upload" 
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    onChange={e => handleFileInput(e, handleLogoChange)} 
                  />
                  
                  {fileUploadData.logoFile && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {fileUploadData.logoFile.name}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50" 
                        onClick={clearLogo}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Operational Document Section */}
              <div className="w-full space-y-4">
                <Label className="text-sm font-medium">Operational Document</Label>
                <div className="space-y-3">
                  <input 
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff,image/jfif,image/tif,application/pdf" 
                    id="operational-doc-upload" 
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                    onChange={e => handleFileInput(e, handleOperationalDocumentChange)} 
                  />
                  
                  {fileUploadData.operationalDocumentFile && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          {fileUploadData.operationalDocumentFile.name}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50" 
                        onClick={clearOperationalDocument}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* File Requirements Info */}
              <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">File Requirements</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Supported formats: PNG, JPG, JPEG, GIF, WebP, BMP, TIFF, JFIF, TIF</li>
                  <li>• Documents can also be PDF format</li>
                  <li>• Maximum file size: 5MB per file</li>
                  <li>• Images will be automatically optimized</li>
                  <li>• For best results, use square images for profile pictures</li>
                </ul>
              </div>

              {/* Upload Status */}
              {(fileUploadData.profileImageFile || fileUploadData.logoFile || fileUploadData.operationalDocumentFile) && (
                <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">Files ready for upload</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Click "Save changes" to upload your selected files
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Account Verification Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Verification</CardTitle>
          <CardDescription>Verify your identity to unlock all features</CardDescription>
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
    </div>
  );
};