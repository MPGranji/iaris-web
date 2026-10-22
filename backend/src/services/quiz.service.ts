import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { staticContent, ELEARNING_COURSE_CODE } from '../../../shared/content';
import type { QuizAttemptResult } from '../../../shared/types';

/** Scores the answers server-side and records the attempt. */
export async function recordAttempt(courseCode: string, answers: number[]): Promise<QuizAttemptResult> {
  if (!prisma) {
    if (courseCode !== ELEARNING_COURSE_CODE) throw new HttpError(404, 'Course not found');
    const score = staticContent.quiz.filter((q, i) => answers[i] === q.correctIndex).length;
    return { score, total: staticContent.quiz.length, stored: false };
  }

  const course = await prisma.course.findUnique({
    where: { code: courseCode },
    include: { questions: { orderBy: { position: 'asc' }, select: { correctIndex: true } } },
  });
  if (!course || course.questions.length === 0) throw new HttpError(404, 'Course not found');
  if (answers.length !== course.questions.length) throw new HttpError(400, 'Answer count does not match the quiz');

  const score = course.questions.filter((q, i) => answers[i] === q.correctIndex).length;
  await prisma.quizAttempt.create({
    data: { courseId: course.id, answers, score, total: course.questions.length },
  });
  return { score, total: course.questions.length, stored: true };
}
