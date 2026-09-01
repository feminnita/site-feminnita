import { NextFunction, Request, Response } from "express";
import { ZodType } from 'zod';
import { AppError } from "../errors/AppError";

export function validate(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(result.error.issues[0]?.message ?? 'Dados Inválidos', 400);
        }
        req.body = result.data;
        next();
    };
}