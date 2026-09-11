import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    }
});

// Eventos da vitrine: rota publica e anonima, entao precisa de teto. Folgado de
// proposito — uma visita navegando manda varios lotes por minuto, e barrar
// cliente de verdade seria pior que o abuso. Serve contra script, nao contra uso.
export const eventsLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    // Silencioso: a vitrine nao mostra nada disso pra cliente, e um erro
    // barulhento aqui viraria ruido no console dela sem motivo.
    message: { gravados: 0, recusados: 0 },
});