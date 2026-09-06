import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCourseBySlug, getModuleBySlug, getLessonBySlug } from '@/modules/courses/service';
import { markLessonComplete } from '@/modules/courses/progress.service';
import { completeLessonSchema } from '@/lib/validations/courses';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    const body = await req.json();
    const { moduleSlug, lessonSlug } = completeLessonSchema.parse(body);

    const course = getCourseBySlug(params.slug);
    if (!course) throw Errors.notFound('Course not found');
    const courseModule = getModuleBySlug(course, moduleSlug);
    if (!courseModule) throw Errors.notFound('Module not found');
    if (!getLessonBySlug(courseModule, lessonSlug)) throw Errors.notFound('Lesson not found');

    await markLessonComplete(session.user.id, { courseSlug: course.slug, moduleSlug, lessonSlug });
    return jsonOk({ completed: true });
  });
}
