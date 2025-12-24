# Supabase Conversion Quick Reference

## Quick Patterns

### Setup (Every File)

```typescript
// 1. Update imports
import { supabaseAdmin } from '../../../lib/supabase';
// Remove: import { prisma } from '../../../lib/prisma';

// 2. Initialize in handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();
  // ...
}
```

### Read Operations

```typescript
// Single record by ID
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Single record with conditions
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('isActive', true)
  .single();

// Multiple records
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'ADMIN');

// With specific columns
const { data, error } = await supabase
  .from('users')
  .select('id, name, email')
  .eq('role', 'ADMIN');

// With ordering
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('createdAt', { ascending: false });

// With limit
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .limit(10);

// With pagination
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .range(0, 9); // First 10 items (0-indexed)
```

### Write Operations

```typescript
// Create single record
const { data, error } = await supabase
  .from('users')
  .insert({
    id: nanoid(),
    email: 'user@example.com',
    name: 'User Name',
    createdAt: new Date().toISOString()
  })
  .select()
  .single();

// Create multiple records
const { data, error } = await supabase
  .from('users')
  .insert([
    { id: '1', email: 'user1@example.com' },
    { id: '2', email: 'user2@example.com' }
  ])
  .select();

// Update
const { data, error } = await supabase
  .from('users')
  .update({
    name: 'New Name',
    updatedAt: new Date().toISOString()
  })
  .eq('id', userId)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);
```

### Filtering

```typescript
// Equal
.eq('column', value)

// Not equal
.neq('column', value)

// Greater than
.gt('column', value)

// Greater than or equal
.gte('column', value)

// Less than
.lt('column', value)

// Less than or equal
.lte('column', value)

// Like (pattern matching)
.like('column', '%pattern%')

// In array
.in('column', ['value1', 'value2'])

// Is null
.is('column', null)

// Not null
.not('column', 'is', null)

// Multiple conditions (AND)
.eq('role', 'ADMIN')
.eq('isActive', true)

// OR conditions
.or('role.eq.ADMIN,role.eq.SUPER_ADMIN')
```

### Counting

```typescript
// Count all
const { count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true });

// Count with filter
const { count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('role', 'ADMIN');
```

### Error Handling

```typescript
// Basic pattern
const { data, error } = await supabase.from('users').select('*');

if (error) {
  console.error('Database error:', error);
  return res.status(500).json({ error: 'Database error' });
}

if (!data) {
  return res.status(404).json({ error: 'Not found' });
}

// For single() queries
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

if (error || !data) {
  return res.status(404).json({ error: 'User not found' });
}

// Unique constraint violation
if (error?.code === '23505') {
  return res.status(400).json({ error: 'Already exists' });
}
```

### Date Handling

```typescript
// Always use ISO strings
const now = new Date().toISOString();

// In queries
.insert({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

// Date comparisons
.gt('createdAt', new Date('2024-01-01').toISOString())
.lt('expiresAt', new Date().toISOString())
```

### Common Conversions

| Prisma | Supabase |
|--------|----------|
| `findUnique({ where: { id } })` | `.select('*').eq('id', id).single()` |
| `findMany()` | `.select('*')` |
| `findMany({ where })` | `.select('*').eq('field', value)` |
| `create({ data })` | `.insert(data).select().single()` |
| `update({ where, data })` | `.update(data).eq('field', value)` |
| `delete({ where })` | `.delete().eq('field', value)` |
| `count()` | `.select('*', { count: 'exact', head: true })` |
| `findFirst({ where })` | `.select('*').eq('field', value).single()` |
| `orderBy: { field: 'desc' }` | `.order('field', { ascending: false })` |
| `take: 10` | `.limit(10)` |
| `skip: 10` | `.range(10, 19)` |

### Relations / Joins

```typescript
// Simple foreign key join
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    users (
      id,
      name,
      email
    )
  `)
  .eq('authorId', userId);

// Multiple joins
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    users:authorId (name, email),
    categories:categoryId (name, slug)
  `);
```

### Transactions

Supabase doesn't have client-side transactions. Options:

1. **Sequential operations with error handling:**
```typescript
try {
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({ ... })
    .select()
    .single();

  if (userError) throw userError;

  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({ userId: user.id, ... });

  if (logError) {
    // Rollback: delete the user
    await supabase.from('users').delete().eq('id', user.id);
    throw logError;
  }
} catch (error) {
  return res.status(500).json({ error: 'Transaction failed' });
}
```

2. **Use Supabase RPC (stored procedures):**
```typescript
const { data, error } = await supabase.rpc('create_user_with_log', {
  user_data: { ... },
  log_data: { ... }
});
```

### Common Gotchas

1. **Always use `.single()` when expecting one row**
   ```typescript
   // ✅ Correct
   .select('*').eq('id', id).single()

   // ❌ Wrong - returns array
   .select('*').eq('id', id)
   ```

2. **Dates must be ISO strings**
   ```typescript
   // ✅ Correct
   createdAt: new Date().toISOString()

   // ❌ Wrong
   createdAt: new Date()
   ```

3. **Error handling is different**
   ```typescript
   // ✅ Correct
   const { data, error } = await supabase...
   if (error) { /* handle */ }

   // ❌ Wrong - doesn't throw by default
   try {
     const data = await supabase...
   } catch (error) { }
   ```

4. **Table names are singular in Supabase**
   ```typescript
   // If your table is 'users'
   .from('users') // ✅

   // Not
   .from('user') // ❌
   ```

5. **`.select()` is required after insert/update if you want data back**
   ```typescript
   // ✅ Returns the created record
   .insert({ ... }).select().single()

   // ❌ Doesn't return data
   .insert({ ... })
   ```

### Testing Checklist

After converting a file:
- [ ] No TypeScript errors
- [ ] All Prisma imports removed
- [ ] Supabase client initialized
- [ ] Error handling uses `{ data, error }` pattern
- [ ] Dates use `.toISOString()`
- [ ] Single records use `.single()`
- [ ] Insert/update use `.select()` if data needed
- [ ] No `prisma.$disconnect()` calls
- [ ] Test the endpoint works correctly
