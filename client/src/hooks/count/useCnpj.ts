"use client";

import { useCallback, useState } from "react";

export type CnpjEmpresa = {
    razaoSocial: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    ativa: boolean;
};

/**
 * A Receita devolve tudo em caixa alta ("MARECHAL RONDON"). Isso acaba impresso
 * na etiqueta de envio e na nota, então vale arrumar aqui. As palavrinhas de
 * ligação ficam minúsculas — "Rua Marechal Rondon", não "Rua Marechal Rondon Da
 * Silva" — e o que tem 2 letras ou menos e não é ligação fica como está, porque
 * quase sempre é sigla (RJ, KM).
 */
const LIGACOES = new Set(["de", "da", "do", "das", "dos", "e"]);

function arrumarCaixa(texto: string): string {
    return texto
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((palavra, i) =>
            i > 0 && LIGACOES.has(palavra)
                ? palavra
                : palavra.charAt(0).toUpperCase() + palavra.slice(1),
        )
        .join(" ");
}

/**
 * Busca os dados públicos de um CNPJ na BrasilAPI (Receita Federal).
 *
 * Direto do navegador de propósito: a BrasilAPI limita por IP, e a loja inteira
 * saindo pelo mesmo IP do servidor bateria no limite numa quarta movimentada.
 * Cada cliente gastando o próprio IP nunca bate. A API responde com
 * `access-control-allow-origin: *`, então o navegador deixa.
 *
 * Nunca lança. Se a Receita estiver fora do ar, ou o CNPJ não existir, devolve
 * null e a pessoa preenche na mão como sempre fez — preencher sozinho é um
 * atalho, não pode virar um passo a mais para dar errado.
 */
export function useCnpj() {
    const [loading, setLoading] = useState(false);

    const lookup = useCallback(async (cnpj: string): Promise<CnpjEmpresa | null> => {
        const digits = cnpj.replace(/\D/g, "");
        if (digits.length !== 14) return null;

        setLoading(true);

        try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return null;

            const d = await res.json();

            const tipo = d.descricao_tipo_de_logradouro || "";
            const rua = [tipo, d.logradouro].filter(Boolean).join(" ");

            return {
                // Nome fantasia quando existe: é como a loja se chama de verdade.
                razaoSocial: arrumarCaixa(d.nome_fantasia || d.razao_social || ""),
                cep: String(d.cep || "").replace(/\D/g, ""),
                logradouro: arrumarCaixa(rua),
                numero: String(d.numero || ""),
                complemento: arrumarCaixa(String(d.complemento || "")),
                bairro: arrumarCaixa(String(d.bairro || "")),
                cidade: arrumarCaixa(String(d.municipio || "")),
                uf: String(d.uf || "").toUpperCase(),
                ativa: d.descricao_situacao_cadastral === "ATIVA",
            };
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { lookup, loading };
}
