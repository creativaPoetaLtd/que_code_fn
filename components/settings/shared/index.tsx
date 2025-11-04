import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  text = "Loading..." 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className="py-8 text-center">
      <div className="inline-flex items-center gap-2">
        <div className={`animate-spin rounded-full border-b-2 border-[#00B512] ${sizeClasses[size]}`}></div>
        <span>{text}</span>
      </div>
    </div>
  );
};

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="py-8 text-center">
      <div className="inline-flex flex-col items-center gap-2 text-red-500">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>{message}</span>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

interface SuccessMessageProps {
  message: string;
  details?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, details }) => {
  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 text-green-800">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
      {details && (
        <p className="text-sm text-green-700 mt-2">{details}</p>
      )}
    </div>
  );
};

interface VerificationCardProps {
  title: string;
  description: string;
  status: "verified" | "pending" | "required";
  onAction?: () => void;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({ 
  title, 
  description, 
  status, 
  onAction 
}) => {
  const statusConfig = {
    verified: {
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Verified",
      showButton: false
    },
    pending: {
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Pending",
      showButton: false
    },
    required: {
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      label: "Required",
      showButton: true
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center justify-between p-3 ${config.bgColor} rounded-lg`}>
      <div className="flex items-center gap-3">
        <div className={config.textColor}>
          {config.icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-medium rounded border ${config.badgeColor}`}>
          {config.label}
        </span>
        {config.showButton && onAction && (
          <button
            onClick={onAction}
            className="px-3 py-1 text-sm bg-[#00B512] text-white rounded hover:bg-[#009E10]"
          >
            Verify now
          </button>
        )}
      </div>
    </div>
  );
};