// Moldura visual dos e-mails da Feminnita.
//
// Os e-mails eram texto cru — chegavam com cara de aviso de sistema, não de
// marca. Aqui eles ganham a mesma identidade da loja.
//
// Tudo em TABELA e com estilo inline, e não em CSS moderno, porque cliente de
// e-mail (Gmail, Outlook, Apple Mail) ignora folha de estilo, flexbox e grid.
// O que parece antiquado aqui é o que faz o e-mail chegar igual em todos.

const BORGONHA = '#8C2F39';
const CREME = '#FAF6F2';
const TEXTO = '#3f3f46';
const CINZA = '#71717a';

export const WHATSAPP = '(22) 99281-0707';

export function emailLayout(input: {
    preheader: string;
    titulo: string;
    corpo: string;
    botao?: { texto: string; url: string };
    rodapeExtra?: string;
}): string {
    const botao = input.botao
        ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0">
             <tr><td style="border-radius:12px;background:${BORGONHA}">
               <a href="${input.botao.url}"
                  style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px">
                 ${input.botao.texto}
               </a>
             </td></tr>
           </table>`
        : '';

    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${CREME};font-family:Arial,Helvetica,sans-serif">

  <!-- Primeira linha que aparece na caixa de entrada, ao lado do assunto.
       Escondida no corpo: sem ela, o cliente de e-mail mostra o comeco do HTML. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${input.preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREME};padding:28px 12px">
    <tr><td align="center">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">

        <tr><td align="center" style="background:${BORGONHA};padding:26px 24px">
          <div style="font-size:24px;letter-spacing:5px;color:#ffffff;font-weight:bold">FEMINNITA</div>
          <div style="font-size:11px;letter-spacing:2px;color:#f3d7da;margin-top:6px">PIJAMAS NO ATACADO</div>
        </td></tr>

        <tr><td style="padding:34px 30px 30px">
          <h1 style="margin:0 0 18px;font-size:21px;line-height:1.35;color:#18181b;font-weight:bold">
            ${input.titulo}
          </h1>
          <div style="font-size:15px;line-height:1.65;color:${TEXTO}">
            ${input.corpo}
          </div>
          ${botao}
        </td></tr>

        <tr><td style="background:${CREME};padding:22px 30px;text-align:center">
          ${input.rodapeExtra ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${CINZA}">${input.rodapeExtra}</p>` : ''}
          <p style="margin:0;font-size:13px;line-height:1.6;color:${CINZA}">
            Precisa de ajuda? Chama no WhatsApp<br>
            <a href="https://wa.me/5522992810707" style="color:${BORGONHA};font-weight:bold;text-decoration:none">${WHATSAPP}</a>
          </p>
        </td></tr>

      </table>

      <p style="margin:18px 0 0;font-size:11px;color:#a1a1aa">
        Feminnita · Pijamas e moda íntima no atacado · Nova Friburgo, RJ
      </p>

    </td></tr>
  </table>
</body></html>`;
}
