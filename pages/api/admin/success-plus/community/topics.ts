import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { Department } from '@/lib/types';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as any;

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.SUCCESS_PLUS)) {
    return res.status(403).json({ error: 'Forbidden - SUCCESS+ access required' });
  }

  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getTopics(req, res, supabase);
      case 'POST':
        return await createTopic(req, res, supabase, session.user.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Community topics API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getTopics(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    categoryId,
    status,
    search,
    limit = '50',
    offset = '0'
  } = req.query;

  let query = supabase
    .from('community_topics')
    .select(`
      *,
      author:authorId (
        id,
        name,
        avatar
      ),
      category:categoryId (
        id,
        name,
        slug,
        color
      ),
      community_posts(count)
    `)
    .order('isPinned', { ascending: false })
    .order('lastReplyAt', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data: topics, error } = await query;

  if (error) {
    console.error('Error fetching topics:', error);
    return res.status(500).json({ error: 'Failed to fetch topics' });
  }

  const formattedTopics = topics?.map((topic: any) => ({
    id: topic.id,
    categoryId: topic.categoryId,
    category: topic.category,
    author: topic.author,
    title: topic.title,
    slug: topic.slug,
    content: topic.content,
    status: topic.status,
    isPinned: topic.isPinned,
    isLocked: topic.isLocked,
    viewCount: topic.viewCount,
    replyCount: topic.community_posts?.[0]?.count || 0,
    lastReplyAt: topic.lastReplyAt,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
  })) || [];

  return res.status(200).json({
    success: true,
    topics: formattedTopics,
    total: formattedTopics.length,
  });
}

async function createTopic(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  const {
    categoryId,
    title,
    slug,
    content,
    isPinned = false,
    isLocked = false,
  } = req.body;

  if (!categoryId || !title || !slug || !content) {
    return res.status(400).json({ error: 'Category, title, slug, and content are required' });
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('community_topics')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'A topic with this slug already exists' });
  }

  // Verify category exists
  const { data: category } = await supabase
    .from('community_categories')
    .select('id')
    .eq('id', categoryId)
    .single();

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const topicId = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data: topic, error } = await supabase
    .from('community_topics')
    .insert({
      id: topicId,
      categoryId,
      authorId: userId,
      title,
      slug,
      content,
      status: 'OPEN',
      isPinned,
      isLocked,
      viewCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating topic:', error);
    return res.status(500).json({ error: 'Failed to create topic' });
  }

  return res.status(201).json({
    success: true,
    topic,
  });
}
