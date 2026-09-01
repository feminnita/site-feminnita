import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().trim().min(2, 'Nome muito curto').max(100, 'Nome muito Longo'),
    email: z.email('E-mail invalido').trim().toLowerCase(),
    password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres').max(72, 'Senha muito longa'),
});

export const loginSchema = z.object({
    email: z.email('E-mail inválido').trim().toLowerCase(),
    password: z.string().min(1, 'Informe a senha'),
});

export const forgotPasswordSchema = z.object({
    email: z.email('E-mail inválido').trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(32, 'Token inválido'),
    password: z.string().min(8, 'A senha precisa de pelo menos 7 caracteres').max(72, 'Senha muito longa'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;