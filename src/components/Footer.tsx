import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-10">
      <div className="max-w-[1200px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1 — Brand */}
        <div>
          <div
            className="text-2xl font-light tracking-[0.2em] uppercase mb-4"
            style={{ color: "#8C2F39", fontFamily: "serif" }}
          >
            feminnita
          </div>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
            Moda íntima e pijamas com elegância, qualidade e conforto para o seu dia a dia.
          </p>
          <div className="flex gap-3">
            <a href="https://instagram.com/feminnita" target="_blank" rel="noopener" aria-label="Instagram"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#8C2F39] hover:border-[#8C2F39] transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://facebook.com/feminnita" target="_blank" rel="noopener" aria-label="Facebook"
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#8C2F39] hover:border-[#8C2F39] transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Col 2 — Categories */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-800 mb-4">Categorias</h4>
          <ul className="space-y-2">
            {[
              { label: "Pijamas", href: "/colecao/pijamas" },
              { label: "Camisolas", href: "/colecao/camisolas" },
              { label: "Shorts Doll", href: "/colecao/shorts-doll" },
              { label: "Conjuntos", href: "/colecao/conjuntos" },
              { label: "Lançamentos", href: "/colecao/lancamentos" },
              { label: "Outlet", href: "/colecao/outlet" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[13px] text-gray-500 hover:text-[#8C2F39] transition-colors"
                  style={item.href.includes("outlet") ? { color: "#8C2F39", fontWeight: 600 } : {}}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Info */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-800 mb-4">Informações</h4>
          <ul className="space-y-2">
            {[
              { label: "Sobre Nós", href: "/sobre" },
              { label: "Política de Troca", href: "/trocas" },
              { label: "Política de Privacidade", href: "/privacidade" },
              { label: "Termos de Uso", href: "/termos" },
              { label: "Como Comprar", href: "/como-comprar" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-[13px] text-gray-500 hover:text-[#8C2F39] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Contact */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-800 mb-4">Atendimento</h4>
          <div className="space-y-3 text-[13px] text-gray-500">
            <p>Segunda a Sexta, 9h às 18h</p>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 hover:text-[#8C2F39] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a href="mailto:contato@feminnita.com.br" className="hover:text-[#8C2F39] transition-colors">
              contato@feminnita.com.br
            </a>
          </div>

          {/* Payment icons */}
          <div className="mt-6">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Pagamento</p>
            <div className="flex gap-2 flex-wrap">
              {["Visa", "Master", "Pix", "Boleto"].map((p) => (
                <span
                  key={p}
                  className="text-[10px] border border-gray-200 px-2 py-1 text-gray-400"
                  style={{ borderRadius: 3 }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4">
        <p className="text-center text-[11px] text-gray-400">
          © {new Date().getFullYear()} Feminnita. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
