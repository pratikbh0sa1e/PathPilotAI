"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface UserProfile {
  name: string;
  email: string;
  gpa: string;
  field_of_study: string;
  target_countries: string[];
  target_universities: string;
  budget_range: string;
  goals: string;
  test_score: string;
  activities: string[];
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  gpa: "",
  field_of_study: "",
  target_countries: [],
  target_universities: "",
  budget_range: "",
  goals: "",
  test_score: "",
  activities: [],
};

const PROFILE_KEY = "pathpilot_profile";
const SESSION_KEY = "pathpilot_session"; // "1" = logged in

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

// Fetch profile from backend and merge with local data
async function fetchProfileFromBackend(
  email: string,
): Promise<Partial<UserProfile> | null> {
  try {
    const res = await fetch(
      `${BACKEND}/api/profile/${encodeURIComponent(email)}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// Save profile to backend (fire-and-forget)
async function saveProfileToBackend(
  email: string,
  profile: UserProfile,
): Promise<void> {
  try {
    await fetch(`${BACKEND}/api/profile/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch {
    // Non-blocking — localStorage is source of truth
  }
}

interface ProfileContextValue {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  isLoggedIn: boolean;
  login: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount, then sync from backend
  useEffect(() => {
    const init = async () => {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        const stored = localStorage.getItem(PROFILE_KEY);

        if (session === "1" && stored) {
          const local: UserProfile = JSON.parse(stored);
          setProfileState(local);
          setIsLoggedIn(true);

          // Sync from backend in background (fills in any missing fields)
          if (local.email) {
            const remote = await fetchProfileFromBackend(local.email);
            if (remote) {
              // Remote wins for profile fields, local wins for name/email
              const merged: UserProfile = {
                ...DEFAULT_PROFILE,
                ...remote,
                name: local.name || remote.name || "",
                email: local.email,
              };
              setProfileState(merged);
              localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
            }
          }
        }
      } catch {
        // ignore
      }
      setHydrated(true);
    };
    init();
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    // Sync to backend
    if (p.email) saveProfileToBackend(p.email, p);
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      if (updated.email) saveProfileToBackend(updated.email, updated);
      return updated;
    });
  }, []);

  const login = useCallback(async (data: Partial<UserProfile>) => {
    // Start with any existing local data
    let existing: Partial<UserProfile> = {};
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) existing = JSON.parse(stored);
    } catch {}

    // Merge: defaults < existing local < incoming data
    const merged: UserProfile = { ...DEFAULT_PROFILE, ...existing, ...data };
    setProfileState(merged);
    setIsLoggedIn(true);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    localStorage.setItem(SESSION_KEY, "1");

    // Fetch full profile from backend (fills in GPA, field, countries etc.)
    if (merged.email) {
      const remote = await fetchProfileFromBackend(merged.email);
      if (remote) {
        const full: UserProfile = {
          ...DEFAULT_PROFILE,
          ...remote,
          name: merged.name || remote.name || "",
          email: merged.email,
        };
        setProfileState(full);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(full));
      }
    }
  }, []);

  const logout = useCallback(() => {
    setProfileState(DEFAULT_PROFILE);
    setIsLoggedIn(false);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("pathpilot_gamification");
  }, []);

  if (!hydrated) return null;

  return (
    <ProfileContext.Provider
      value={{ profile, setProfile, updateProfile, isLoggedIn, login, logout }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
