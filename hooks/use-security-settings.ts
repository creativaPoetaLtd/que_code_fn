import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { getPinStatus, changePin } from "@/helpers/api";
import { PinStatus, SecurityFormData } from "@/types/settings.types";

export const useSecuritySettings = () => {
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [loadingPinStatus, setLoadingPinStatus] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  
  const [securityFormData, setSecurityFormData] = useState<SecurityFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    currentPin: "",
    newPin: "",
    confirmNewPin: "",
    showPassword: false,
    showCurrentPin: false,
    showNewPin: false,
  });

  const updateSecurityFormData = (updates: Partial<SecurityFormData>) => {
    setSecurityFormData(prev => ({ ...prev, ...updates }));
  };

  const fetchPinStatus = useCallback(async () => {
    setLoadingPinStatus(true);
    try {
      const result = await getPinStatus();
      if (result.data) {
        setPinStatus({
          hasPin: result.data?.hasPinSet,
          isLocked: result.data.isLocked,
          attemptsLeft: result.data.maxAttempts - result.data.pinAttempts,
          lockedUntil: result.data.lockedUntil ? new Date(result.data.lockedUntil) : null
        });
      } else {
        setPinStatus(null);
      }
    } catch (error) {
      setPinStatus(null);
    } finally {
      setLoadingPinStatus(false);
    }
  }, []);

  const handleChangePassword = () => {
    if (securityFormData.newPassword !== securityFormData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return false;
    }

    // TODO: Implement actual password change API call
    toast({
      title: "Password changed",
      description: "Your password has been changed successfully.",
    });
    
    setSecurityFormData(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    
    return true;
  };

  const handleChangePin = async (): Promise<boolean> => {
    if (securityFormData.newPin !== securityFormData.confirmNewPin) {
      toast({
        title: "PINs don't match",
        description: "New PIN and confirm PIN must match.",
        variant: "destructive",
      });
      return false;
    }

    if (securityFormData.newPin.length !== 4 || !/^\d{4}$/.test(securityFormData.newPin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits.",
        variant: "destructive",
      });
      return false;
    }

    setChangingPin(true);
    try {
      const result = await changePin(securityFormData.currentPin, securityFormData.newPin);
      if (result.status === 200) {
        toast({
          title: "PIN changed",
          description: "Your transaction PIN has been changed successfully.",
        });
        
        setSecurityFormData(prev => ({
          ...prev,
          currentPin: "",
          newPin: "",
          confirmNewPin: "",
        }));
        
        // Refresh PIN status
        await fetchPinStatus();
        
        return true;
      } else {
        toast({
          title: "Failed to change PIN",
          description: result.data?.message || "An error occurred while changing your PIN.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: "Failed to change PIN",
        description: error?.response?.data?.message || "An error occurred while changing your PIN.",
        variant: "destructive",
      });
      return false;
    } finally {
      setChangingPin(false);
    }
  };

  const togglePasswordVisibility = () => {
    setSecurityFormData(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };

  const toggleCurrentPinVisibility = () => {
    setSecurityFormData(prev => ({
      ...prev,
      showCurrentPin: !prev.showCurrentPin
    }));
  };

  const toggleNewPinVisibility = () => {
    setSecurityFormData(prev => ({
      ...prev,
      showNewPin: !prev.showNewPin
    }));
  };

  // Fetch PIN status on mount
  useEffect(() => {
    fetchPinStatus();
  }, [fetchPinStatus]);

  return {
    pinStatus,
    loadingPinStatus,
    changingPin,
    securityFormData,
    updateSecurityFormData,
    fetchPinStatus,
    handleChangePassword,
    handleChangePin,
    togglePasswordVisibility,
    toggleCurrentPinVisibility,
    toggleNewPinVisibility,
  };
};