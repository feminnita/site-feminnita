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
        <p>A cobrança no seu cartão/extrato aparece como FNT.</p>
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
                <p>A cobrança no seu cartão/extrato aparece como FNT.</p>
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

export async function sendContactMessage(data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}) {
    await EmailClient.sendEmail({
        to: 'fntlingerie@gmail.com',
        replyTo: data.email,
        subject: `Contato pelo site — ${data.subject}`,
        html: `
        <h2>Nova mensagem pelo formulário de contato</h2>
        <p><strong>Nome:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(data.subject)}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
      `,
    });
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
