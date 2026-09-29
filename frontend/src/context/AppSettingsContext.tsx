import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getTranslation } from "../lib/translations";

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  avatarInitials: string;
}

export interface GeneralSettings {
  defaultLanguage: string; // "English" | "Hindi" | "Marathi" | "Kannada" | "Tamil" | "Telugu"
  timezone: string;
  darkMode: boolean;
}

interface AppSettingsContextType {
  profile: UserProfile;
  generalSettings: GeneralSettings;
  updateProfile: (updated: Partial<UserProfile>) => void;
  updateDefaultLanguage: (language: string) => void;
  updateTimezone: (timezone: string) => void;
  toggleDarkMode: () => void;
  t: (key: string) => string;
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: "Om Sabitha",
  email: "om.sabitha@masscomm.gov.in",
  phone: "+91 9876543210",
  organization: "PSG College of Engineering",
  role: "Campaign Manager",
  avatarInitials: "OS",
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  defaultLanguage: "English",
  timezone: "Asia/Kolkata (IST)",
  darkMode: false,
};

function computeInitials(name: string): string {
  if (!name || !name.trim()) return "OS";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = "connectai_user_profile";
const SETTINGS_STORAGE_KEY = "connectai_general_settings";

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          avatarInitials: computeInitials(parsed.fullName || DEFAULT_PROFILE.fullName),
        };
      }
    } catch (e) {
      console.error("Error reading profile from localStorage", e);
    }
    return DEFAULT_PROFILE;
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_GENERAL_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Error reading general settings from localStorage", e);
    }
    return DEFAULT_GENERAL_SETTINGS;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (generalSettings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [generalSettings.darkMode]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error("Error saving profile to localStorage", e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(generalSettings));
    } catch (e) {
      console.error("Error saving general settings to localStorage", e);
    }
  }, [generalSettings]);

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const newFullName = updated.fullName !== undefined ? updated.fullName : prev.fullName;
      const newInitials = computeInitials(newFullName);
      return {
        ...prev,
        ...updated,
        fullName: newFullName,
        avatarInitials: newInitials,
      };
    });
  };

  const updateDefaultLanguage = (language: string) => {
    setGeneralSettings((prev) => ({
      ...prev,
      defaultLanguage: language,
    }));
  };

  const updateTimezone = (timezone: string) => {
    setGeneralSettings((prev) => ({
      ...prev,
      timezone,
    }));
  };

  const toggleDarkMode = () => {
    setGeneralSettings((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const t = useCallback(
    (key: string) => {
      return getTranslation(generalSettings.defaultLanguage, key);
    },
    [generalSettings.defaultLanguage]
  );

  return (
    <AppSettingsContext.Provider
      value={{
        profile,
        generalSettings,
        updateProfile,
        updateDefaultLanguage,
        updateTimezone,
        toggleDarkMode,
        t,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}
