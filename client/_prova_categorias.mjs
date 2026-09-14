/**
 * Prova a regra de categoria contra a arvore REAL da loja.
 *
 * Duas perguntas, e a segunda importa tanto quanto a primeira:
 *   1. as categorias que mostravam ZERO passam a mostrar produto?
 *   2. as que ja funcionavam continuam com o MESMO resultado ou mais — nunca
 *      com produto que nao e delas?
 *
 * Uso: node _prova_categorias.mjs
 */
const API = 'https://site-feminnita-9rsm.onrender.com';

const cats = await (await fetch(`${API}/api/store/categories`)).json();
const prods = await (await fetch(`${API}/api/store/products?limit=1000`)).json();

const filhos = (id) => cats.filter((c) => (c.parentId ?? c.parent_id) === id);

// REGRA ANTIGA: so os nos de nivel 3
function antiga(id) {
    const nivel = (c) => {
        let n = 1, p = c.parentId ?? c.parent_id;
        while (p) { n++; p = (cats.find((x) => x.id === p) || {}).parentId ?? (cats.find((x) => x.id === p) || {}).parent_id; }
        return n;
    };
    const dentro = (c) => {
        const r = [];
        if (nivel(c) === 3) r.push(c.id);
        for (const f of filhos(c.id)) r.push(...dentro(f));
        return r;
    };
    const c = cats.find((x) => x.id === id);
    return c ? dentro(c) : [];
}

// REGRA NOVA: ela mesma e tudo abaixo
function nova(id) {
    const dentro = (c) => [c.id, ...filhos(c.id).flatMap(dentro)];
    const c = cats.find((x) => x.id === id);
    return c ? dentro(c) : [];
}

const conta = (ids) => {
    const s = new Set(ids);
    return prods.filter((p) => p.category_id && s.has(p.category_id)).length;
};

let consertadas = 0;
let iguais = 0;
let piorou = 0;

console.log('categoria'.padEnd(26), 'antes'.padStart(6), 'depois'.padStart(7));
for (const c of cats) {
    const a = conta(antiga(c.id));
    const d = conta(nova(c.id));
    if (a === 0 && d > 0) {
        consertadas++;
        console.log(`  ${String(c.slug).padEnd(24)} ${String(a).padStart(6)} ${String(d).padStart(7)}  <- estava zerada`);
    } else if (d < a) {
        piorou++;
        console.log(`  ${String(c.slug).padEnd(24)} ${String(a).padStart(6)} ${String(d).padStart(7)}  <- PIOROU`);
    } else {
        iguais++;
    }
}

console.log(`\nconsertadas: ${consertadas} | iguais ou com mais: ${iguais} | PIOROU: ${piorou}`);
console.log(`VEREDITO: ${piorou === 0 && consertadas > 0 ? 'OK' : 'CONFERIR'}`);
process.exitCode = piorou === 0 ? 0 : 1;
