export type CartItem = {
    id: string;
    name: string;
    images: string[];
    price: number;
    pixPrice: number;
    quantity: number;
    selectedColor: string;
    selectedSize: string;
    category?: string;
    selected?: boolean;
};

export type CartValue = {
    items: CartItem[];
    count: number;
    subtotal: number;
    add: (item: CartItem) => void;
    remove: (index: number) => void;
    setQuantity: (index: number, quantity: number) => void;
    clear: () => void;
    ready: boolean;
    toggleSelected: (index: number) => void;
    setAllSelected: (selected: boolean) => void;
    selectedItems: CartItem[];
    selectedCount: number;
    selectedSubtotal: number;
    removeSelected: () => void;
    drawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

export type ServerCartItem = {
    productId: string;
    name?: string;
    size: string;
    color?: string;
    quantity: number;
    selected?: boolean;
};

export type ServerCartLine = ServerCartItem & {
    productName?: string;
    productImage?: string | null;
    unitPrice?: number;
    unavailable?: boolean;
}