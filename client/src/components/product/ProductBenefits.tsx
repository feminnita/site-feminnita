import { RefreshCw, Shield, Truck } from "lucide-react";

export function ProductBenefits() {
    return (
        <div className="space-y-4 border-t pt-6">
            <div className="flex items-start gap-3">
                <Truck className="mt-1 text-green-600" size={20} />
                <div>
                    <p className="font-medium">Frete Grátis</p>
                    <p className="text-sm text-gray-600">
                        Para compras acima de R$ 299,00
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <RefreshCw className="mt-1 text-blue-600" size={20} />
                <div>
                    <p className="font-medium">Troca Grátis</p>
                    <p className="text-sm text-gray-600">
                        Primeira troca por nossa conta em até 30 dias
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <Shield className="mt-1 text-purple-600" size={20} />
                <div>
                    <p className="font-medium">Compra Segura</p>
                    <p className="text-sm text-gray-600">Ambiente seguro e protegido</p>
                </div>
            </div>
        </div>
    );
}
