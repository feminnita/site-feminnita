"use client";

import { useCallback, useState } from "react";

export type CepAddress = {
    cep: string;
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
    uf: string;
};

export function useCep() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const lookup = useCallback(
        async (cep: string): Promise<CepAddress | null> => {
            const digits = cep.replace(/\D/g, "");
            if (digits.length !== 8) return null;

            setLoading(true);
            setError("");

            try {
                const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
                const data = await res.json();

                if (data.erro) {
                    setError("CEP não encontrado");
                    return null;
                }

                return {
                    cep: data.cep,
                    logradouro: data.logradouro,
                    bairro: data.bairro,
                    cidade: data.localidade,
                    estado: data.estado || data.uf,
                    uf: data.uf,
                };
            } catch {
                setError("Erro ao buscar CEP");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return { lookup, loading, error };
}
