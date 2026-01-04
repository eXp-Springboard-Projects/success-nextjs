# SUCCESS.com Admin API Documentation

Last Updated: January 4, 2026

## Overview

This document provides comprehensive documentation for all admin API endpoints in the SUCCESS.com platform.

## Authentication

All admin API endpoints require authentication via NextAuth session. The session must include:

- Valid user session
- Appropriate role: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, or `AUTHOR`
- Department access (for department-specific endpoints)

### Department Access Control

Endpoints under `/api/admin/success-plus/*`, `/api/admin/crm/*`, etc. check department access:

```typescript
hasDepartmentAccess(userRole, userPrimaryDepartment, requiredDepartment)
```

---

## SUCCESS+ API Endpoints

### Courses

#### `GET /api/admin/success-plus/courses`

Get list of courses with optional filtering.

**Query Parameters:**
- `filter` - Filter by status: `all`, `published`, `draft` (default: `all`)
- `search` - Search by title or description
- `limit` - Results per page (default: `50`)
- `offset` - Pagination offset (default: `0`)

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "id": "course_123",
      "title": "Leadership Fundamentals",
      "slug": "leadership-fundamentals",
      "description": "...",
      "instructor": "John Maxwell",
      "instructorBio": "...",
      "duration": 360,
      "level": "BEGINNER",
      "isPremium": true,
      "isPublished": true,
      "modules": 12,
      "enrolledCount": 234,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### `POST /api/admin/success-plus/courses`

Create a new course.

**Request Body:**
```json
{
  "title": "New Course",
  "slug": "new-course",
  "description": "Course description",
  "instructorName": "Jane Doe",
  "instructorBio": "...",
  "duration": 300,
  "level": "INTERMEDIATE",
  "isPremium": true,
  "isPublished": false
}
```

**Response:** `201 Created` with course object

#### `GET /api/admin/success-plus/courses/[id]`

Get single course with modules and lessons.

**Response:**
```json
{
  "success": true,
  "course": {
    "id": "course_123",
    "...": "...",
    "modules": [
      {
        "id": "mod_1",
        "title": "Module 1",
        "lessons": [...]
      }
    ],
    "enrolledCount": 234
  }
}
```

#### `PUT /api/admin/success-plus/courses/[id]`

Update course details.

**Request Body:** Any course fields to update

#### `DELETE /api/admin/success-plus/courses/[id]`

Delete a course. Fails if course has active enrollments.

---

### Events

#### `GET /api/admin/success-plus/events`

Get list of events.

**Query Parameters:**
- `filter` - `all`, `upcoming`, `past`, `published`, `draft`
- `month` - Filter by month (1-12)
- `year` - Filter by year
- `eventType` - Filter by type: `WEBINAR`, `WORKSHOP`, `QA_SESSION`, etc.
- `limit` - Results per page (default: `50`)
- `offset` - Pagination offset (default: `0`)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event_123",
      "title": "SUCCESS Summit 2025",
      "slug": "success-summit-2025",
      "eventType": "CONFERENCE",
      "startDateTime": "2025-03-15T09:00:00.000Z",
      "endDateTime": "2025-03-17T17:00:00.000Z",
      "timezone": "America/New_York",
      "hostName": "John Maxwell",
      "maxAttendees": 500,
      "currentAttendees": 487,
      "isPublished": true
    }
  ],
  "total": 1
}
```

#### `POST /api/admin/success-plus/events`

Create a new event.

**Required Fields:** `title`, `slug`, `startDateTime`

#### `PUT /api/admin/success-plus/events/[id]`

Update event details.

#### `DELETE /api/admin/success-plus/events/[id]`

Delete an event. Fails if event has active registrations.

---

### Community

#### `GET /api/admin/success-plus/community/categories`

Get forum categories.

**Query Parameters:**
- `includeInactive` - Include inactive categories (default: `false`)

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "cat_1",
      "name": "General Discussion",
      "slug": "general",
      "description": "...",
      "icon": "💬",
      "color": "#667eea",
      "order": 0,
      "isActive": true,
      "topicCount": 42
    }
  ]
}
```

#### `POST /api/admin/success-plus/community/categories`

Create a forum category.

**Required Fields:** `name`, `slug`

#### `GET /api/admin/success-plus/community/topics`

Get forum topics.

**Query Parameters:**
- `categoryId` - Filter by category
- `status` - Filter by status: `OPEN`, `CLOSED`, `PINNED`, `LOCKED`
- `search` - Search topics

**Response:**
```json
{
  "success": true,
  "topics": [
    {
      "id": "topic_1",
      "title": "Topic Title",
      "slug": "topic-slug",
      "author": {
        "id": "user_1",
        "name": "John Doe",
        "avatar": "..."
      },
      "category": {...},
      "status": "OPEN",
      "isPinned": false,
      "isLocked": false,
      "viewCount": 150,
      "replyCount": 23,
      "lastReplyAt": "2025-01-03T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### `POST /api/admin/success-plus/community/topics`

Create a new forum topic.

**Required Fields:** `categoryId`, `title`, `slug`, `content`

---

### Shop

#### `GET /api/admin/success-plus/shop/products`

Get products list.

**Query Parameters:**
- `category` - Filter by category: `BOOKS`, `COURSES`, `MERCHANDISE`, etc.
- `status` - `ACTIVE`, `DRAFT`, `OUT_OF_STOCK`, `ARCHIVED`, `all`
- `featured` - `true` to get only featured products
- `search` - Search by name, description, or SKU

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod_123",
      "name": "Product Name",
      "slug": "product-slug",
      "price": 29.99,
      "salePrice": 19.99,
      "sku": "PROD-001",
      "category": "BOOKS",
      "status": "ACTIVE",
      "featured": true,
      "inventory": 100,
      "stripeProductId": "prod_stripe_123",
      "stripePriceId": "price_stripe_123"
    }
  ],
  "total": 1
}
```

#### `POST /api/admin/success-plus/shop/products`

Create a new product.

**Required Fields:** `name`, `slug`, `price`, `category`

#### `PUT /api/admin/success-plus/shop/[id]`

Update product details.

#### `DELETE /api/admin/success-plus/shop/[id]`

Delete a product. Fails if product has order history (recommends archiving instead).

---

## Resources API

#### `GET /api/admin/resources`

Get resources list.

**Query Parameters:**
- `category` - Filter by category

**Response:** Array of resources

#### `GET /api/admin/resources/[id]`

Get single resource.

#### `PUT /api/admin/resources/[id]`

Update resource.

#### `DELETE /api/admin/resources/[id]`

Delete resource.

---

## Notifications API

#### `GET /api/admin/notifications/count`

Get count of unread notifications for current user.

**Response:**
```json
{
  "count": 5,
  "hasUnread": true
}
```

#### `GET /api/admin/notifications`

Get notifications for current user.

#### `PUT /api/admin/notifications/mark-all-read`

Mark all notifications as read.

---

## Dashboard Stats APIs

### SUCCESS+ Dashboard

#### `GET /api/admin/success-plus/dashboard-stats`

Get SUCCESS+ dashboard statistics.

**Response:**
```json
{
  "activeMembers": 1234,
  "newMembersThisMonth": 56,
  "churnRate": 2.5,
  "monthlyRecurringRevenue": 36000,
  "activeTrials": 23,
  "totalTrials": 145,
  "recentActivity": [
    {
      "id": "act_1",
      "type": "signup",
      "description": "New member joined",
      "timestamp": "2025-01-04T10:00:00.000Z",
      "user": "John Doe"
    }
  ]
}
```

**Error Handling:** Returns fallback data with `partial: true` flag on errors.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error (in development)",
  "suggestion": "Optional suggestion (e.g., 'Archive instead of delete')"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no session)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

---

## Database Schema Notes

### Tables

- **courses** - Courses with modules and lessons
- **course_modules** - Course sections
- **course_lessons** - Individual lessons within modules
- **course_enrollments** - User enrollments in courses
- **events** - SUCCESS+ events (webinars, workshops, etc.)
- **event_registrations** - User event registrations
- **community_categories** - Forum categories
- **community_topics** - Forum discussion threads
- **community_posts** - Replies to topics
- **community_post_likes** - Post likes
- **community_subscriptions** - Topic subscriptions
- **products** - Shop products
- **resources** - Downloadable resources
- **notifications** - User notifications

### Enums

- **CourseLevel**: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `ALL_LEVELS`
- **EventType**: `WEBINAR`, `WORKSHOP`, `QA_SESSION`, `NETWORKING`, `MASTERCLASS`, `CONFERENCE`
- **TopicStatus**: `OPEN`, `CLOSED`, `PINNED`, `LOCKED`
- **PostStatus**: `PUBLISHED`, `FLAGGED`, `DELETED`
- **ProductCategory**: `BOOKS`, `COURSES`, `MERCHANDISE`, `MAGAZINES`, `BUNDLES`, `MEMBERSHIPS`
- **ProductStatus**: `DRAFT`, `PUBLISHED`, `OUT_OF_STOCK`, `ARCHIVED`, `ACTIVE`, `DISCONTINUED`
- **ResourceCategory**: `TEMPLATES`, `GUIDES`, `WORKSHEETS`, `EBOOKS`, `TOOLS`, `CHECKLISTS`

---

## Security Best Practices

1. **Always validate input** - All endpoints validate required fields
2. **Check slugs for uniqueness** - Prevents duplicate routes
3. **Prevent cascading failures** - Error handlers return safe fallback data
4. **Log errors with context** - Includes timestamps, user IDs, error details
5. **Protect from deletion** - Checks for dependencies before allowing deletion
6. **Department-based access** - Ensures users only access their authorized areas

---

## Migration Scripts

- `CREATE_COMMUNITY_TABLES.sql` - Community forum tables
- `CREATE_PAGE_OVERRIDES_TABLE.sql` - Page editor overrides

---

## Next Steps

For production deployment:

1. Run migration scripts on Supabase
2. Set up Stripe integration for products
3. Configure email notifications for events/courses
4. Set up CDN for media files
5. Implement rate limiting on API endpoints
6. Add request logging/monitoring
7. Set up automated backups

---

Generated by Claude Code on January 4, 2026
