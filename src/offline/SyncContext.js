import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { enqueue, flushOutbox, listFailed, listPending, clearFailed, clearOutbox } from './outbox';

const SyncContext = createContext(null);
const SYNC_EVERY_MS = 30000;

export function SyncProvider({ children }) {
  const { user } = useAuth();
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(0);

  const refreshCounts = useCallback(async () => {
    setPending((await listPending()).length);
    setFailed((await listFailed()).length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!user) return null;
    setSyncing(true);
    try {
      const result = await flushOutbox();
      if (result.sent) setLastSyncedAt(Date.now());
      return result;
    } finally {
      setSyncing(false);
      refreshCounts();
    }
  }, [user, refreshCounts]);

  const queueWrite = useCallback(async (item) => {
    await enqueue(item);
    await refreshCounts();
  }, [refreshCounts]);

  const dismissFailed = useCallback(async () => { await clearFailed(); refreshCounts(); }, [refreshCounts]);

  useEffect(() => {
    if (!user) { clearOutbox().then(() => { setPending(0); setFailed(0); }); return undefined; }
    refreshCounts();
    syncNow();
    const timer = setInterval(syncNow, SYNC_EVERY_MS);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') syncNow(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [user, syncNow, refreshCounts]);

  const value = useMemo(() => ({ pending, failed, syncing, lastSyncedAt, syncNow, queueWrite, dismissFailed }), [pending, failed, syncing, lastSyncedAt, syncNow, queueWrite, dismissFailed]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync must be used inside SyncProvider');
  return value;
}
