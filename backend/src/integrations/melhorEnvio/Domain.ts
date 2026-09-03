import { PACKAGING } from './packaging.config';
import type {
    ComputePackageResult,
    PackableItem,
    PackageLog,
    PackageLogItem,
    PackageVolume,
} from './types';

const DEFAULT_WEIGHT_KG = 0.3;

// Um item está "sem medida" quando as dimensões vêm nulas/zeradas OU batem
// exatamente com o default do banco (5×15×20) — nesse caso estimamos o volume
// pelo peso (densidade fallback) e marcamos o SKU como estimado.
function isMeasured(item: PackableItem): boolean {
    const h = Number(item.pkgHeightCm);
    const w = Number(item.pkgWidthCm);
    const l = Number(item.pkgLengthCm);
    if (!h || !w || !l) return false;
    const s = PACKAGING.DEFAULT_DIMS_SENTINELA;
    const isSentinela = h === s.alturaCm && w === s.larguraCm && l === s.comprimentoCm;
    return !isSentinela;
}

function itemWeightKg(item: PackableItem): number {
    const w = Number(item.weightKg);
    return w > 0 ? w : DEFAULT_WEIGHT_KG;
}

// Volume unitário do item em cm³ (medido) ou estimado pelo peso via densidade.
function itemVolumeCm3(item: PackableItem, measured: boolean): number {
    if (measured) {
        return Number(item.pkgHeightCm) * Number(item.pkgWidthCm) * Number(item.pkgLengthCm);
    }
    const weightG = itemWeightKg(item) * 1000;
    const volumeL = weightG / PACKAGING.DENSITY_FALLBACK_G_POR_L;
    return volumeL * 1000;
}

function applyCorreiosFloor(v: PackageVolume): PackageVolume {
    const min = PACKAGING.CORREIOS_MIN_CM;
    return {
        length: Math.max(v.length, min.comprimentoCm),
        width: Math.max(v.width, min.larguraCm),
        height: Math.max(v.height, min.alturaCm),
        weight: v.weight,
    };
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/**
 * Função de pacote única. Recebe os itens do carrinho e decide COMO despachar:
 * sacola, caixa(s) ou "frete sob consulta" (3+ volumes). Retorna os volumes já
 * prontos pra cotar/etiquetar no Melhor Envio, ou { sobConsulta:true }.
 *
 * Todos os parâmetros vêm de packaging.config.ts.
 */
export function computePackage(items: PackableItem[]): ComputePackageResult {
    let totalVolumeCm3 = 0;
    let totalWeightKg = 0;
    let anyMeasured = false;
    let anyEstimated = false;
    const estimatedSkus: string[] = [];
    const logItems: PackageLogItem[] = [];

    for (const item of items) {
        const measured = isMeasured(item);
        const unitVolume = itemVolumeCm3(item, measured);
        const unitWeight = itemWeightKg(item);
        const ref = item.ref ?? 'sem-ref';

        totalVolumeCm3 += unitVolume * item.quantity;
        totalWeightKg += unitWeight * item.quantity;

        if (measured) anyMeasured = true;
        else {
            anyEstimated = true;
            estimatedSkus.push(ref);
        }

        logItems.push({
            ref,
            method: measured ? 'medida' : 'estimado',
            volumeCm3: Math.round(unitVolume),
            weightKg: round2(unitWeight),
            quantity: item.quantity,
        });
    }

    const method: PackageLog['method'] =
        anyMeasured && anyEstimated ? 'misto' : anyEstimated ? 'estimado' : 'medida';

    const baseLog = (
        packaging: PackageLog['packaging'],
        embalagem: string,
        numVolumes: number,
    ): PackageLog => ({
        totalVolumeCm3: Math.round(totalVolumeCm3),
        totalWeightKg: round2(totalWeightKg),
        packaging,
        embalagem,
        numVolumes,
        method,
        estimatedSkus,
        items: logItems,
    });

    // 1) SACOLA: menor sacola cuja capacidade (base × espessura_máx) comporte o
    //    volume — desde que o peso não estoure o teto de um único volume.
    if (PACKAGING.SACOLAS.length > 0 && totalWeightKg <= PACKAGING.TETO_KG) {
        const candidatas = [...PACKAGING.SACOLAS]
            .map((s) => ({
                ...s,
                capacidadeCm3: s.larguraBaseCm * s.comprimentoBaseCm * s.espessuraMaxCm,
            }))
            .sort((a, b) => a.capacidadeCm3 - b.capacidadeCm3);

        const escolhida = candidatas.find((s) => s.capacidadeCm3 >= totalVolumeCm3);
        if (escolhida) {
            const espessura = totalVolumeCm3 / (escolhida.larguraBaseCm * escolhida.comprimentoBaseCm);
            const volume = applyCorreiosFloor({
                length: escolhida.comprimentoBaseCm,
                width: escolhida.larguraBaseCm,
                height: round2(espessura),
                weight: round2(totalWeightKg),
            });
            const log = baseLog('sacola', escolhida.nome, 1);
            logPackage(log);
            return { sobConsulta: false, packaging: 'sacola', volumes: [volume], log };
        }
    }

    // 2) CAIXAS 64 L + teto duro de 22 kg por volume.
    const nCaixas = Math.max(1, Math.ceil(totalVolumeCm3 / PACKAGING.CAIXA_VOL_CM3));
    const nPorPeso = Math.max(1, Math.ceil(totalWeightKg / PACKAGING.TETO_KG));
    const nVolumes = Math.max(nCaixas, nPorPeso);

    // 3) 3+ volumes (ou o que o config definir) → não cota ME, frete sob consulta.
    if (nVolumes > PACKAGING.MAX_VOLUMES_ME) {
        const log = baseLog('sob_consulta', `${nVolumes}x caixa 40x40x40`, nVolumes);
        logPackage(log);
        return {
            sobConsulta: true,
            motivo: `Pedido volumoso: ${nVolumes} volumes (máx. ${PACKAGING.MAX_VOLUMES_ME} para cotação automática).`,
            log,
        };
    }

    // 1 ou 2 caixas: distribui o peso igualmente entre os volumes.
    const pesoPorVolume = round2(totalWeightKg / nVolumes);
    const box = PACKAGING.CAIXA_CM;
    const volumes: PackageVolume[] = Array.from({ length: nVolumes }, () =>
        applyCorreiosFloor({
            length: box.comprimentoCm,
            width: box.larguraCm,
            height: box.alturaCm,
            weight: pesoPorVolume,
        }),
    );
    const log = baseLog('caixa', `${nVolumes}x caixa 40x40x40`, nVolumes);
    logPackage(log);
    return { sobConsulta: false, packaging: 'caixa', volumes, log };
}

function logPackage(log: PackageLog): void {
    console.info('[computePackage]', JSON.stringify(log));
}
