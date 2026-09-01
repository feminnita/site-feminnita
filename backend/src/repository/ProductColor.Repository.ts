import { db } from '../config/db';

export function findAll() {
    return db.query.productsColors.findMany();
}

