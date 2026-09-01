import { asc, eq } from 'drizzle-orm';
import { db } from '../config/db';
import { heroSlides } from '../db/schema';

export function findActiveOrdered() {
    return db.query.heroSlides.findMany({
        where: eq(heroSlides.active, true),
        orderBy: asc(heroSlides.orderIndex),
    });
}