import axios from 'axios';
import { getValidToken } from '@/utils/tokenUtils';
import { notificationService } from '@/services/notificationService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface MediaUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface MediaUploadResult {
  success: boolean;
  data?: {
    id: string;
    chatId: string;
    content: string;
    messageType: string;
    status: string;
    mediaUrl: string;
    mediaType: string;
    fileSize: number;
    thumbnailUrl?: string;
    fileName: string;
    mimeType: string;
    duration?: number;
    createdAt: string;
    sender: any;
  };
  message?: string;
}

/**
 * Upload media file to chat
 */
export const uploadMediaMessage = async (
  chatId: string,
  file: File,
  caption?: string,
  onProgress?: (progress: MediaUploadProgress) => void
): Promise<MediaUploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await apiClient.post(`/chats/${chatId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    // Trigger notification for media upload (will be sent to recipient)
    if (response.data.success && response.data.data) {
      const messageType = getFileType(file.type);
      // Note: Notification will be triggered by socket event on recipient's side
      // This is just for consistency in the upload flow
    }

    return response.data;
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload media',
    };
  }
};

/**
 * Validate file before upload
 */
export const validateMediaFile = (file: File): { valid: boolean; error?: string } => {
  // File size limits (in bytes)
  const MAX_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 20 * 1024 * 1024, // 20MB
    document: 50 * 1024 * 1024, // 50MB
  };

  // Supported file types
  const SUPPORTED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  };

  // Determine file type
  let fileType: keyof typeof MAX_SIZES | null = null;
  if (SUPPORTED_TYPES.image.includes(file.type)) fileType = 'image';
  else if (SUPPORTED_TYPES.video.includes(file.type)) fileType = 'video';
  else if (SUPPORTED_TYPES.audio.includes(file.type)) fileType = 'audio';
  else if (SUPPORTED_TYPES.document.includes(file.type)) fileType = 'document';

  if (!fileType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload an image, video, audio, or document file.',
    };
  }

  // Check file size
  const maxSize = MAX_SIZES[fileType];
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB for ${fileType} files.`,
    };
  }

  return { valid: true };
};

/**
 * Get file type from mime type
 */
export const getFileType = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'unknown' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType === 'text/plain'
  ) {
    return 'document';
  }
  return 'unknown';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration (seconds) to readable time
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: { [key: string]: string } = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    ppt: '📊',
    pptx: '📊',
    xls: '📈',
    xlsx: '📈',
    txt: '📃',
  };

  return iconMap[extension || ''] || '📎';
};

export default {
  uploadMediaMessage,
  validateMediaFile,
  getFileType,
  formatFileSize,
  formatDuration,
  getFileIcon,
};
