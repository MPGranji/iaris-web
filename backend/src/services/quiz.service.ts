import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { staticContent, ELEARNING_COURSE_CODE } from "../../../shared/content";
import type { QuizAttemptResult } from "../../../shared/types";
import { getSiteContent } from "./content.service";

/** Scores the answers server-side and records the attempt. */
export async function recordAttempt(
  courseCode: string,
  answers: number[],
): Promise<QuizAttemptResult> {
  if (!prisma) {
    if (courseCode !== ELEARNING_COURSE_CODE)
      throw new HttpError(404, "Chưa có bộ câu hỏi cho khóa học này.");
    const score = staticContent.quiz.filter(
      (q, i) => answers[i] === q.correctIndex,
    ).length;
    return { score, total: staticContent.quiz.length, stored: false };
  }

  const course = await prisma.course.findUnique({
    where: { code: courseCode },
  });
  const questions = (await getSiteContent()).quiz;
  if (!course || courseCode !== ELEARNING_COURSE_CODE || questions.length === 0)
    throw new HttpError(404, "Chưa có bộ câu hỏi cho khóa học này.");
  if (
    answers.length !== questions.length ||
    answers.some(
      (answer, i) => answer < 0 || answer >= questions[i].options.length,
    )
  )
    throw new HttpError(
      400,
      "Bộ câu hỏi đã thay đổi hoặc đáp án không hợp lệ. Tải lại trang để làm lại.",
    );

  const score = questions.filter(
    (q, i) => answers[i] === q.correctIndex,
  ).length;
  await prisma.quizAttempt.create({
    data: {
      courseId: course.id,
      answers,
      score,
      total: questions.length,
      questions: JSON.parse(JSON.stringify(questions)),
    },
  });
  return { score, total: questions.length, stored: true };
}
