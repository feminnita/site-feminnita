export function isValidateCpf(cpf: string): boolean {
    const digit = (cpf || "").replace(/\D/g, "");

    if (digit.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digit)) return false;

    const calc = (len: number) => {
        let sum = 0;
        for (let i = 0; i < len; i++) sum += Number(digit[i]) * (len + 1 - i);

        const mod = (sum * 10) % 11;
        return mod === 10 ? 0 : mod;
    };

    return calc(9) === Number(digit[9]) && calc(10) === Number(digit[10]);
}

export function parseCardExpiry(expiry: string): {
    month: string;
    year: string;
} {
    const [mm = "", yy = ""] = (expiry || "").replace(/\s/g, "").split("/");

    const month = mm.padStart(2, "0").slice(0, 2);
    const year = yy.length === 2 ? `20${yy}` : yy;

    return { month, year };
}