import type { CategoryNode, CategoryRow } from "../types/categories/categories";

export function buildTree(rows: CategoryRow[]): CategoryNode[] {
    const ids = new Set(rows.map((r) => r.id));
    const byParent = new Map<string | null, CategoryRow[]>();

    rows.forEach((row) => {
        const key = row.parentId && ids.has(row.parentId) ? row.parentId : null;

        const siblings = byParent.get(key) ?? [];
        siblings.push(row);
        byParent.set(key, siblings);
    });

    function buildLevel(
        parentId: string | null,
        level: 1 | 2 | 3,
    ): CategoryNode[] {
        const children = (byParent.get(parentId) ?? [])
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex);

        return children.map((row) => ({
            ...row,
            level,
            children: level < 3 ? buildLevel(row.id, (level + 1) as 1 | 2 | 3) : [],
        }));
    }

    return buildLevel(null, 1);
}

// ---------------------------------------------------------------------------
// cleanCategoryTree — ajustes de EXIBIÇÃO da árvore de categorias no menu.
//
// A correção DEFINITIVA é recategorizar na fonte (Bling / cadastro): mover
// "Menina" para debaixo de Infantil e eliminar o galho de importados sem
// classificação. Enquanto isso não acontece, este helper mascara os problemas
// só na UI, sem tocar nos dados.
//
//   - esconde o nó "Bling > Importados > Aguardando classificação";
//   - move "Menina" (hoje sob Feminino) para dentro de Infantil;
//   - "Menino" já vive em Infantil e é mantido como está.
// ---------------------------------------------------------------------------
const HIDDEN_CATEGORY_NAMES = new Set(["aguardando classificação"]);

function normalizeCategoryName(name: string): string {
    return name.trim().toLowerCase();
}

export function cleanCategoryTree(tree: CategoryNode[]): CategoryNode[] {
    const clone = (node: CategoryNode): CategoryNode => ({
        ...node,
        children: node.children.map(clone),
    });
    let roots = tree.map(clone);

    // 1. Remove galhos escondidos (ex.: "Aguardando classificação") em qualquer nível.
    const prune = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes
            .filter((n) => !HIDDEN_CATEGORY_NAMES.has(normalizeCategoryName(n.name)))
            .map((n) => ({ ...n, children: prune(n.children) }));
    roots = prune(roots);

    // 2. Move "Menina" de Feminino para Infantil (correção só de exibição).
    const feminino = roots.find(
        (r) => normalizeCategoryName(r.name) === "feminino",
    );
    const infantil = roots.find(
        (r) => normalizeCategoryName(r.name) === "infantil",
    );
    if (feminino && infantil) {
        const idx = feminino.children.findIndex(
            (c) => normalizeCategoryName(c.name) === "menina",
        );
        if (idx !== -1) {
            const [menina] = feminino.children.splice(idx, 1);
            infantil.children.push(menina);
        }
    }

    return roots;
}

export function listFatherCandidates(rows: CategoryRow[]): CategoryRow[] {
    return rows.filter((r) => r.parentId === null);
}

export function listChildrenCandidates(
    rows: CategoryRow[],
    parentPaiId?: string,
): CategoryRow[] {
    const paiIds = new Set(listFatherCandidates(rows).map((r) => r.id));
    return rows.filter(
        (r) =>
            r.parentId !== null &&
            paiIds.has(r.parentId) &&
            (!parentPaiId || r.parentId === parentPaiId),
    );
}

export function listGrandchildCategories(rows: CategoryRow[]): CategoryRow[] {
    const filhosIds = new Set(listChildrenCandidates(rows).map((r) => r.id));
    return rows.filter((r) => r.parentId !== null && filhosIds.has(r.parentId));
}

export function collectDescendantGrandchildrenIds(
    rows: CategoryRow[],
    categoryId: string,
): string[] {
    const tree = buildTree(rows);

    function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
        for (const node of nodes) {
            if (node.id === id) return node;
            const found = findNode(node.children, id);
            if (found) return found;
        }

        return null;
    }

    function collectLeaves(node: CategoryNode): string[] {
        if (node.level === 3) return [node.id];
        return node.children.flatMap(collectLeaves);
    }

    const target = findNode(tree, categoryId);
    return target ? collectLeaves(target) : [];
}

export function findAncestor(
    rows: CategoryRow[],
    categoryId: string,
): { father?: CategoryRow; child?: CategoryRow } {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const current = byId.get(categoryId);
    if (!current || !current.parentId) return {};

    const child = byId.get(current.parentId);
    if (!child || !child.parentId) return { child };

    const father = byId.get(child.parentId);
    return { father, child };
}
