export type OrderEmailData = {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    total: string;

};

export type AbandonedCartEmailData = {
    customerName: string;
    customerEmail: string;
    items: { name: string; quantity: number }[];
    cartUrl: string;
    unsubscribeUrl: string;
};
