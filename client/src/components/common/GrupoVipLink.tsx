"use client";

import { useEffect, useState } from "react";
import { fetchSettings } from "../../services/settingsService";

// Link discreto do Grupo VIP no rodape: quem procura acha, mas ele nao salta na
// tela de quem esta escolhendo. O convite em destaque fica depois do pagamento
// (pedido confirmado e e-mail). Mesmo link do site_settings (grupo_vip); vazio
// ou fora do chat.whatsapp.com, o item nao aparece.
export function GrupoVipLink() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        const u = String((s?.grupo_vip as { url?: string } | undefined)?.url ?? "");
        if (/^https:\/\/chat\.whatsapp\.com\//.test(u)) setUrl(u);
      })
      .catch(() => {});
  }, []);

  if (!url) return null;

  return (
    <li>
      <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
        Grupo VIP de revendedoras
      </a>
    </li>
  );
}
