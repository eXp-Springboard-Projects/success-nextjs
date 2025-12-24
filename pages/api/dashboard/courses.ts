import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has SUCCESS+ subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        member:members!inner (
          id,
          subscriptions (
            status
          )
        )
      `)
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = (user as any).member?.subscriptions?.some((s: any) => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      // Get all published courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          modules:course_modules (
            id,
            order,
            lessons:course_lessons (
              id,
              duration
            )
          ),
          enrollments:course_enrollments!inner (
            progress,
            lastAccessedAt
          )
        `)
        .eq('isPublished', true)
        .eq('enrollments.userId', user.id)
        .order('order', { ascending: true });

      if (coursesError) {
        throw coursesError;
      }

      // Calculate total lessons and duration for each course
      const coursesWithStats = (courses || []).map((course: any) => {
        const totalLessons = course.modules?.reduce(
          (acc: number, module: any) => acc + (module.lessons?.length || 0),
          0
        ) || 0;
        const totalDuration = course.modules?.reduce(
          (acc: number, module: any) =>
            acc +
            (module.lessons?.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0) || 0),
          0
        ) || 0;
        const enrollment = course.enrollments?.[0];

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          instructorName: course.instructorName,
          instructorImage: course.instructorImage,
          duration: totalDuration,
          level: course.level,
          category: course.category,
          totalLessons,
          totalModules: course.modules?.length || 0,
          enrolled: !!enrollment,
          progress: enrollment?.progress || 0,
          lastAccessedAt: enrollment?.lastAccessedAt,
        };
      });

      return res.status(200).json(coursesWithStats);
    }

    if (req.method === 'POST') {
      // Enroll in a course
      const { courseId } = req.body;

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required' });
      }

      // Check if course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, isPublished')
        .eq('id', courseId)
        .single();

      if (courseError || !course || !course.isPublished) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('userId', user.id)
        .eq('courseId', courseId)
        .single();

      if (existingEnrollment) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
      }

      // Create enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          userId: user.id,
          courseId,
          lastAccessedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (enrollmentError) {
        throw enrollmentError;
      }

      return res.status(201).json(enrollment);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard courses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
