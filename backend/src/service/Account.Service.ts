import { AppError } from "../errors/AppError";
import * as AccountRepository from '../repository/Account.Repository';
import type { UpdateProfileInput } from "../db/schema";

export async function getProfile(customerId: string) {
    const profile = await AccountRepository.findProfileById(customerId);
    if (!profile) throw new AppError('Cliente não encontrado', 404);
    return profile;
}

export async function updateProfile(customerId: string, input: UpdateProfileInput) {
    const profile = await AccountRepository.updateProfile(customerId, {
        name: input.name,
        phone: input.phone ?? null,
        cpf: input.cpf ? input.cpf.replace(/\D/g, '') : null,
        birthDate: input.birthDate ?? null,
    });

    if (!profile) throw new AppError('Cliente não encontrado', 404);
    return profile;
}