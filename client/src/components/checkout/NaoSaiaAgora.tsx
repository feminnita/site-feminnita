"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, X } from "lucide-react";

/**
 * A última oferta, para quem está indo embora do checkout.
 *
 * Medido em 23/09/2026: 40 pessoas montaram carrinho e 2 compraram. Quem chega
 * até aqui já escolheu peça, cor e tamanho — não precisa ser convencida do
 * produto. Precisa de um empurrão no último metro.
 *
 * Só para quem NUNCA comprou, e o servidor confere de novo pelo e-mail: sem
 * isso a revendedora aprende o macete e passa a fingir que vai sair toda vez,
 * e o desconto deixa de ser incentivo e vira tabela de preço. Foi a Chris que
 * viu isso antes de existir.
 *
 * Uma vez por visita. Insistir com quem já disse não é o caminho mais rápido
 * para ela fechar a aba de vez.
 */

type Props = {
    /** Só oferece se ainda não há desconto extra aplicado e o pedido é elegível. */
    podeOferecer: boolean;
    /** Aplica o cupom de 6% e fecha. */
    onAceitar: () => void;
};

export function NaoSaiaAgora({ podeOferecer, onAceitar }: Props) {
    const [aberto, setAberto] = useState(false);
    const jaApareceu = useRef(false);

    useEffect(() => {
        if (!podeOferecer || jaApareceu.current) return;

        /**
         * O gesto de quem vai embora, no computador: o ponteiro sobe além do
         * topo da janela, em direção à aba ou ao X. `relatedTarget` nulo
         * confirma que saiu da página, e não que passou por cima de um menu.
         */
        const aoSair = (e: MouseEvent) => {
            if (e.clientY > 0 || e.relatedTarget) return;
            jaApareceu.current = true;
            setAberto(true);
        };

        /**
         * No celular não existe "sair com o mouse". O equivalente é voltar:
         * ela toca em voltar e o navegador desfaz a navegação. Empurrar um
         * estado na história deixa o primeiro "voltar" cair aqui, uma vez.
         */
        const aoVoltar = () => {
            if (jaApareceu.current) return;
            jaApareceu.current = true;
            setAberto(true);
        };

        window.history.pushState({ checkout: true }, "");
        document.addEventListener("mouseout", aoSair);
        window.addEventListener("popstate", aoVoltar);

        return () => {
            document.removeEventListener("mouseout", aoSair);
            window.removeEventListener("popstate", aoVoltar);
        };
    }, [podeOferecer]);

    if (!aberto) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nao-saia"
        >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
                <button
                    type="button"
                    onClick={() => setAberto(false)}
                    aria-label="Fechar"
                    className="ml-auto block text-gray-300 hover:text-gray-500"
                >
                    <X size={20} />
                </button>

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8C2F39]/10">
                    <Gift size={26} className="text-[#8C2F39]" />
                </div>

                <h2 id="titulo-nao-saia" className="mb-3 text-2xl font-semibold text-gray-900">
                    Não saia agora!
                </h2>

                <p className="mb-2 text-gray-600">
                    Estamos disponibilizando o seu cupom de primeira compra —
                    e, para você finalizar agora, acaba de ganhar{" "}
                    <strong className="text-[#8C2F39]">mais 3%</strong>.
                </p>

                <p className="mb-6 text-sm text-gray-500">
                    São <strong>6% de desconto</strong> no total, só nesta compra.
                </p>

                <button
                    type="button"
                    onClick={() => {
                        onAceitar();
                        setAberto(false);
                    }}
                    className="w-full rounded-xl bg-[#8C2F39] py-4 font-semibold text-white transition-colors hover:bg-[#7a2832]"
                >
                    Concluir a compra
                </button>

                <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="mt-3 text-sm text-gray-400 underline hover:text-gray-600"
                >
                    Não, obrigada
                </button>
            </div>
        </div>
    );
}
