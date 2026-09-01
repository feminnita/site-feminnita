import * as EmailClient from '../resend/Clients';
import type { OrderEmailData, AbandonedCartEmailData } from './types';

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

// rodapé com link de descadastro — usar em TODO e-mail de marketing
function unsubFooter(unsubscribeUrl: string): string {
    return `<hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:12px;color:#888">
            Você recebe este e-mail porque tem cadastro na Feminnita.
            <a href="${unsubscribeUrl}">Descadastrar</a>.
        </p>`;
}

export async function sendAbandonedCart(data: AbandonedCartEmailData) {
    try {
        const itens = data.items
            .map((i) => `<li>${escapeHtml(i.name)}${i.quantity > 1 ? ` (${i.quantity})` : ''}</li>`)
            .join('');
        await EmailClient.sendEmail({
            to: data.customerEmail,
            subject: 'Você esqueceu algumas peças no carrinho 🛒',
            html: `<h2>Oi, ${escapeHtml(data.customerName)}!</h2>
        <p>Vimos que você deixou estas peças no carrinho:</p>
        <ul>${itens}</ul>
        <p><a href="${data.cartUrl}">Voltar ao carrinho</a> — a gente guardou tudo pra você.</p>
        <p>— Equipe Feminnita</p>
        ${unsubFooter(data.unsubscribeUrl)}`,
        });
    } catch (error) {
        console.error(`E-mail "carrinho abandonado" falhou (${data.customerEmail}):`, error);
    }
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
