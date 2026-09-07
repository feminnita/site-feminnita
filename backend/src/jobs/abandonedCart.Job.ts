import * as AbandonedCartRepository from '../repository/AbandonedCart.Repository';
import * as EmailService from '../integrations/resend/Services';
import { env } from '../config/env';

// Lembrete automatico de carrinho abandonado.
//
// A tela de Carrinhos Abandonados ja existia no painel, mas ninguem era avisado:
// dava para VER quem parou no meio e nada acontecia. Este job fecha isso.
//
// 4 horas: cedo o bastante para a pessoa ainda lembrar do que colocou no
// carrinho, tarde o bastante para nao cutucar quem ainda esta escolhendo.
const HORAS_PARA_CONSIDERAR_ABANDONADO = 4;

// De hora em hora, e no maximo 40 por rodada. O limite existe para nao disparar
// centenas de e-mails de uma vez no primeiro dia — volume repentino de um
// dominio novo e o caminho mais rapido para cair no spam.
const RODAR_A_CADA_MS = 60 * 60 * 1000;
const MAXIMO_POR_RODADA = 40;

// Espera entre um envio e outro, pelo mesmo motivo.
const INTERVALO_ENTRE_ENVIOS_MS = 2000;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function enviarLembretesDeCarrinho(): Promise<number> {
    const abandonados = await AbandonedCartRepository.encontrarAbandonados(
        HORAS_PARA_CONSIDERAR_ABANDONADO,
        MAXIMO_POR_RODADA,
    );

    let enviados = 0;
    for (const carrinho of abandonados) {
        await EmailService.sendAbandonedCart({
            customerName: (carrinho.name || '').split(' ')[0] || 'tudo bem',
            customerEmail: carrinho.email,
            items: Array.isArray(carrinho.items) ? carrinho.items : [],
            cartUrl: `${env.clientUrl}/carrinho`,
        });

        // Marca DEPOIS de mandar. Se o envio falhar, o e-mail nao e dado como
        // enviado e a proxima rodada tenta de novo.
        await AbandonedCartRepository.marcarEnviado(carrinho.customerId);
        enviados++;
        await esperar(INTERVALO_ENTRE_ENVIOS_MS);
    }

    if (enviados) console.log(`Carrinho abandonado: ${enviados} lembrete(s) enviado(s).`);
    return enviados;
}

// Uma primeira rodada logo depois que o servidor sobe, e so entao de hora em
// hora. Sem isso o job so rodaria 60 minutos apos cada reinicio — e como a loja
// e publicada varias vezes por dia, ele poderia nunca chegar a rodar. Os 2
// minutos de espera sao para o servidor terminar de subir antes.
const ESPERA_DA_PRIMEIRA_RODADA_MS = 2 * 60 * 1000;

export function startAbandonedCartJob() {
    const rodar = async () => {
        try {
            await enviarLembretesDeCarrinho();
        } catch (error) {
            console.error('Erro no job de carrinho abandonado:', error);
        }
    };

    setTimeout(rodar, ESPERA_DA_PRIMEIRA_RODADA_MS);
    setInterval(rodar, RODAR_A_CADA_MS);
}
