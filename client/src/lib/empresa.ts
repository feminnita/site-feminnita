/**
 * Quem e a empresa, por lei.
 *
 * O Decreto 7.962/2013 (a lei do e-commerce) exige que a loja informe em
 * local de destaque a razao social, o CNPJ, o endereco fisico e o endereco
 * eletronico. Nao e enfeite de rodape: e o que permite a cliente localizar
 * e cobrar a empresa quando algo da errado, e e fiscalizavel pelo Procon.
 *
 * A loja subiu sem nada disso — e a Politica de Privacidade estava no ar com
 * o texto "[RAZAO SOCIAL / CNPJ — preencher]" a mostra.
 *
 * Fonte unica de proposito: estes dados aparecem no rodape e na Politica de
 * Privacidade. Escritos a mao em dois lugares, um dia divergem — foi assim
 * que o sitemap passou a apontar para um endereco e o canonical para outro.
 */
export const EMPRESA = {
    razaoSocial: "FNT CONFECÇÕES LTDA",
    cnpj: "62.893.101/0001-96",
    // A empresa mudou para a Av. Hamburgo em 2026. O endereco da Mal. Rondon
    // ficou aqui depois da mudanca, mostrando o lugar antigo no rodape.
    endereco: {
        logradouro: "Avenida Hamburgo, 323",
        bairro: "Mury",
        cidade: "Nova Friburgo",
        uf: "RJ",
        cep: "28615-230",
    },
    email: "feminnita@gmail.com",
    whatsapp: "(22) 99281-0707",
} as const;

/** Uma linha: "Avenida Hamburgo, 323 — Mury — Nova Friburgo/RJ — CEP 28615-230" */
export function enderecoEmLinha(): string {
    const e = EMPRESA.endereco;
    return `${e.logradouro} — ${e.bairro} — ${e.cidade}/${e.uf} — CEP ${e.cep}`;
}

/** "FNT CONFECÇÕES LTDA — CNPJ 62.893.101/0001-96" */
export function razaoSocialComCnpj(): string {
    return `${EMPRESA.razaoSocial} — CNPJ ${EMPRESA.cnpj}`;
}
