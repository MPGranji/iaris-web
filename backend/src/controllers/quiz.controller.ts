import type { Request, Response } from 'express';
import { recordAttempt } from '../services/quiz.service';
import { quizAttemptSchema } from '../validators/quiz.schema';

export async function createAttempt(req: Request, res: Response) {
  const { courseCode, answers } = quizAttemptSchema.parse(req.body);
  const result = await recordAttempt(courseCode, answers);
  res.status(result.stored ? 201 : 200).json(result);
}
