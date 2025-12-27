/**
 * useSocialPosts Hook
 * Manage social media posts (CRUD operations)
 */

import { useState, useEffect, useCallback } from 'react';
import { SocialPost, CreatePostRequest, UpdatePostRequest, Platform, PostStatus } from '@/types/social';

interface UsePostsOptions {
  status?: PostStatus;
  platform?: Platform;
  autoFetch?: boolean;
}

export function useSocialPosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.platform) params.append('platform', options.platform);

      const res = await fetch(`/api/social/posts?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPosts(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.platform]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchPosts();
    }
  }, [fetchPosts, options.autoFetch]);

  const createPost = useCallback(
    async (postData: CreatePostRequest): Promise<SocialPost> => {
      try {
        const res = await fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });

        const data = await res.json();

        if (data.success) {
          await fetchPosts();
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to create post');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [fetchPosts]
  );

  const updatePost = useCallback(
    async (postId: string, updates: UpdatePostRequest): Promise<SocialPost> => {
      try {
        const res = await fetch(`/api/social/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await res.json();

        if (data.success) {
          await fetchPosts();
          return data.data;
        } else {
          throw new Error(data.error || 'Failed to update post');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [fetchPosts]
  );

  const deletePost = useCallback(
    async (postId: string): Promise<void> => {
      try {
        const res = await fetch(`/api/social/posts/${postId}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (data.success) {
          await fetchPosts();
        } else {
          throw new Error(data.error || 'Failed to delete post');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [fetchPosts]
  );

  const publishPost = useCallback(
    async (postId: string, platforms?: Platform[]): Promise<void> => {
      try {
        const res = await fetch('/api/social/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, platforms }),
        });

        const data = await res.json();

        if (data.success) {
          await fetchPosts();
        } else {
          throw new Error(data.error || 'Failed to publish post');
        }
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [fetchPosts]
  );

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    refresh: fetchPosts,
  };
}
