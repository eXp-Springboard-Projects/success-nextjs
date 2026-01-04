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

  const { id } = req.query;
  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getCourse(id as string, res, supabase);
      case 'PUT':
        return await updateCourse(id as string, req, res, supabase);
      case 'DELETE':
        return await deleteCourse(id as string, res, supabase);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Course API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getCourse(id: string, res: NextApiResponse, supabase: any) {
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_modules (
        *,
        course_lessons (*)
      ),
      course_enrollments (count)
    `)
    .eq('id', id)
    .single();

  if (error || !course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.status(200).json({
    success: true,
    course: {
      ...course,
      modules: course.course_modules || [],
      enrolledCount: course.course_enrollments?.[0]?.count || 0,
    },
  });
}

async function updateCourse(id: string, req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
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
    order,
  } = req.body;

  // Check if slug is being changed and already exists
  if (slug) {
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'A course with this slug already exists' });
    }
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (description !== undefined) updateData.description = description;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
  if (instructorName !== undefined) updateData.instructorName = instructorName;
  if (instructorBio !== undefined) updateData.instructorBio = instructorBio;
  if (instructorImage !== undefined) updateData.instructorImage = instructorImage;
  if (duration !== undefined) updateData.duration = duration;
  if (level !== undefined) updateData.level = level;
  if (isPremium !== undefined) updateData.isPremium = isPremium;
  if (isPublished !== undefined) updateData.isPublished = isPublished;
  if (order !== undefined) updateData.order = order;

  const { data: course, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ error: 'Failed to update course' });
  }

  return res.status(200).json({
    success: true,
    course,
  });
}

async function deleteCourse(id: string, res: NextApiResponse, supabase: any) {
  // Check if course has enrollments
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('courseId', id);

  if (enrollments && enrollments.length > 0) {
    return res.status(400).json({
      error: 'Cannot delete course with active enrollments',
      enrollmentCount: enrollments.length,
    });
  }

  // Delete course modules and lessons first (cascade)
  const { data: modules } = await supabase
    .from('course_modules')
    .select('id')
    .eq('courseId', id);

  if (modules) {
    for (const module of modules) {
      await supabase
        .from('course_lessons')
        .delete()
        .eq('moduleId', module.id);
    }

    await supabase
      .from('course_modules')
      .delete()
      .eq('courseId', id);
  }

  // Delete the course
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ error: 'Failed to delete course' });
  }

  return res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
}
