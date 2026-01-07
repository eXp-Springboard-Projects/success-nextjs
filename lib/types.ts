// ========================================
// SHARED TYPES FOR SUPABASE DATABASE
// This file replaces @prisma/client imports
// ========================================

// ========================================
// ENUMS
// ========================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  AUTHOR = 'AUTHOR',
  PENDING = 'PENDING',
}

export enum Department {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  EDITORIAL = 'EDITORIAL',
  SUCCESS_PLUS = 'SUCCESS_PLUS',
  DEV = 'DEV',
  MARKETING = 'MARKETING',
  COACHING = 'COACHING',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ContentPillar {
  AI_TECHNOLOGY = 'AI_TECHNOLOGY',
  BUSINESS_BRANDING = 'BUSINESS_BRANDING',
  CULTURE_WORKPLACE = 'CULTURE_WORKPLACE',
  ENTREPRENEURSHIP = 'ENTREPRENEURSHIP',
  LEADERSHIP = 'LEADERSHIP',
  LONGEVITY_PERFORMANCE = 'LONGEVITY_PERFORMANCE',
  MONEY = 'MONEY',
  PHILANTHROPY = 'PHILANTHROPY',
  PROFESSIONAL_GROWTH = 'PROFESSIONAL_GROWTH',
  TRENDS_INSIGHTS = 'TRENDS_INSIGHTS',
}

export enum BulkStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
}

export enum CommentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SPAM = 'SPAM',
  TRASH = 'TRASH',
}

export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  BOUNCED = 'BOUNCED',
  SPAM = 'SPAM',
}

export enum ContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  PODCAST = 'PODCAST',
  MAGAZINE = 'MAGAZINE',
  PAGE = 'PAGE',
  NEWSLETTER = 'NEWSLETTER',
}

export enum EditorialStatus {
  IDEA = 'IDEA',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum MembershipTier {
  Free = 'Free',
  Customer = 'Customer',
  SUCCESSPlus = 'SUCCESSPlus',
  VIP = 'VIP',
  Enterprise = 'Enterprise',
}

export enum MemberStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Cancelled = 'Cancelled',
}

export enum PriorityLevel {
  Standard = 'Standard',
  High = 'High',
  VIP = 'VIP',
  Enterprise = 'Enterprise',
}

export enum DisputeType {
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',
  DISPUTE = 'DISPUTE',
  CANCELLATION = 'CANCELLATION',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  SHIPPED = 'SHIPPED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ProductCategory {
  BOOKS = 'BOOKS',
  COURSES = 'COURSES',
  MERCHANDISE = 'MERCHANDISE',
  MAGAZINES = 'MAGAZINES',
  BUNDLES = 'BUNDLES',
  MEMBERSHIPS = 'MEMBERSHIPS',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export enum SubscriberStatus {
  ACTIVE = 'ACTIVE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  BOUNCED = 'BOUNCED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
}

export enum SubscriberType {
  MagazinePrint = 'MagazinePrint',
  MagazineDigital = 'MagazineDigital',
  SUCCESSPlus = 'SUCCESSPlus',
  CoachingProgram = 'CoachingProgram',
  EmailNewsletter = 'EmailNewsletter',
  All = 'All',
}

export enum RecipientType {
  Customer = 'Customer',
  Agent = 'Agent',
  Staff = 'Staff',
  Partner = 'Partner',
  Press = 'Press',
  Other = 'Other',
}

export enum PayLinkStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProjectStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum AlertType {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
  Critical = 'Critical',
  Success = 'Success',
}

export enum AlertCategory {
  Security = 'Security',
  Payment = 'Payment',
  System = 'System',
  Content = 'Content',
  CustomerService = 'CustomerService',
  Integration = 'Integration',
  Performance = 'Performance',
  Compliance = 'Compliance',
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  MENTION = 'MENTION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SLA_BREACH = 'SLA_BREACH',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  APPROVAL_NEEDED = 'APPROVAL_NEEDED',
  COMMENT_REPLY = 'COMMENT_REPLY',
  REPORT_READY = 'REPORT_READY',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ActivityType {
  ARTICLE_READ = 'ARTICLE_READ',
  ARTICLE_BOOKMARKED = 'ARTICLE_BOOKMARKED',
  VIDEO_WATCHED = 'VIDEO_WATCHED',
  PODCAST_LISTENED = 'PODCAST_LISTENED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  SUBSCRIPTION_STARTED = 'SUBSCRIPTION_STARTED',
}

export enum ListType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
}

export enum WebhookStatus {
  Success = 'Success',
  Failed = 'Failed',
  Pending = 'Pending',
  Retrying = 'Retrying',
  MaxAttemptsReached = 'MaxAttemptsReached',
}

export enum ExecutionStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum GDPRRequestType {
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  DATA_CORRECTION = 'DATA_CORRECTION',
  CONSENT_WITHDRAWAL = 'CONSENT_WITHDRAWAL',
}

export enum GDPRStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum BackupType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
}

export enum BackupStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum EmailDeliveryStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  BOUNCED = 'BOUNCED',
  DEFERRED = 'DEFERRED',
  SPAM = 'SPAM',
  DROPPED = 'DROPPED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ALL_LEVELS = 'ALL_LEVELS',
}

export enum ResourceCategory {
  TEMPLATES = 'TEMPLATES',
  GUIDES = 'GUIDES',
  WORKSHEETS = 'WORKSHEETS',
  EBOOKS = 'EBOOKS',
  TOOLS = 'TOOLS',
  CHECKLISTS = 'CHECKLISTS',
}

export enum EventType {
  WEBINAR = 'WEBINAR',
  WORKSHOP = 'WORKSHOP',
  QA_SESSION = 'QA_SESSION',
  NETWORKING = 'NETWORKING',
  MASTERCLASS = 'MASTERCLASS',
  CONFERENCE = 'CONFERENCE',
}

export enum EventRegistrationStatus {
  REGISTERED = 'REGISTERED',
  WAITLISTED = 'WAITLISTED',
  CANCELED = 'CANCELED',
  ATTENDED = 'ATTENDED',
}

export enum DeploymentStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum AnnouncementType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ALERT = 'ALERT',
  MAINTENANCE = 'MAINTENANCE',
}

// ========================================
// DATABASE TABLE TYPES
// ========================================

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  bio?: string | null;
  avatar?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resetToken?: string | null;
  resetTokenExpiry?: Date | string | null;
  emailVerificationToken?: string | null;
  emailVerified: boolean;
  lastLoginAt?: Date | string | null;
  hasChangedDefaultPassword: boolean;
  inviteCode?: string | null;
  invitedBy?: string | null;
  authorPageSlug?: string | null;
  jobTitle?: string | null;
  socialFacebook?: string | null;
  socialLinkedin?: string | null;
  socialTwitter?: string | null;
  website?: string | null;
  wordpressId?: number | null;
  interests?: string[];
  onboardingCompleted: boolean;
  memberId?: string | null;
  isActive: boolean;
  primaryDepartment?: Department | null;
  linkedMemberId?: string | null;
  trialEndsAt?: Date | string | null;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  joinDate: Date | string;
  membershipTier: MembershipTier;
  lastLoginDate?: Date | string | null;
  totalSpent: number;
  lifetimeValue: number;
  engagementScore: number;
  tags?: string[];
  billingAddress?: any;
  shippingAddress?: any;
  communicationPreferences?: any;
  assignedCSRep?: string | null;
  internalNotes?: string | null;
  stripeCustomerId?: string | null;
  paykickstartCustomerId?: string | null;
  woocommerceCustomerId?: number | null;
  lastContactDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  membershipStatus: MemberStatus;
  priorityLevel: PriorityLevel;
  trialEndsAt?: Date | string | null;
  trialStartedAt?: Date | string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  status: PostStatus;
  authorId: string;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  readTime?: number | null;
  views: number;
  canonicalUrl?: string | null;
  customExcerpt: boolean;
  featuredImageCaption?: string | null;
  metaKeywords?: string | null;
  wordpressAuthor?: string | null;
  wordpressId?: number | null;
  wordpressSlug?: string | null;
  contentPillar?: ContentPillar | null;
  customAuthorId?: string | null;
  featureOnHomepage: boolean;
  featureInPillar: boolean;
  featureTrending: boolean;
  mainFeaturedArticle: boolean;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  order: number;
  parentId?: string | null;
  template?: string | null;
  wordpressId?: number | null;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  color?: string | null;
  icon?: string | null;
  order: number;
  wordpressId?: number | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  description?: string | null;
  postCount: number;
  wordpressId?: number | null;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  company?: string | null;
  tags?: string[];
  status: ContactStatus;
  source?: string | null;
  notes?: string | null;
  lastContactedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  emailEngagementScore: number;
  leadScore: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  templateId?: string | null;
  scheduledAt?: Date | string | null;
  sentAt?: Date | string | null;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  sendErrors?: any;
}

export interface Order {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentId?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  orderSource: string;
  woocommerceOrderId?: string | null;
  fulfillmentStatus: string;
  fulfilledAt?: Date | string | null;
  fulfilledBy?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  packingSlipPrinted: boolean;
  internalNotes?: string | null;
  customerNotes?: string | null;
  deliveredDate?: Date | string | null;
  memberId: string;
  shippedDate?: Date | string | null;
}

export interface Subscription {
  id: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodStart?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  billingCycle?: string | null;
  tier?: string | null;
  status: string;
  paykickstartCustomerId?: string | null;
  paykickstartSubscriptionId?: string | null;
  provider: string;
  memberId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  linkedIn?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  icon?: string | null;
  isRead: boolean;
  priority: NotificationPriority;
  metadata?: any;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
  readAt?: Date | string | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetAudience: string;
  isActive: boolean;
  isPinned: boolean;
  publishedAt: Date | string;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  dismissible: boolean;
  linkUrl?: string | null;
  linkText?: string | null;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  photo?: string | null;
  email?: string | null;
  title?: string | null;
  socialLinkedin?: string | null;
  socialTwitter?: string | null;
  socialFacebook?: string | null;
  website?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
  wordpressId?: number | null;
}

// Type guards for runtime checking
export const isUserRole = (value: string): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole);
};

export const isDepartment = (value: string): value is Department => {
  return Object.values(Department).includes(value as Department);
};

export const isPostStatus = (value: string): value is PostStatus => {
  return Object.values(PostStatus).includes(value as PostStatus);
};

export const isContentPillar = (value: string): value is ContentPillar => {
  return Object.values(ContentPillar).includes(value as ContentPillar);
};

// Helper function to get human-readable content pillar names
export const getContentPillarLabel = (pillar: ContentPillar): string => {
  const labels: Record<ContentPillar, string> = {
    [ContentPillar.AI_TECHNOLOGY]: 'AI & Technology',
    [ContentPillar.BUSINESS_BRANDING]: 'Business & Branding',
    [ContentPillar.CULTURE_WORKPLACE]: 'Culture & Workplace',
    [ContentPillar.ENTREPRENEURSHIP]: 'Entrepreneurship',
    [ContentPillar.LEADERSHIP]: 'Leadership',
    [ContentPillar.LONGEVITY_PERFORMANCE]: 'Longevity & Performance',
    [ContentPillar.MONEY]: 'Money',
    [ContentPillar.PHILANTHROPY]: 'Philanthropy',
    [ContentPillar.PROFESSIONAL_GROWTH]: 'Professional Growth',
    [ContentPillar.TRENDS_INSIGHTS]: 'Trends & Insights',
  };
  return labels[pillar];
};
