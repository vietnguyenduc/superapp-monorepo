import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalMs: number;
}

interface SessionState {
  isActive: boolean;
  timeRemaining: number;
  showWarning: boolean;
  lastActivity: Date;
}

const DEFAULT_CONFIG: SessionConfig = {
  timeoutMinutes: 30, // 30 minutes
  warningMinutes: 5, // Show warning 5 minutes before timeout
  checkIntervalMs: 1000, // Check every second
};

export const useSession = (config: Partial<SessionConfig> = {}) => {
  const { signOut } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    timeRemaining: 0,
    showWarning: false,
    lastActivity: new Date(),
  });

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity on user interaction
  const updateActivity = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      lastActivity: new Date(),
      isActive: true,
      showWarning: false,
    }));

    // Clear existing timeouts
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
    }

    // Set new timeouts
    const warningTime =
      mergedConfig.timeoutMinutes - mergedConfig.warningMinutes;
    const logoutTime = mergedConfig.timeoutMinutes;

    warningTimeoutRef.current = setTimeout(
      () => {
        setSessionState((prev) => ({
          ...prev,
          showWarning: true,
        }));
      },
      warningTime * 60 * 1000,
    );

    logoutTimeoutRef.current = setTimeout(
      () => {
        handleLogout();
      },
      logoutTime * 60 * 1000,
    );
  }, [mergedConfig.timeoutMinutes, mergedConfig.warningMinutes]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setSessionState((prev) => ({
      ...prev,
      isActive: false,
      showWarning: false,
    }));

    await signOut();
  }, [signOut]);

  // Extend session
  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const timeSinceLastActivity =
      now.getTime() - sessionState.lastActivity.getTime();
    const timeRemainingMs =
      mergedConfig.timeoutMinutes * 60 * 1000 - timeSinceLastActivity;

    return Math.max(0, Math.floor(timeRemainingMs / 1000));
  }, [sessionState.lastActivity, mergedConfig.timeoutMinutes]);

  // Format time remaining
  const formatTimeRemaining = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      updateActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity
    updateActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Set up session monitoring
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const timeRemaining = calculateTimeRemaining();

      setSessionState((prev) => ({
        ...prev,
        timeRemaining,
      }));

      // Auto-logout when time expires
      if (timeRemaining <= 0 && sessionState.isActive) {
        handleLogout();
      }
    }, mergedConfig.checkIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    calculateTimeRemaining,
    handleLogout,
    mergedConfig.checkIntervalMs,
    sessionState.isActive,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...sessionState,
    extendSession,
    handleLogout,
    formatTimeRemaining,
    timeRemainingFormatted: formatTimeRemaining(sessionState.timeRemaining),
  };
};
