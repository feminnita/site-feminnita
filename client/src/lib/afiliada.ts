// Guarda por qual AFILIADA a visitante chegou: feminnita.com.br/?ref=MARIA10
//
// Fica separado de origemDaVisita de proposito, porque a REGRA e outra.
//
// Origem de anuncio usa "regra da primeira": quem trouxe a pessoa pela primeira
// vez leva o credito, e uma visita nova nao substitui. Faz sentido para
// campanha — mede quem descobriu a cliente.
//
// Para afiliada isso seria injusto. Se a mulher chegou por um anuncio em marco,
// nao comprou, e em setembro comprou porque a Maria postou o link dela, foi a
// Maria que fez a venda. Entao aqui vale o ULTIMO link clicado: quem estava com
// a cliente na hora da compra.
//
// Janela de 30 dias. Depois disso o credito cai — senao uma afiliada ganharia
// para sempre por um clique de um ano atras.
const CHAVE = "feminnita:afiliada";
const VALIDADE_DIAS = 30;

type Registro = { codigo: string; em: number };

// Codigo e digitado e falado ("erre é efe dez"). Normaliza para caixa alta e
// tira o que nao for letra ou numero, senao "maria10 " e "MARIA10" viram
// afiliadas diferentes.
function limpar(bruto: string): string {
    return bruto.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
}

/** Chamada uma vez quando a loja abre. */
export function registrarAfiliada() {
    if (typeof window === "undefined") return;

    const bruto = new URLSearchParams(window.location.search).get("ref");
    if (!bruto) return;

    const codigo = limpar(bruto);
    if (!codigo) return;

    try {
        localStorage.setItem(CHAVE, JSON.stringify({ codigo, em: Date.now() } satisfies Registro));
    } catch {
        /* janela anonima ou storage bloqueado: a compra acontece do mesmo jeito,
           so nao da para creditar a afiliada. Nunca quebrar a loja por isso. */
    }
}

/** Usada no checkout, para ir junto com o pedido. Vazio quando nao ha ou venceu. */
export function afiliadaDaVisita(): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const cru = localStorage.getItem(CHAVE);
        if (!cru) return undefined;
        const r = JSON.parse(cru) as Registro;
        if (!r?.codigo) return undefined;
        if (r.em && Date.now() - r.em > VALIDADE_DIAS * 864e5) return undefined;
        return r.codigo;
    } catch {
        return undefined;
    }
}
