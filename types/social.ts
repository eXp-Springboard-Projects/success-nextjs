/**
 * Social Media Calendar & Auto-Poster - TypeScript Types
 *
 * All type definitions for the social media scheduling feature
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'threads';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';

export type PostResultStatus = 'pending' | 'posted' | 'failed';

// Platform character limits
export const PLATFORM_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  threads: 500,
};

// Platform names for display
export const PLATFORM_NAMES: Record<Platform, string> = {
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  threads: 'Threads',
};

// Platform colors for UI
export const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  threads: '#000000',
};

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface SocialAccount {
  id: string;
  userId: string;
  platform: Platform;
  platformUserId: string;
  platformUsername: string | null;
  platformDisplayName: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  profileImageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPost {
  id: string;
  userId: string;
  content: string;
  contentVariants: Record<Platform, string>;
  mediaUrls: string[];
  mediaIds: string[];
  linkUrl: string | null;
  linkPreview: LinkPreview | null;
  scheduledAt: Date;
  publishedAt: Date | null;
  status: PostStatus;
  targetPlatforms: Platform[];
  isEvergreen: boolean;
  evergreenIntervalDays: number | null;
  lastRecycledAt: Date | null;
  recycleCount: number;
  queuePosition: number | null;
  createdAt: Date;
  updatedAt: Date;
  results?: SocialPostResult[];
}

export interface SocialPostResult {
  id: string;
  postId: string;
  socialAccountId: string;
  platform: Platform;
  platformPostId: string | null;
  platformPostUrl: string | null;
  status: PostResultStatus;
  errorMessage: string | null;
  postedAt: Date | null;
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  analyticsUpdatedAt: Date | null;
  createdAt: Date;
}

export interface MediaItem {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altText: string | null;
  tags: string[];
  folder: string;
  createdAt: Date;
}

export interface QueueSlot {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6, 0=Sunday
  timeSlot: string; // HH:MM format
  platforms: Platform[];
  isActive: boolean;
  createdAt: Date;
}

export interface HashtagGroup {
  id: string;
  userId: string;
  name: string;
  hashtags: string[];
  createdAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface LinkPreview {
  title: string;
  description: string;
  image: string;
  url: string;
}

export interface CreatePostRequest {
  content: string;
  contentVariants?: Record<Platform, string>;
  mediaIds?: string[];
  linkUrl?: string;
  scheduledAt: Date | string;
  targetPlatforms: Platform[];
  isEvergreen?: boolean;
  evergreenIntervalDays?: number;
}

export interface UpdatePostRequest {
  content?: string;
  contentVariants?: Record<Platform, string>;
  mediaIds?: string[];
  linkUrl?: string;
  scheduledAt?: Date | string;
  targetPlatforms?: Platform[];
  status?: PostStatus;
  isEvergreen?: boolean;
  evergreenIntervalDays?: number;
}

export interface PublishPostRequest {
  postId: string;
  platforms?: Platform[]; // If not provided, use post's targetPlatforms
}

export interface UploadMediaRequest {
  file: File;
  altText?: string;
  tags?: string[];
  folder?: string;
}

export interface CreateAccountRequest {
  platform: Platform;
  code: string; // OAuth authorization code
  state: string; // OAuth state for CSRF protection
}

export interface CreateQueueSlotRequest {
  dayOfWeek: number;
  timeSlot: string;
  platforms: Platform[];
}

export interface CreateHashtagGroupRequest {
  name: string;
  hashtags: string[];
}

// ============================================================================
// PLATFORM API TYPES
// ============================================================================

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PlatformPostResult {
  platformPostId: string;
  platformPostUrl: string;
  postedAt: Date;
}

export interface AnalyticsData {
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface PlatformClient {
  /**
   * Validate if a token is still valid
   */
  validateToken(account: SocialAccount): Promise<boolean>;

  /**
   * Refresh an expired token
   */
  refreshToken(account: SocialAccount): Promise<TokenPair>;

  /**
   * Publish a post to the platform
   */
  publishPost(account: SocialAccount, post: SocialPost, media: MediaItem[]): Promise<PlatformPostResult>;

  /**
   * Delete a post from the platform
   */
  deletePost(account: SocialAccount, platformPostId: string): Promise<void>;

  /**
   * Get analytics for a post
   */
  getAnalytics(account: SocialAccount, platformPostId: string): Promise<AnalyticsData>;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

export interface PostComposerProps {
  post?: SocialPost; // For editing existing posts
  onSave: (post: CreatePostRequest | UpdatePostRequest) => Promise<void>;
  onCancel: () => void;
}

export interface PostPreviewProps {
  content: string;
  platform: Platform;
  mediaItems?: MediaItem[];
  linkPreview?: LinkPreview | null;
  profileImage?: string;
  profileName?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    post: SocialPost;
  };
}

export interface MediaPickerProps {
  selected: string[]; // Array of media IDs
  onSelect: (mediaIds: string[]) => void;
  maxItems?: number;
  allowedTypes?: string[]; // e.g., ['image/*', 'video/*']
}

export interface QueueListProps {
  posts: SocialPost[];
  onReorder: (posts: SocialPost[]) => void;
  onEdit: (post: SocialPost) => void;
  onDelete: (postId: string) => void;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseSocialAccountsReturn {
  accounts: SocialAccount[];
  loading: boolean;
  error: Error | null;
  connect: (platform: Platform) => void;
  disconnect: (accountId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseSocialPostsReturn {
  posts: SocialPost[];
  loading: boolean;
  error: Error | null;
  createPost: (data: CreatePostRequest) => Promise<SocialPost>;
  updatePost: (id: string, data: UpdatePostRequest) => Promise<SocialPost>;
  deletePost: (id: string) => Promise<void>;
  publishPost: (id: string, platforms?: Platform[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseMediaLibraryReturn {
  media: MediaItem[];
  loading: boolean;
  error: Error | null;
  uploadMedia: (file: File, metadata?: Partial<MediaItem>) => Promise<MediaItem>;
  deleteMedia: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UsePostAnalyticsReturn {
  analytics: Record<string, AnalyticsData>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export interface PostFilters {
  status?: PostStatus[];
  platforms?: Platform[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export type PostSortField = 'scheduledAt' | 'createdAt' | 'status' | 'queuePosition';
export type SortDirection = 'asc' | 'desc';

export interface PostSort {
  field: PostSortField;
  direction: SortDirection;
}
