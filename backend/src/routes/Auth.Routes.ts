import { Router } from 'express';
import * as AuthController from '../controller/Auth.Controller';
import { requireCustomerAuth } from '../middleware/ensureAuthenticated';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../db/schema/auth.schema';

export const storeAuthRoutes = Router();

storeAuthRoutes.post('/register', authLimiter, validate(registerSchema), AuthController.register);
storeAuthRoutes.post('/login', authLimiter, validate(loginSchema), AuthController.login);
storeAuthRoutes.post('/logout', AuthController.logout);
storeAuthRoutes.get('/me', requireCustomerAuth, AuthController.me);
storeAuthRoutes.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
storeAuthRoutes.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

storeAuthRoutes.get('/google', AuthController.googleRedirect);
storeAuthRoutes.get('/google/callback', AuthController.googleCallback);