import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const AUTO_LOCK_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "click",
  "keydown",
  "mousemove",
  "scroll",
  "touchstart",
  "wheel",
];

const AutoLock = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  const clearAutoLockTimer = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const lockSession = useCallback(async () => {
    clearAutoLockTimer();
    await logout();
    navigate("/", {
      replace: true,
      state: { message: "Session locked after 10 minutes of inactivity." },
    });
  }, [clearAutoLockTimer, logout, navigate]);

  const resetAutoLockTimer = useCallback(() => {
    if (!isAuthenticated || location.pathname === "/") {
      clearAutoLockTimer();
      return;
    }

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(lockSession, AUTO_LOCK_MS);
  }, [clearAutoLockTimer, isAuthenticated, location.pathname, lockSession]);

  useEffect(() => {
    resetAutoLockTimer();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetAutoLockTimer, { passive: true });
    });

    return () => {
      clearAutoLockTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetAutoLockTimer);
      });
    };
  }, [clearAutoLockTimer, resetAutoLockTimer]);

  return null;
};

export default AutoLock;
