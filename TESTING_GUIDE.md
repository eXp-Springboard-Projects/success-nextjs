# Admin Dashboard Testing Guide

Complete testing procedures for all admin dashboard features.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Ensure .env.local has all required variables
   DATABASE_URL=postgres://...
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2
   ```

2. **Database Ready**
   - Run migration scripts:
     - `CREATE_COMMUNITY_TABLES.sql`
     - `CREATE_PAGE_OVERRIDES_TABLE.sql`
   - Verify all tables exist in Supabase

3. **Test User Account**
   - Role: SUPER_ADMIN
   - Email: test@success.com
   - Primary Department: SUCCESS_PLUS

---

## Authentication Testing

### Test 1: Login Flow
**Steps:**
1. Navigate to `/admin/login`
2. Enter credentials
3. Verify redirect to `/admin` dashboard
4. Check session persists on page refresh

**Expected:**
- ✓ Successful login
- ✓ Session cookie set
- ✓ Redirect to dashboard
- ✓ User name displayed in sidebar

### Test 2: Protected Routes
**Steps:**
1. Without login, try to access `/admin/posts`
2. Verify redirect to `/admin/login`
3. Login and verify access granted

**Expected:**
- ✓ Unauthenticated users redirected
- ✓ Authenticated users can access

### Test 3: Role-Based Access
**Steps:**
1. Login as EDITOR role
2. Try to access `/admin/staff` (SUPER_ADMIN only)
3. Verify access denied

**Expected:**
- ✓ 403 Forbidden or redirect to `/admin`
- ✓ Error message displayed

---

## SUCCESS+ Courses Testing

### Test 4: List Courses
**Endpoint:** `GET /api/admin/success-plus/courses`

**Test Cases:**
```bash
# All courses
curl http://localhost:3000/api/admin/success-plus/courses

# Published only
curl http://localhost:3000/api/admin/success-plus/courses?filter=published

# Search
curl http://localhost:3000/api/admin/success-plus/courses?search=leadership
```

**Expected:**
- ✓ Returns 200 OK
- ✓ JSON array of courses
- ✓ Filters work correctly
- ✓ Pagination with limit/offset

### Test 5: Create Course
**Endpoint:** `POST /api/admin/success-plus/courses`

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/success-plus/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "slug": "test-course-001",
    "description": "A test course",
    "instructorName": "John Doe",
    "duration": 300,
    "level": "BEGINNER",
    "isPremium": true,
    "isPublished": false
  }'
```

**Expected:**
- ✓ Returns 201 Created
- ✓ Course object in response
- ✓ Course appears in GET list
- ✓ Slug uniqueness enforced

**Negative Test - Duplicate Slug:**
```bash
# Try creating with same slug again
# Expected: 400 Bad Request with error message
```

### Test 6: Update Course
**Endpoint:** `PUT /api/admin/success-plus/courses/[id]`

**Test:**
```bash
curl -X PUT http://localhost:3000/api/admin/success-plus/courses/course_123 \
  -H "Content-Type: application/json" \
  -d '{"isPublished": true}'
```

**Expected:**
- ✓ Returns 200 OK
- ✓ Course updated in database
- ✓ Changes reflected in GET request

### Test 7: Delete Course
**Endpoint:** `DELETE /api/admin/success-plus/courses/[id]`

**Test:**
```bash
# Delete course without enrollments
curl -X DELETE http://localhost:3000/api/admin/success-plus/courses/course_123
```

**Expected:**
- ✓ Returns 200 OK if no enrollments
- ✓ Returns 400 if enrollments exist
- ✓ Cascades to modules/lessons

---

## SUCCESS+ Events Testing

### Test 8: List Events
**Endpoint:** `GET /api/admin/success-plus/events`

**Test Cases:**
```bash
# Upcoming events
curl http://localhost:3000/api/admin/success-plus/events?filter=upcoming

# Events by month
curl http://localhost:3000/api/admin/success-plus/events?month=3&year=2025

# By event type
curl http://localhost:3000/api/admin/success-plus/events?eventType=WEBINAR
```

**Expected:**
- ✓ Returns 200 OK
- ✓ Correct filtering
- ✓ Date/time formatting correct

### Test 9: Create Event
**Endpoint:** `POST /api/admin/success-plus/events`

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/success-plus/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Webinar",
    "slug": "test-webinar-001",
    "eventType": "WEBINAR",
    "startDateTime": "2025-03-15T14:00:00Z",
    "endDateTime": "2025-03-15T15:30:00Z",
    "timezone": "America/New_York",
    "hostName": "Jane Doe",
    "maxAttendees": 100,
    "isPublished": false
  }'
```

**Expected:**
- ✓ Returns 201 Created
- ✓ Event appears in calendar
- ✓ Timezone handled correctly

### Test 10: Event Registration Protection
**Test:**
1. Create event with maxAttendees: 50
2. Add 30 test registrations
3. Try to delete event

**Expected:**
- ✓ Delete fails with 400
- ✓ Error message suggests alternatives
- ✓ Registration count accurate

---

## Community Forum Testing

### Test 11: Create Category
**Endpoint:** `POST /api/admin/success-plus/community/categories`

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/success-plus/community/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Discussion",
    "slug": "general",
    "description": "General topics",
    "icon": "💬",
    "color": "#667eea",
    "order": 0
  }'
```

**Expected:**
- ✓ Returns 201 Created
- ✓ Category appears in GET list
- ✓ Slug unique

### Test 12: Create Topic
**Endpoint:** `POST /api/admin/success-plus/community/topics`

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/success-plus/community/topics \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "cat_123",
    "title": "Test Topic",
    "slug": "test-topic-001",
    "content": "This is a test topic content",
    "isPinned": false,
    "isLocked": false
  }'
```

**Expected:**
- ✓ Returns 201 Created
- ✓ Topic linked to category
- ✓ Author set to current user
- ✓ Reply count initialized to 0

---

## Shop Products Testing

### Test 13: List Products
**Endpoint:** `GET /api/admin/success-plus/shop/products`

**Test Cases:**
```bash
# All products
curl http://localhost:3000/api/admin/success-plus/shop/products

# By category
curl http://localhost:3000/api/admin/success-plus/shop/products?category=BOOKS

# Featured only
curl http://localhost:3000/api/admin/success-plus/shop/products?featured=true

# Search
curl http://localhost:3000/api/admin/success-plus/shop/products?search=leadership
```

**Expected:**
- ✓ Returns 200 OK
- ✓ Filters work correctly
- ✓ Pagination supported

### Test 14: Create Product
**Endpoint:** `POST /api/admin/success-plus/shop/products`

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/success-plus/shop/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUCCESS Magazine - 1 Year",
    "slug": "magazine-1-year",
    "description": "Annual magazine subscription",
    "price": 29.99,
    "sku": "MAG-ANNUAL",
    "category": "MAGAZINES",
    "status": "ACTIVE",
    "inventory": 1000,
    "stripeProductId": "prod_test_123"
  }'
```

**Expected:**
- ✓ Returns 201 Created
- ✓ Product in database
- ✓ Price formatted correctly

### Test 15: Product Deletion Protection
**Test:**
1. Create product
2. Create test order with product
3. Try to delete product

**Expected:**
- ✓ Delete fails with 400
- ✓ Error suggests archiving
- ✓ Product remains in database

---

## Resources Testing

### Test 16: Upload Resource
**Manual Test:**
1. Navigate to `/admin/resources`
2. Click "Upload File"
3. Select PDF file
4. Fill in title, description, category
5. Submit

**Expected:**
- ✓ File uploaded to storage
- ✓ Resource created in database
- ✓ Appears in resources list
- ✓ Download count = 0

### Test 17: Edit Resource
**Manual Test:**
1. Navigate to `/admin/resources`
2. Click "Edit" on a resource
3. Change title and category
4. Save changes

**Expected:**
- ✓ Redirect to `/admin/resources/[id]/edit`
- ✓ Form populated with current data
- ✓ Changes saved successfully
- ✓ File cannot be changed (field disabled)

---

## Dashboard Stats Testing

### Test 18: SUCCESS+ Dashboard Stats
**Endpoint:** `GET /api/admin/success-plus/dashboard-stats`

**Test:**
```bash
curl http://localhost:3000/api/admin/success-plus/dashboard-stats
```

**Expected:**
- ✓ Returns 200 OK even on partial failures
- ✓ All stat fields present
- ✓ Recent activity array populated
- ✓ `partial: true` flag if errors occurred

**Error Scenario:**
1. Stop Supabase connection temporarily
2. Request dashboard stats

**Expected:**
- ✓ Returns fallback data (all zeros)
- ✓ Error logged to console
- ✓ `partial: true` flag set
- ✓ Dashboard still renders

---

## Notifications Testing

### Test 19: Notification Count
**Endpoint:** `GET /api/admin/notifications/count`

**Test:**
```bash
curl http://localhost:3000/api/admin/notifications/count
```

**Expected:**
- ✓ Returns `{"count": N, "hasUnread": true/false}`
- ✓ Count accurate for current user
- ✓ Updates when notifications marked read

---

## Frontend UI Testing

### Test 20: Courses Manager UI
**Manual Test:**
1. Navigate to `/admin/success-plus/courses`
2. Verify courses list loads
3. Use filter dropdown (All, Published, Draft)
4. Click "Edit" on a course
5. Toggle publish status
6. Delete a course

**Expected:**
- ✓ Loading states display
- ✓ Filters update list
- ✓ Edit navigation works
- ✓ Publish toggle updates UI immediately
- ✓ Delete confirmation shown
- ✓ Error messages display on failure

### Test 21: Events Manager UI
**Manual Test:**
1. Navigate to `/admin/success-plus/events`
2. Create new event
3. Edit existing event
4. Toggle publish status
5. Try to delete event with registrations

**Expected:**
- ✓ Calendar view displays correctly
- ✓ Date/time pickers work
- ✓ Timezone selector functional
- ✓ Capacity tracking accurate
- ✓ Error on delete with registrations

### Test 22: Page Editor
**Manual Test:**
1. Navigate to `/admin/page-editor`
2. Select a page (e.g., /about)
3. Add CSS override: `.title { color: red; }`
4. Save changes
5. Visit `/about` page
6. Verify title is red

**Expected:**
- ✓ Page selection works
- ✓ Override saved to database
- ✓ Changes apply on frontend
- ✓ Reset button clears overrides

---

## Error Handling Testing

### Test 23: API Error Responses
**Test Cases:**
1. Invalid authentication
2. Missing required fields
3. Duplicate slugs
4. Foreign key violations
5. Database connection errors

**Expected:**
- ✓ Consistent error format
- ✓ Appropriate status codes
- ✓ Helpful error messages
- ✓ No stack traces in production

### Test 24: Frontend Error States
**Manual Test:**
1. Disconnect internet
2. Try to fetch courses
3. Verify error message displayed
4. Reconnect and retry

**Expected:**
- ✓ Loading states clear
- ✓ Error message shown
- ✓ Retry mechanism works
- ✓ No crashes

---

## Performance Testing

### Test 25: Large Data Sets
**Test:**
1. Create 100+ courses
2. List courses with pagination
3. Search across courses
4. Measure response times

**Expected:**
- ✓ Response < 1 second
- ✓ Pagination works smoothly
- ✓ Search is performant
- ✓ No memory leaks

### Test 26: Concurrent Users
**Test:**
1. Simulate 10 concurrent users
2. All creating courses simultaneously
3. Verify no race conditions

**Expected:**
- ✓ All creates succeed
- ✓ No duplicate IDs
- ✓ Database constraints enforced

---

## Security Testing

### Test 27: Department Access Control
**Test:**
1. Login as user with PRIMARY_DEPARTMENT = EDITORIAL
2. Try to access `/admin/success-plus/courses`
3. Verify denied

**Expected:**
- ✓ 403 Forbidden response
- ✓ Proper error message
- ✓ No data leaked

### Test 28: SQL Injection Protection
**Test:**
```bash
# Try SQL injection in search
curl "http://localhost:3000/api/admin/success-plus/courses?search=' OR 1=1--"
```

**Expected:**
- ✓ No SQL executed
- ✓ Query handled safely
- ✓ Returns empty or safe results

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] All existing tests still pass
- [ ] No new console errors
- [ ] Authentication still works
- [ ] Dashboard loads correctly
- [ ] No duplicate routes warning
- [ ] All navigation links work
- [ ] Search functionality intact
- [ ] Forms submit correctly
- [ ] Error states display
- [ ] Mobile responsive design maintained

---

## Automated Testing (Future)

### Recommended Testing Framework

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event msw
```

### Example Unit Test
```typescript
// __tests__/api/courses.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/success-plus/courses';

describe('/api/admin/success-plus/courses', () => {
  it('returns courses list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('courses');
  });
});
```

---

## Bug Report Template

When reporting issues, include:

1. **Environment:** Dev/Staging/Production
2. **User Role:** SUPER_ADMIN/ADMIN/EDITOR
3. **Steps to Reproduce:** Numbered list
4. **Expected Behavior:** What should happen
5. **Actual Behavior:** What actually happened
6. **Screenshots:** If applicable
7. **Console Errors:** Browser console output
8. **Network Tab:** Failed API requests

---

## Testing Sign-Off Checklist

Before production deployment:

- [ ] All API endpoints tested
- [ ] All UI pages tested
- [ ] Error handling verified
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Mobile responsiveness checked
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Backup procedures tested

---

Generated by Claude Code on January 4, 2026
