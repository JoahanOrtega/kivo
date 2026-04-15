export type CategoryType = "income" | "expense";
export type AccountType = "income" | "expense" | "both";

export type Category = {
    id: string;
    name: string;
    type: CategoryType;
    isDefault: boolean;
    isActive: boolean;
};

export type Account = {
    id: string;
    name: string;
    type: AccountType;
    isDefault: boolean;
    isActive: boolean;
};