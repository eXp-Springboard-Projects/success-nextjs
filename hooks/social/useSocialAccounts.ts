/**
 * useSocialAccounts Hook
 * Manage connected social media accounts
 */

import { useState, useEffect, useCallback } from 'react';
import { SocialAccount, Platform } from '@/types/social';

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/social/accounts');
      const data = await res.json();

      if (data.success) {
        setAccounts(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const connect = useCallback((platform: Platform) => {
    // Redirect to OAuth flow
    window.location.href = `/api/social/oauth/${platform}/route`;
  }, []);

  const disconnect = useCallback(
    async (accountId: string) => {
      try {
        const res = await fetch(`/api/social/accounts/${accountId}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (data.success) {
          await fetchAccounts();
        } else {
          throw new Error(data.error || 'Failed to disconnect account');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [fetchAccounts]
  );

  return {
    accounts,
    loading,
    error,
    connect,
    disconnect,
    refresh: fetchAccounts,
  };
}
