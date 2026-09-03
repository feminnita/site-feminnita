export type ShippingQuoteOption = {
    id: number;
    name: string;
    company: string;
    price: string;
    deliveryDays: number;
};

export type PackageDimensions = {
    length: number;
    width: number;
    height: number;
    weight: number;
};

export type PackableItem = {
    weightKg: string | null;
    pkgHeightCm: string | null;
    pkgWidthCm: string | null;
    pkgLengthCm: string | null;
    quantity: number;
    /** Referência do item (productId/SKU) só para o log de estimados. Opcional. */
    ref?: string | null;
};

// Um volume físico a despachar (mesma forma do PackageDimensions do ME).
export type PackageVolume = PackageDimensions;

export type PackagingKind = 'sacola' | 'caixa';

export type PackageLogItem = {
    ref: string;
    method: 'medida' | 'estimado';
    volumeCm3: number;
    weightKg: number;
    quantity: number;
};

// Log estruturado por cotação (vai pro console e é guardado no pedido).
export type PackageLog = {
    totalVolumeCm3: number;
    totalWeightKg: number;
    packaging: PackagingKind | 'sob_consulta';
    embalagem: string;
    numVolumes: number;
    method: 'medida' | 'estimado' | 'misto';
    estimatedSkus: string[];
    items: PackageLogItem[];
};

export type ComputePackageResult =
    | { sobConsulta: false; packaging: PackagingKind; volumes: PackageVolume[]; log: PackageLog }
    | { sobConsulta: true; motivo: string; log: PackageLog };

export type RawQuoteOption = {
    id: number;
    name: string;
    price?: string;
    delivery_time?: number;
    company?: { name: string };
    error?: string;
};

export type LabelOrderData = {
    orderNumber: string;
    serviceId: number;
    total: string;
    shippingAddress: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
    };
    customer: {
        name: string;
        email: string;
        cpf: string;
        phone?: string | null
    };
    items: {
        name: string;
        quantity: number;
        unitaryValue: string
    }[];
    package: PackageDimensions;

};

