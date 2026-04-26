export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  contactPhone: string;
  tinNumber: string;
  categoryId: string;
  Category?: {
    name: string;
    description: string;
  };
}

export interface ProfileData {
  id: string;
  type: "individual" | "organization";
  userId?: string;
  organizationId?: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  tinNumber: string;
  qrCode: string;
  profileImage?: string;
  statusMessage: string;
  showPhoneOnWelcome: boolean;
  showProfileImageOnWelcome: boolean;
  showStatusMessageOnWelcome: boolean;
  showProfileTypeOnWelcome: boolean;
  showLocationOnWelcome: boolean;
  showTinOnWelcome: boolean;
  showLogoOnWelcome: boolean;
  showCategoryOnWelcome: boolean;
  showSocialLinksOnWelcome: boolean;
  showGalleryOnWelcome: boolean;
  showOrgStatsOnWelcome: boolean;
  showActionsOnWelcome: boolean;
  showSendMoneyOnWelcome: boolean;
  showContactFormOnWelcome: boolean;
  showOtherInfoOnWelcome: boolean;
  showFriendRequestOnWelcome: boolean;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface ProfileFormData {
  profileType: "individual" | "organization" | "";
  province: string;
  district: string;
  sector: string;
  cell: string;
  tinNumber: string;
  statusMessage: string;
  showPhoneOnWelcome: boolean;
  showProfileImageOnWelcome: boolean;
  showStatusMessageOnWelcome: boolean;
  showProfileTypeOnWelcome: boolean;
  showLocationOnWelcome: boolean;
  showTinOnWelcome: boolean;
  showLogoOnWelcome: boolean;
  showCategoryOnWelcome: boolean;
  showSocialLinksOnWelcome: boolean;
  showGalleryOnWelcome: boolean;
  showOrgStatsOnWelcome: boolean;
  showActionsOnWelcome: boolean;
  showSendMoneyOnWelcome: boolean;
  showContactFormOnWelcome: boolean;
  showOtherInfoOnWelcome: boolean;
  showFriendRequestOnWelcome: boolean;
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
}

export interface FileUploadData {
  profileImageFile: File | null;
  profileImagePreview: string | null;
  logoFile: File | null;
  operationalDocumentFile: File | null;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
}

export interface PinStatus {
  hasPin: boolean;
  isLocked: boolean;
  attemptsLeft: number;
  lockedUntil: Date | null;
}

export interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  currentPin: string;
  newPin: string;
  confirmNewPin: string;
  showPassword: boolean;
  showCurrentPin: boolean;
  showNewPin: boolean;
}

export interface NotificationSettings {
  // Transaction Notifications
  notifySent: boolean;
  notifyReceived: boolean;
  notifyRequested: boolean;

  // Group Notifications
  notifyGroupActivity: boolean;
  notifyContribution: boolean;

  // Notification Channels
  channelPush: boolean;
  channelEmail: boolean;
  channelSms: boolean;

  // Sound & Vibration
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard";
  lastFour: string;
  expiryDate: string;
  isDefault: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: "checking" | "savings";
  lastFour: string;
  isDefault: boolean;
}

export interface TransactionLimits {
  dailySending: number;
  monthlyTransaction: number;
  singleTransaction: number;
}

export interface PrivacySettings {
  profileVisibility: "contacts" | "everyone" | "nobody";
  activityStatus: boolean;
  searchVisibility: boolean;
  transactionHistoryVisibility: "only_me" | "participants" | "contacts";
  hideAmounts: boolean;
  analytics: boolean;
  marketingCommunications: boolean;
}

export interface SettingsState {
  loading: boolean;
  error: string;
  successMessage: string;
  userData: UserData | null;
  organizationData: OrganizationData | null;
  profileData: ProfileData | null;
  profileFormData: ProfileFormData;
  fileUploadData: FileUploadData;
  pinStatus: PinStatus | null;
  securityFormData: SecurityFormData;
  notificationSettings: NotificationSettings;
  paymentMethods: PaymentMethod[];
  bankAccounts: BankAccount[];
  transactionLimits: TransactionLimits;
  privacySettings: PrivacySettings;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type SettingsTabType = "profile" | "security" | "notifications" | "payment" | "privacy";