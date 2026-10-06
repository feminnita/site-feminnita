import * as EmailClient from '../resend/Clients';
import { emailLayout } from './layout';
import { env } from '../../config/env';
import type { OrderEmailData } from './types';
import * as SiteSettingsRepository from '../../repository/SiteSettings.Repository';

/**
 * Convite do Grupo VIP, para quem JA comprou.
 *
 * Ate 06/10/2026 o convite ficava no popup que abre 12s depois da cliente
 * chegar, com o titulo "As promocoes saem no grupo antes do site" — tirava do
 * site quem ainda estava escolhendo. Depois de pago, o convite nao custa venda
 * e traz a cliente de volta. O link e o mesmo do site_settings (grupo_vip):
 * venceu, troca la e vale aqui tambem. Se a leitura falhar, o e-mail sai sem o
 * bloco — nunca deixa de sair por causa dele.
 */
async function blocoGrupoVip(): Promise<string> {
    try {
        const row = await SiteSettingsRepository.findByKey('grupo_vip');
        const url = String((row?.value as { url?: string } | undefined)?.url ?? '');
        if (!/^https:\/\/chat\.whatsapp\.com\//.test(url)) return '';
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="margin:20px 0 0;background:#EEF9F2;border-radius:12px">
              <tr><td style="padding:16px 18px;font-size:14px;color:#18181b">
                <strong>Grupo VIP de revendedoras 💚</strong><br>
                <span style="color:#52525b">Novidades e promoções de atacado no nosso grupo do WhatsApp.</span><br>
                <a href="${escapeHtml(url)}" style="display:inline-block;margin-top:10px;color:#128C4A;font-weight:bold;text-decoration:none">Entrar no Grupo VIP →</a>
              </td></tr>
            </table>`;
    } catch (error) {
        console.error('Grupo VIP fora do e-mail (falha ao ler site_settings):', error);
        return '';
    }
}

function formatBRL(value: string): string {
    return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

// Aceita nulo de proposito. Em 27/09/2026 um item de carrinho sem `size`
// derrubou o e-mail inteiro com "Cannot read properties of undefined", e o job
// so marca como enviado quando o envio da certo — entao a cliente ficava presa
// na fila, selecionada de hora em hora, sem nunca receber nada. Campo faltando
// tem que virar texto vazio, nao excecao: o pior e-mail e o que nao sai.
function escapeHtml(value: string | null | undefined): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Destaque do número do pedido e do total. São os dois dados que a cliente
// procura quando abre o e-mail — soltos no meio do texto, ela tem que caçar.
function resumoDoPedido(numero: string, total: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="margin:20px 0;background:#FAF6F2;border-radius:12px">
              <tr>
                <td style="padding:16px 18px;font-size:14px;color:#71717a">Pedido</td>
                <td style="padding:16px 18px;font-size:14px;color:#18181b;font-weight:bold;text-align:right">${numero}</td>
              </tr>
              <tr>
                <td style="padding:0 18px 16px;font-size:14px;color:#71717a">Total</td>
                <td style="padding:0 18px 16px;font-size:16px;color:#8C2F39;font-weight:bold;text-align:right">${formatBRL(total)}</td>
              </tr>
            </table>`;
}

export async function sendOrderReceived(data: OrderEmailData) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: `🧾 Recebemos seu pedido ${data.orderNumber}`,
            html: emailLayout({
                preheader: `Pedido ${data.orderNumber} recebido — falta só o pagamento.`,
                titulo: 'Recebemos seu pedido',
                corpo: `
      <p style="margin:0 0 6px">Oi, ${escapeHtml(data.customerName)}! 💛</p>
      <p style="margin:0">Seu pedido chegou aqui e está esperando o pagamento.</p>
      ${resumoDoPedido(data.orderNumber, data.total)}
      <p style="margin:0;font-size:14px;color:#71717a">
        Assim que o pagamento cair, a gente te avisa por aqui. ✅
      </p>`,
                botao: { texto: 'Ver meu pedido', url: `${env.clientUrl}/minha-conta` },
            }),
        })
    } catch (error) {
        console.error(`E-mail "pedido recebido" falhou (${data.orderNumber}): `, error)
    }
}

export async function sendPaymentConfirmed(data: OrderEmailData) {
    try {
        const grupoVip = await blocoGrupoVip();
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: `✅ Pagamento confirmado — ${data.orderNumber}`,
            html: emailLayout({
                preheader: `Pagamento do pedido ${data.orderNumber} confirmado. Já estamos separando.`,
                titulo: 'Pagamento confirmado!',
                corpo: `
      <p style="margin:0 0 6px">Oba, ${escapeHtml(data.customerName)}! 🎉</p>
      <p style="margin:0">O pagamento caiu e já estamos separando suas peças.</p>
      ${resumoDoPedido(data.orderNumber, data.total)}
      <p style="margin:0;font-size:14px;color:#71717a">
        📦 Assim que despachar, você recebe o código de rastreio por aqui.
      </p>
      ${grupoVip}`,
                botao: { texto: 'Acompanhar pedido', url: `${env.clientUrl}/minha-conta` },
            }),
        });
    } catch (error) {
        console.error(`E-mail "pagamento confirmado" falhou (${data.orderNumber}):`, error);
    }
}

export async function sendOrderShipped(data: OrderEmailData & { trackingCode?: string | null }) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: `🚚 Seu pedido ${data.orderNumber} está a caminho`,
            html: emailLayout({
                preheader: data.trackingCode
                    ? `Pedido ${data.orderNumber} despachado. Rastreio: ${data.trackingCode}`
                    : `Pedido ${data.orderNumber} despachado.`,
                titulo: 'Seu pedido saiu para entrega',
                corpo: `
      <p style="margin:0 0 6px">Boa notícia, ${escapeHtml(data.customerName)}! 🚚</p>
      <p style="margin:0 0 4px">O pedido <strong>${data.orderNumber}</strong> já está a caminho.</p>
      ${data.trackingCode
                        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                  style="margin:20px 0;background:#FAF6F2;border-radius:12px">
                             <tr><td style="padding:16px 18px;text-align:center">
                               <div style="font-size:13px;color:#71717a;margin-bottom:6px">Código de rastreio</div>
                               <div style="font-size:18px;color:#18181b;font-weight:bold;letter-spacing:1px">${escapeHtml(data.trackingCode)}</div>
                             </td></tr>
                           </table>`
                        : '<p style="margin:16px 0 0;font-size:14px;color:#71717a">O código de rastreio aparece na sua conta assim que a transportadora liberar.</p>'
                    }`,
                botao: { texto: 'Acompanhar entrega', url: `${env.clientUrl}/minha-conta` },
            }),
        });
    } catch (error) {
        console.error(`E-mail "pedido a caminho" falhou (${data.orderNumber}):`, error);
    }
}

export async function sendWelcome(data: { customerName: string; customerEmail: string }) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: '💛 Bem-vinda à Feminnita!',
            html: emailLayout({
                preheader: 'Sua conta está pronta. Pedido mínimo de R$ 199, no atacado.',
                titulo: 'Que bom ter você com a gente',
                corpo: `
      <p style="margin:0 0 6px">Oi, ${escapeHtml(data.customerName)}! 💛</p>
      <p style="margin:0 0 18px">Sua conta na Feminnita está criada e pronta para usar.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#FAF6F2;border-radius:12px">
        <tr><td style="padding:18px">
          <p style="margin:0 0 12px;font-size:14px;color:#3f3f46">
            🛍️ <strong>Pedido mínimo de R$ 199</strong> — trabalhamos no atacado.
          </p>
          <p style="margin:0 0 12px;font-size:14px;color:#3f3f46">
            💳 <strong>Pagamento</strong> no Pix ou cartão de crédito.
          </p>
          <p style="margin:0;font-size:14px;color:#3f3f46">
            💬 <strong>Atendimento</strong> de segunda a sexta, das 8h às 17h.
          </p>
        </td></tr>
      </table>`,
                botao: { texto: 'Ver as peças', url: `${env.clientUrl}/produtos` },
                rodapeExtra: 'Qualquer dúvida, é só chamar. A gente responde rápido. 😊',
            }),
        });
    } catch (error) {
        console.error(`E-mail de boas-vindas falhou (${data.customerEmail}):`, error);
    }
}

export async function sendPasswordReset(data: { customerName: string; customerEmail: string; resetUrl: string }) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            // Sem emoji no assunto: e-mail de senha precisa parecer oficial, não
            // promocional. Emoji aqui atrapalha a confiança e ajuda a cair no spam.
            subject: 'Redefinir sua senha — Feminnita',
            html: emailLayout({
                preheader: 'Link para criar uma nova senha. Vale por 30 minutos.',
                titulo: 'Criar uma nova senha',
                corpo: `
      <p style="margin:0 0 6px">Oi, ${escapeHtml(data.customerName)}!</p>
      <p style="margin:0">
        Recebemos um pedido para redefinir a senha da sua conta.
        O botão abaixo vale por <strong>30 minutos</strong>.
      </p>`,
                botao: { texto: 'Criar nova senha', url: data.resetUrl },
                rodapeExtra: 'Se não foi você quem pediu, ignore este e-mail — sua senha continua a mesma.',
            }),
        });
    } catch (error) {
        console.error(`E-mail de reset falhou (${data.customerEmail}):`, error);
    }
}

// Lembrete de carrinho abandonado. Tom de recado, nao de cobranca: a pessoa nao
// deve nada, so parou no meio. Por isso nao ha contagem regressiva nem desconto
// de ultima hora — desconto para quem ja ia comprar so tira margem, e ensina a
// cliente a esperar o proximo e-mail em vez de fechar o pedido.
export async function sendAbandonedCart(data: {
    customerName: string;
    customerEmail: string;
    items: { name: string; size: string; color?: string; quantity: number }[];
    cartUrl: string;
}): Promise<boolean> {
    try {
        const pecas = data.items.reduce((t, i) => t + (i.quantity || 0), 0);

        const linhas = data.items
            .slice(0, 8)
            .map(
                (i) => `<tr>
                    <td style="padding:11px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#3f3f46">
                      <strong style="color:#18181b">${escapeHtml(i.name)}</strong><br>
                      <span style="font-size:13px;color:#71717a">${escapeHtml(i.size)}${i.color ? ' · ' + escapeHtml(i.color) : ''}</span>
                    </td>
                    <td style="padding:11px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#71717a;text-align:right;white-space:nowrap">
                      ${i.quantity}x
                    </td>
                  </tr>`,
            )
            .join('');

        const aMais =
            data.items.length > 8
                ? `<tr><td colspan="2" style="padding:11px 0;font-size:13px;color:#71717a">e mais ${data.items.length - 8} item(ns)…</td></tr>`
                : '';

        const corpo = `
      <p style="margin:0 0 6px">Oi, ${escapeHtml(data.customerName)}! 💛</p>
      <p style="margin:0 0 20px">
        Você escolheu ${pecas === 1 ? 'uma peça' : `${pecas} peças`} e parou no meio do caminho.
        Guardamos tudo para você — está aqui, do jeitinho que ficou:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px">
        ${linhas}${aMais}
      </table>

      <p style="margin:22px 0 0;font-size:14px;color:#71717a">
        🚚 Enviamos para todo o Brasil · pedido mínimo de R$ 199
      </p>`;

        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: '🛍️ Suas peças ainda estão no carrinho',
            html: emailLayout({
                preheader: `${pecas === 1 ? 'Uma peça guardada' : `${pecas} peças guardadas`} esperando você finalizar.`,
                titulo: 'Seu carrinho está te esperando',
                corpo,
                botao: { texto: 'Voltar para o carrinho', url: data.cartUrl },
                rodapeExtra: 'Já finalizou? Pode ignorar este e-mail. 😊',
            }),
        });
        return true;
    } catch (error) {
        console.error(`E-mail de carrinho abandonado falhou (${data.customerEmail}):`, error);
        return false;
    }
}
