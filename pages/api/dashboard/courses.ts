import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has SUCCESS+ subscription
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: { 
        member: {
          include: {
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = user.member?.subscriptions?.some(s => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      // Get all published courses with user's enrollment status
      const courses = await prisma.courses.findMany({
        where: { isPublished: true },
        include: {
          modules: {
            include: {
              lessons: true,
            },
            orderBy: { order: 'asc' },
          },
          enrollments: {
            where: { userId: user.id },
          },
        },
        orderBy: { order: 'asc' },
      });

      // Calculate total lessons and duration for each course
      const coursesWithStats = courses.map((course) => {
        const totalLessons = course.modules.reduce(
          (acc, module) => acc + module.lessons.length,
          0
        );
        const totalDuration = course.modules.reduce(
          (acc, module) =>
            acc +
            module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
          0
        );
        const enrollment = course.enrollments[0];

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
          totalModules: course.modules.length,
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
      const course = await prisma.courses.findUnique({
        where: { id: courseId },
      });

      if (!course || !course.isPublished) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.course_enrollments.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
      }

      // Create enrollment
      const enrollment = await prisma.course_enrollments.create({
        data: {
          userId: user.id,
          courseId,
          lastAccessedAt: new Date(),
        },
      });

      return res.status(201).json(enrollment);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
