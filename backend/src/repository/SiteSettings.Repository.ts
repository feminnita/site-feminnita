import { eq } from 'drizzle-orm';
import { db } from '../config/db';
import { siteSettings } from '../db/schema';

export function findAll() {
    return db.query.siteSettings.findMany();
}

export function findByKey(key: string) {
    return db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, key),
    });
}