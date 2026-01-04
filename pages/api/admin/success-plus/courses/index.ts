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

  // Check department access
  if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.SUCCESS_PLUS)) {
    return res.status(403).json({ error: 'Forbidden - SUCCESS+ access required' });
  }

  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getCourses(req, res, supabase);
      case 'POST':
        return await createCourse(req, res, supabase, session.user.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Courses API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getCourses(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const { filter = 'all', search = '', limit = '50', offset = '0' } = req.query;

  let query = supabase
    .from('courses')
    .select(`
      *,
      course_modules(count),
      course_enrollments(count)
    `)
    .order('createdAt', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  // Apply filters
  if (filter === 'published') {
    query = query.eq('isPublished', true);
  } else if (filter === 'draft') {
    query = query.eq('isPublished', false);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: courses, error } = await query;

  if (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }

  // Format response with enrollment counts
  const formattedCourses = courses?.map((course: any) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnail: course.thumbnail,
    instructor: course.instructorName,
    instructorBio: course.instructorBio,
    instructorImage: course.instructorImage,
    duration: course.duration,
    level: course.level,
    isPremium: course.isPremium,
    isPublished: course.isPublished,
    order: course.order,
    modules: course.course_modules?.[0]?.count || 0,
    enrolledCount: course.course_enrollments?.[0]?.count || 0,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  })) || [];

  return res.status(200).json({
    success: true,
    courses: formattedCourses,
    total: formattedCourses.length,
  });
}

async function createCourse(req: NextApiRequest, res: NextApiResponse, supabase: any, userId: string) {
  const {
    title,
    slug,
    description,
    thumbnail,
    instructorName,
    instructorBio,
    instructorImage,
    duration,
    level = 'BEGINNER',
    isPremium = true,
    isPublished = false,
  } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'A course with this slug already exists' });
  }

  const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      id: courseId,
      title,
      slug,
      description,
      thumbnail,
      instructorName,
      instructorBio,
      instructorImage,
      duration,
      level,
      isPremium,
      isPublished,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ error: 'Failed to create course' });
  }

  return res.status(201).json({
    success: true,
    course,
  });
}
