import { db } from '../config/db';
import { storeEvents } from '../db/schema';

export type NovoEvento = {
    sessionId: string;
    type: string;
    path?: string | null;
    productId?: string | null;
    term?: string | null;
    resultCount?: number | null;
    referrer?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
};

// Grava em lote: a vitrine junta os eventos e manda de uma vez quando a aba
// sai de vista, entao quase sempre chegam varios juntos.
export async function registrar(eventos: NovoEvento[]) {
    if (!eventos.length) return 0;
    await db.insert(storeEvents).values(eventos);
    return eventos.length;
}
