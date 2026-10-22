import { z } from 'zod';
import { INTEREST_OPTIONS } from '../../../shared/types';

const interestCodes = INTEREST_OPTIONS.map((o) => o.code) as [string, ...string[]];
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadInputSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên').max(120),
  jobTitle: optionalText(120),
  organization: z.string().trim().min(1, 'Vui lòng nhập tên doanh nghiệp').max(200),
  sector: optionalText(200),
  email: z.string().trim().toLowerCase().email('Email chưa đúng định dạng, ví dụ: ten@congty.vn.').max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+().\s-]*$/, 'Số điện thoại không hợp lệ')
    .optional()
    .transform((v) => (v ? v : undefined)),
  interests: z.array(z.enum(interestCodes)).max(interestCodes.length).default([]),
  message: optionalText(2000),
  eventSlug: optionalText(120),
  website: z.string().max(0, 'spam').optional(), // honeypot
});

export type LeadInputParsed = z.infer<typeof leadInputSchema>;

export const leadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST', 'SPAM']).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const leadListQuerySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST', 'SPAM']).optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
