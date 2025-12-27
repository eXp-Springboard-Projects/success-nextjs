/**
 * useMediaLibrary Hook
 * Manage media uploads and library
 */

import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from '@/types/social';

export function useMediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/social/media');
      const data = await res.json();

      if (data.success) {
        setMedia(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch media');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const uploadMedia = useCallback(
    async (
      file: File,
      metadata?: { altText?: string; tags?: string[]; folder?: string }
    ): Promise<MediaItem> => {
      try {
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        if (metadata?.altText) formData.append('altText', metadata.altText);
        if (metadata?.tags) formData.append('tags', metadata.tags.join(','));
        if (metadata?.folder) formData.append('folder', metadata.folder);

        const res = await fetch('/api/social/media', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          await fetchMedia();
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to upload media');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [fetchMedia]
  );

  const deleteMedia = useCallback(
    async (mediaId: string): Promise<void> => {
      try {
        const res = await fetch(`/api/social/media/${mediaId}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (data.success) {
          await fetchMedia();
        } else {
          throw new Error(data.error || 'Failed to delete media');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [fetchMedia]
  );

  return {
    media,
    loading,
    uploading,
    error,
    uploadMedia,
    deleteMedia,
    refresh: fetchMedia,
  };
}
