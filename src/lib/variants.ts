// Helpers de variação (tamanho/cor) compartilhados pela loja.
// Os dados reais vêm da tabela product_skus (Bling), com nomes de cor
// compostos (ex: "RosaNuvem", "PretoCoala") e tamanhos fora de ordem.

const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XGG", "XXG", "G1", "G2", "G3", "G4"];

// Ordena tamanhos na ordem natural de vestuário; numéricos depois das letras;
// desconhecidos ("ÚNICO", "M (4 ANOS)") por último em ordem alfabética.
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const A = a.toUpperCase().trim();
    const B = b.toUpperCase().trim();
    const ia = SIZE_ORDER.indexOf(A);
    const ib = SIZE_ORDER.indexOf(B);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    const na = parseFloat(A);
    const nb = parseFloat(B);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return 1;
    if (!isNaN(nb)) return -1;
    return A.localeCompare(B);
  });
}

// Mapeia a cor real (nome composto) para um hex de bolinha por palavra-chave.
const COLOR_KEYWORDS: [string, string][] = [
  ["preto", "#1A1A1A"], ["off", "#F5F0E6"], ["branco", "#FFFFFF"],
  ["cru", "#EFE7D6"], ["bege", "#E3D5C0"], ["nude", "#E8C9B5"],
  ["marinho", "#1F2A44"], ["jeans", "#5A7BA6"], ["azul", "#3B6BB5"],
  ["militar", "#5C6B47"], ["oliva", "#6B7A3A"], ["verde", "#4C9A6A"],
  ["pink", "#E45C9A"], ["rosa", "#E7A6B8"], ["coral", "#F08A7A"],
  ["vinho", "#7A2438"], ["bordo", "#6E1F2E"], ["vermelho", "#C73A3A"],
  ["lilas", "#C3A6DD"], ["lilás", "#C3A6DD"], ["roxo", "#7A4FA3"],
  ["amarelo", "#F2D04B"], ["laranja", "#E8853B"], ["dourado", "#C9A648"],
  ["chumbo", "#4A4E54"], ["cinza", "#9AA0A6"], ["mescla", "#A9AEB3"], ["prata", "#C7CCD1"],
  ["caramelo", "#B5793C"], ["terracota", "#C06A4A"], ["marrom", "#6B4A2E"],
  ["frozen", "#BCD9E6"], ["turquesa", "#3FB4B0"],
];

export function resolveColor(name: string): string {
  const n = (name || "").toLowerCase();
  for (const [kw, hex] of COLOR_KEYWORDS) if (n.includes(kw)) return hex;
  return "#CFC4BA"; // neutro elegante para nomes sem cor reconhecível (ex: "Sortido")
}
