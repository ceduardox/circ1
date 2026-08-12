import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  age: z.number().int().min(13).max(120).optional(),
  country: z.string().max(100).optional(),
  referralCode: z.string().min(3).max(30).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1), // email or username
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  age: z.number().int().min(13).max(120).optional(),
  country: z.string().max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
}).refine(data => !(data.newPassword && !data.currentPassword), {
  message: 'Se requiere contraseña actual para cambiarla',
  path: ['currentPassword'],
});

export const reflectionSchema = z.object({
  dayId: z.string().uuid(),
  reflectionType: z.enum(['DREAMS', 'FEARS', 'ENTHUSIASM', 'CUSTOM']),
  content: z.string().min(1),
});

export const completeContentSchema = z.object({
  answers: z.any().optional(),
});

export const pushPrefsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  pushChat: z.boolean().optional(),
  pushCommissions: z.boolean().optional(),
  pushPayments: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReflectionInput = z.infer<typeof reflectionSchema>;
export type CompleteContentInput = z.infer<typeof completeContentSchema>;