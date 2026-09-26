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

export function isValidateCnpj(cnpj: string): boolean {
    const digit = (cnpj || "").replace(/\D/g, "");

    if (digit.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digit)) return false;

    // Mesmo dígito verificador do CPF, com outro peso: começa em 5 (ou 6, para o
    // segundo dígito) e volta para 9 quando chega em 2.
    const calc = (len: number) => {
        let peso = len - 7;
        let sum = 0;

        for (let i = 0; i < len; i++) {
            sum += Number(digit[i]) * peso;
            peso = peso === 2 ? 9 : peso - 1;
        }

        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };

    return calc(12) === Number(digit[12]) && calc(13) === Number(digit[13]);
}

/**
 * A vitrine anuncia "CPF ou CNPJ" — é atacado, e boa parte das lojistas compra
 * pelo CNPJ da própria loja. O checkout só aceitava 11 dígitos: quem digitava o
 * CNPJ tinha os 3 últimos números cortados no campo e depois levava "CPF
 * inválido", sem entender por quê. O Asaas recebe os dois no mesmo campo
 * (`cpfCnpj`) e o banco guarda como texto, então o único lugar que precisava
 * saber a diferença era aqui.
 */
export function isValidateCpfCnpj(valor: string): boolean {
    const digit = (valor || "").replace(/\D/g, "");
    return digit.length === 14 ? isValidateCnpj(digit) : isValidateCpf(digit);
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