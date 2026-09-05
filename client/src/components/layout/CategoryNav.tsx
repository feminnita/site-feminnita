"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CategoryNode } from "../../types/categories/categories";

const catHref = (slug: string) => `/categoria/${slug}`;

// ---------------------------------------------------------------------------
// Desktop: conteúdo do dropdown de PRODUTOS (aparece no hover, no Header).
// Colunas = categorias raiz (Feminino, Masculino, Infantil, Pantufas, Outlet).
// ---------------------------------------------------------------------------
export function CategoryDropdown({ tree }: { tree: CategoryNode[] }) {
    if (tree.length === 0) return null;

    // Raiz sem subcategoria (ex.: Pet) não ganha coluna inteira do mega-menu:
    // vira link simples numa faixa compacta abaixo das colunas com filhos.
    const columns = tree.filter((root) => root.children.length > 0);
    const compact = tree.filter((root) => root.children.length === 0);

    return (
        <div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-5">
                {columns.map((root) => (
                    <div key={root.id} className="min-w-[8rem]">
                        <Link
                            href={catHref(root.slug)}
                            className="mb-2 block text-sm font-semibold uppercase tracking-wide text-[#8C2F39]"
                        >
                            {root.name}
                        </Link>
                        <ul className="space-y-1.5">
                            {root.children.map((child) => (
                                <li key={child.id}>
                                    <Link
                                        href={catHref(child.slug)}
                                        className="text-sm text-gray-700 hover:text-[#8C2F39] hover:underline"
                                    >
                                        {child.name}
                                    </Link>
                                    {child.children.length > 0 && (
                                        <ul className="ml-2 mt-1 space-y-1 border-l border-gray-100 pl-2">
                                            {child.children.map((leaf) => (
                                                <li key={leaf.id}>
                                                    <Link
                                                        href={catHref(leaf.slug)}
                                                        className="text-xs text-gray-500 hover:text-[#8C2F39] hover:underline"
                                                    >
                                                        {leaf.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {compact.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4">
                    {compact.map((root) => (
                        <Link
                            key={root.id}
                            href={catHref(root.slug)}
                            className="text-sm font-semibold uppercase tracking-wide text-[#8C2F39] hover:underline"
                        >
                            {root.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Mobile: mesma árvore em accordion, dentro do menu hambúrguer.
// ---------------------------------------------------------------------------
function MobileBranch({
    node,
    depth,
    onNavigate,
}: {
    node: CategoryNode;
    depth: number;
    onNavigate: () => void;
}) {
    const [open, setOpen] = useState(false);
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div className="flex items-center justify-between">
                <Link
                    href={catHref(node.slug)}
                    onClick={onNavigate}
                    className="flex-1 py-2 text-sm text-gray-700 hover:text-[#8C2F39]"
                    style={{ paddingLeft: depth * 12 }}
                >
                    {node.name}
                </Link>
                {hasChildren && (
                    <button
                        type="button"
                        aria-label={open ? "Recolher" : "Expandir"}
                        onClick={() => setOpen((v) => !v)}
                        className="p-2 text-gray-400"
                    >
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${open ? "rotate-180" : ""}`}
                        />
                    </button>
                )}
            </div>
            {hasChildren && open && (
                <div className="border-l border-gray-100">
                    {node.children.map((child) => (
                        <MobileBranch
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function MobileCategoryAccordion({
    tree,
    onNavigate,
}: {
    tree: CategoryNode[];
    onNavigate: () => void;
}) {
    if (tree.length === 0) return null;

    return (
        <div className="space-y-0.5">
            {tree.map((root) => (
                <MobileBranch
                    key={root.id}
                    node={root}
                    depth={0}
                    onNavigate={onNavigate}
                />
            ))}
        </div>
    );
}
