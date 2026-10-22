import { z } from 'zod';

export const quizAttemptSchema = z.object({
  courseCode: z.string().trim().min(1).max(20),
  answers: z.array(z.number().int().min(0).max(10)).min(1).max(50),
});
