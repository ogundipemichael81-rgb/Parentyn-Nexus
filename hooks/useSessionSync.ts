import { useState, useEffect } from 'react';
import { Session } from '../types';
import { sessionManager } from '../services/sessionManager';

/**
 * Custom hook that acts as a "Socket Client".
 * It listens for updates to the specific session ID and re-renders components.
 */
export const useSessionSync = (sessionId?: string) => {
    const [sessionData, setSessionData] = useState<Session | undefined>(
        sessionId ? sessionManager.getSession(sessionId) : undefined
    );

    useEffect(() => {
        if (!sessionId) return;

        // Initial Load
        const load = () => {
            const s = sessionManager.getSession(sessionId);
            setSessionData(s);
        };
        load();

        // 1. Listen for updates within the same tab (Teacher view updating itself)
        const handleLocalUpdate = () => load();
        window.addEventListener('session-update', handleLocalUpdate);

        // 2. Listen for updates from other tabs (Student view updating from Teacher)
        const handleStorageUpdate = (e: StorageEvent) => {
            if (e.key === 'parentyn_mock_db_sessions') {
                load();
            }
        };
        window.addEventListener('storage', handleStorageUpdate);

        return () => {
            window.removeEventListener('session-update', handleLocalUpdate);
            window.removeEventListener('storage', handleStorageUpdate);
        };
    }, [sessionId]);

    return sessionData;
};