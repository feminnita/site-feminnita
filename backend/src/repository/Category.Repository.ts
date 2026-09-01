import { and, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { categories } from '../db/schema';

export function findAllActive() {
    return db.query.categories.findMany({ where: eq(categories.active, true) });
}

export function findActiveBySlug(slug: string) {
    return db.query.categories.findFirst({ where: and(eq(categories.slug, slug), eq(categories.active, true)) });
}