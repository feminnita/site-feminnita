import * as EmailClient from '../resend/Clients';
import type { OrderEmailData } from './types';

function formatBRL(value: string): string {
    return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export async function sendOrderReceived(data: OrderEmailData) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: `Recebemos seu pedido ${data.orderNumber}`,
            html: `<h2>Oi, ${escapeHtml(data.customerName)}!</h2>
        <p>Seu pedido <strong>${data.orderNumber}</strong> foi recebido e está aguardando o pagamento.</p>
        <p>Total: <strong>${formatBRL(data.total)}</strong></p>
        <p>Assim que o pagamento for confirmado, te avisamos por aqui.</p>
        <p>— Equipe Feminnita</p>
            `,
        })
    } catch (error) {
        console.error(`E-mail "pedido recebido" falhou (${data.orderNumber}): `, error)
    }
}

export async function sendPaymentConfirmed(data: OrderEmailData) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: `Pagamento confirmado - ${data.orderNumber}`,
            html: `<h2>Oba, ${escapeHtml(data.customerName)}! </h2> 
            <p> O pagamento do pedido <strong>${data.orderNumber} </strong> foi confirmado.</p>
                <p>Total: <strong>${formatBRL(data.total)} </strong></p >
                <p>Já estamos preparando tudo para o envio — você recebe o código de rastreio assim que despachar.</p>
                <p>— Equipe Feminnita </p>

            `,
        });
    } catch (error) {
        console.error(`E-mail "pagamento confirmado" falhou (${data.orderNumber}):`, error);
    }
}

export async function sendOrderShipped(data: OrderEmailData & { trackingCode?: string | null }) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: `Seu pedido ${data.orderNumber} está a caminho`,
            html: `
        <h2>Boa notícia, ${escapeHtml(data.customerName)}!</h2>
        <p>Seu pedido <strong>${data.orderNumber}</strong> foi despachado.</p>
        ${data.trackingCode ? `<p>Código de rastreio: <strong>${escapeHtml(data.trackingCode)}</strong></p>` : ''}
        <p>Acompanhe a entrega na sua conta no site da Feminnita.</p>
        <p>— Equipe Feminnita</p>
      `,
        });
    } catch (error) {
        console.error(`E-mail "pedido a caminho" falhou (${data.orderNumber}):`, error);
    }
}

export async function sendWelcome(data: { customerName: string; customerEmail: string }) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: 'Bem-vinda à Feminnita!',
            html: `
        <h2>Oi, ${escapeHtml(data.customerName)}!</h2>
        <p>Que bom ter você com a gente. Sua conta na <strong>Feminnita</strong> está criada e pronta para usar.</p>
        <p>Antes de começar, o que é bom saber:</p>
        <ul>
          <li><strong>Pedido mínimo de R$ 199</strong> — trabalhamos no atacado.</li>
          <li><strong>Pagamento</strong>: Pix ou cartão de crédito.</li>
          <li><strong>Atendimento no WhatsApp</strong>: (22) 99281-0707, de segunda a sexta, das 8h às 17h.</li>
        </ul>
        <p>Qualquer dúvida, é só chamar a gente no WhatsApp.</p>
        <p>— Equipe Feminnita</p>
      `,
        });
    } catch (error) {
        console.error(`E-mail de boas-vindas falhou (${data.customerEmail}):`, error);
    }
}

export async function sendPasswordReset(data: { customerName: string; customerEmail: string; resetUrl: string }) {
    try {
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: 'Redefinir sua senha — Feminnita',
            html: `
        <h2>Oi, ${escapeHtml(data.customerName)}!</h2>
        <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
        <p><a href="${data.resetUrl}">Clique aqui para criar uma nova senha</a> — o link vale por 30 minutos.</p>
        <p>Se não foi você, ignore este e-mail — sua senha continua a mesma.</p>
        <p>— Equipe Feminnita</p>
      `,
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
}) {
    try {
        const linhas = data.items
            .slice(0, 8)
            .map(
                (i) =>
                    `<li>${escapeHtml(i.name)} — ${escapeHtml(i.size)}${
                        i.color ? ` · ${escapeHtml(i.color)}` : ''
                    } · ${i.quantity} ${i.quantity === 1 ? 'peça' : 'peças'}</li>`,
            )
            .join('');
        const aMais = data.items.length > 8 ? `<li>e mais ${data.items.length - 8} item(ns)</li>` : '';

        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: 'Você deixou peças no carrinho',
            html: `
        <h2>Oi, ${escapeHtml(data.customerName)}!</h2>
        <p>Seu carrinho na <strong>Feminnita</strong> ainda está guardado:</p>
        <ul>${linhas}${aMais}</ul>
        <p>
          <a href="${data.cartUrl}" style="display:inline-block;background:#8C2F39;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">
            Voltar para o carrinho
          </a>
        </p>
        <p>Lembrando que o pedido mínimo é de R$ 199 e o envio é para todo o Brasil.</p>
        <p>Se precisar de ajuda para fechar, chama a gente no WhatsApp: (22) 99281-0707.</p>
        <p>— Equipe Feminnita</p>
      `,
        });
    } catch (error) {
        console.error(`E-mail de carrinho abandonado falhou (${data.customerEmail}):`, error);
    }
}
