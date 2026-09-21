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
    endereco: {
        logradouro: "Rua Marechal Rondon, 669 A",
        bairro: "Cônego",
        cidade: "Nova Friburgo",
        uf: "RJ",
        cep: "28621-130",
    },
    email: "feminnita@gmail.com",
    whatsapp: "(22) 99281-0707",
} as const;

/** Uma linha: "Rua X, 669 A — Cônego — Nova Friburgo/RJ — CEP 28621-130" */
export function enderecoEmLinha(): string {
    const e = EMPRESA.endereco;
    return `${e.logradouro} — ${e.bairro} — ${e.cidade}/${e.uf} — CEP ${e.cep}`;
}

/** "FNT CONFECÇÕES LTDA — CNPJ 62.893.101/0001-96" */
export function razaoSocialComCnpj(): string {
    return `${EMPRESA.razaoSocial} — CNPJ ${EMPRESA.cnpj}`;
}
