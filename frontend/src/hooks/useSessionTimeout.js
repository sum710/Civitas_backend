import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const useSessionTimeout = (totalTimeoutInMinutes = 10, warningTimeInSeconds = 60) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [showWarning, setShowWarning] = useState(false);
    
    const totalTimeoutMs = totalTimeoutInMinutes * 60 * 1000;
    const warningTimeMs = warningTimeInSeconds * 1000;
    const idleTimeBeforeWarning = totalTimeoutMs - warningTimeMs;

    const warningTimerRef = useRef(null);
    const logoutTimerRef = useRef(null);

    const handleLogout = useCallback(() => {
        logout();
        setShowWarning(false);
        navigate('/login', { 
            state: { message: 'Your session has expired due to inactivity. For your security, you have been logged out.' } 
        });
    }, [logout, navigate]);

    const startLogoutTimer = useCallback(() => {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = setTimeout(handleLogout, warningTimeMs);
    }, [handleLogout, warningTimeMs]);

    const resetTimer = useCallback(() => {
        // Clear all timers
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        
        setShowWarning(false);

        if (user) {
            // Set the first timer to trigger the warning
            warningTimerRef.current = setTimeout(() => {
                setShowWarning(true);
                startLogoutTimer();
            }, idleTimeBeforeWarning);
        }
    }, [user, idleTimeBeforeWarning, startLogoutTimer]);

    useEffect(() => {
        if (!user) {
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            return;
        }

        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        
        // Initial set
        resetTimer();

        // Attach listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user, resetTimer]);

    return { showWarning, resetTimer };
};

export default useSessionTimeout;
