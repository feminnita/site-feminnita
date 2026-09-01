// import { Pool } from "pg";
// import { drizzle } from "drizzle-orm/node-postgres";
// import * as schema from "../db/schema";

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: {
//         rejectUnauthorized: false,
//     }
// });

// export const db = drizzle(pool, { schema });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";
import { env } from "./env";

const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: {
        rejectUnauthorized: false,
    }
});

export const db = drizzle(pool, { schema });
