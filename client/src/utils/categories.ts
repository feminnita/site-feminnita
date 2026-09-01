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
