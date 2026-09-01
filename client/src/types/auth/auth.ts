export type Customer = {
    id: string;
    name: string;
    email: string;
}

export type AuthValue = {
    customer: Customer | null;
    loading: boolean;
    login: (
        email: string,
        password: string
    ) => Promise<Customer>;
    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<Customer>;
    logout: () => Promise<void>;
}