import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  college: z.string().optional(),
  branch: z.string().optional(),
  year: z.coerce.number().int().min(1).max(5).optional(),
  skills: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
