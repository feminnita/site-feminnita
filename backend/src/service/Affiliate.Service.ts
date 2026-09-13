import * as AffiliateRepository from '../repository/Affiliate.Repository';

// A rota e PUBLICA: qualquer pessoa na internet manda o que quiser. Tudo que
// entra e tratado como texto de estranho — cortado no tamanho e conferido.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function texto(v: unknown, max: number): string {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function inscrever(corpo: any) {
    const nome = texto(corpo?.nome, 120);
    const email = texto(corpo?.email, 160).toLowerCase();
    const telefone = texto(corpo?.telefone, 30) || null;

    // "@maria", "maria" e "instagram.com/maria" viram a mesma coisa: e assim
    // que as pessoas escrevem, e todas as tres estao certas do ponto de vista delas.
    const instagram =
        texto(corpo?.instagram, 80)
            .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
            .replace(/^@/, '')
            .replace(/\/.*$/, '') || null;

    if (nome.length < 2) throw new Error('NOME_INVALIDO');
    if (!EMAIL.test(email)) throw new Error('EMAIL_INVALIDO');

    const criada = await AffiliateRepository.inscrever({ nome, email, telefone, instagram });

    // Devolve o codigo so para ela ver como vai ficar. Ele NAO credita nada
    // enquanto a Chris nao aprovar — e a tela diz isso com todas as letras,
    // para ninguem sair divulgando um link que ainda nao paga.
    return { codigo: criada.codigo };
}
