import { PackageCheck, ShieldAlert, Store, Truck } from "lucide-react";

// Venda de ATACADO para revendedora — NÃO é varejo. Direito de arrependimento
// não se aplica e não é oferecido. Política de trocas restrita a divergência de
// pedido e defeito de fabricação.
export function ProductBenefits() {
    return (
        <div className="space-y-4 border-t pt-6">
            <div className="flex items-start gap-3">
                <Truck className="mt-1 text-green-600" size={20} />
                <div>
                    <p className="font-medium">Frete calculado por CEP</p>
                    <p className="text-sm text-gray-600">Correios e transportadora</p>
                </div>
            </div>

            <div className="flex items-start gap-3">
                <PackageCheck className="mt-1 text-blue-600" size={20} />
                <div>
                    <p className="font-medium">Confira ao receber</p>
                    <p className="text-sm text-gray-600">
                        Divergência de quantidade, tamanho ou cor: avise em até 3 dias
                        úteis, com foto da embalagem e das peças.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 text-amber-600" size={20} />
                <div>
                    <p className="font-medium">Defeito de fabricação</p>
                    <p className="text-sm text-gray-600">
                        Peça sem uso, com etiqueta, com foto. Peças usadas, lavadas ou
                        sem etiqueta não são trocadas.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-3">
                <Store className="mt-1 text-purple-600" size={20} />
                <div>
                    <p className="font-medium">Venda no atacado</p>
                    <p className="text-sm text-gray-600">
                        Não há troca por arrependimento nem devolução de mercadoria não
                        vendida.
                    </p>
                </div>
            </div>
        </div>
    );
}
