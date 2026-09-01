import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2, 'Nome Muito Curto').max(100, 'Nome muito longo'),
    phone: z.string().trim().max(20, 'Telefone inválido').nullable().optional(),
    cpf: z.string().trim().max(14, 'CPF inválido').nullable().optional(),
    birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida')
        .nullable()
        .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;