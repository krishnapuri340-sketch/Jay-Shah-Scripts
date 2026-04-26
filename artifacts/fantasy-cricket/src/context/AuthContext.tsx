import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthToken, clearAuthToken, authHeaders } from "../lib/auth";

function savePins(p: Record<string, boolean>) {
  localStorage.setItem("ipl-pins-2026", JSON.stringify(p));
}

interface AuthContextValue {
  currentUser: string | null;
  userPins: Record<string, boolean>;
  pinEditTarget: string | null;
  pinEditVal: string;
  pinConfirmVal: string;
  pinStep: "confirm" | "new";
  pinConfirmError: boolean;
  handleLogin: (userId: string) => void;
  handleLogout: () => void;
  handleValidate: (userId: string, pin: string) => Promise<boolean>;
  fetchPins: () => Promise<void>;
  setPinEditTarget: (v: string | null) => void;
  setPinEditVal: (v: string) => void;
  setPinConfirmVal: (v: string) => void;
  setPinStep: (s: "confirm" | "new") => void;
  setPinConfirmError: (v: boolean) => void;
  resetPinEdit: () => void;
  handleConfirmOldPin: (uid: string) => Promise<void>;
  handleSavePin: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(
    () => localStorage.getItem("ipl-current-user")
  );
  const [userPins, setUserPins] = useState<Record<string, boolean>>({});
  const [pinEditTarget, setPinEditTarget] = useState<string | null>(null);
  const [pinEditVal, setPinEditVal] = useState("");
  const [pinConfirmVal, setPinConfirmVal] = useState("");
  const [pinStep, setPinStep] = useState<"confirm" | "new">("confirm");
  const [pinConfirmError, setPinConfirmError] = useState(false);

  useEffect(() => {
    const onExpired = () => {
      clearAuthToken();
      localStorage.removeItem("ipl-current-user");
      setCurrentUser(null);
    };
    window.addEventListener("ipl:session-expired", onExpired);
    return () => window.removeEventListener("ipl:session-expired", onExpired);
  }, []);

  // Commissioner (rajveer) fetches pin-set on login to enable pin management
  useEffect(() => {
    if (currentUser === "rajveer") {
      (async () => {
        try {
          const res = await fetch("/api/ipl/pins", { headers: { ...authHeaders() } });
          if (res.ok) {
            const serverPins = await res.json();
            setUserPins(serverPins);
            savePins(serverPins);
          }
        } catch (_) {}
      })();
    }
  }, [currentUser]);

  const handleLogin = (userId: string) => {
    localStorage.setItem("ipl-current-user", userId);
    setCurrentUser(userId);
  };

  const handleLogout = () => {
    localStorage.removeItem("ipl-current-user");
    clearAuthToken();
    setCurrentUser(null);
  };

  const handleValidate = async (userId: string, pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/ipl/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) setAuthToken(data.token);
        handleLogin(userId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const fetchPins = async () => {
    try {
      const res = await fetch("/api/ipl/pins", { headers: { ...authHeaders() } });
      if (res.ok) {
        const serverPins = await res.json();
        setUserPins(serverPins);
        savePins(serverPins);
      }
    } catch (_) {}
  };

  const resetPinEdit = () => {
    setPinEditTarget(null);
    setPinEditVal("");
    setPinConfirmVal("");
    setPinStep("confirm");
    setPinConfirmError(false);
  };

  const handleConfirmOldPin = async (uid: string) => {
    if (pinConfirmVal.length !== 4) return;
    try {
      const res = await fetch("/api/ipl/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, pin: pinConfirmVal }),
      });
      if (res.ok) {
        setPinStep("new");
        setPinConfirmError(false);
      } else {
        setPinConfirmError(true);
        setPinConfirmVal("");
      }
    } catch {
      setPinConfirmError(true);
      setPinConfirmVal("");
    }
  };

  const handleSavePin = async (uid: string) => {
    if (!/^\d{4}$/.test(pinEditVal)) return;
    const updated = { ...userPins, [uid]: true };
    setUserPins(updated);
    savePins(updated);
    const savedOld = pinConfirmVal;
    resetPinEdit();
    try {
      await fetch(`/api/ipl/pins/${encodeURIComponent(uid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ pin: pinEditVal, oldPin: savedOld }),
      });
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{
      currentUser, userPins,
      pinEditTarget, pinEditVal, pinConfirmVal, pinStep, pinConfirmError,
      handleLogin, handleLogout, handleValidate, fetchPins,
      setPinEditTarget, setPinEditVal, setPinConfirmVal, setPinStep, setPinConfirmError,
      resetPinEdit, handleConfirmOldPin, handleSavePin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
