// Domain types for Project Budgets
export interface Header {
    id: string;
    name: string;
    type: 'income' | 'expense';
    tags: string[];
    project: string;
    arrBudget: string[];
    done: boolean;
    [key: string]: any;
}

export interface Budget {
    id: string;
    name: string;
    note?: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string[];
    project: string;
    header: string;
    arrActual: string[];
    done: boolean;
    [key: string]: any;
}

export interface Actual {
    id: string;
    name: string;
    note?: string;
    amount: number;
    budget: string;
    [key: string]: any;
}

// Form state types
export interface HeaderForm {
    name: string;
    type: 'income' | 'expense';
    tags: string;
}

export interface EditHeaderForm {
    id: string;
    name: string;
    type: 'income' | 'expense';
    tags: string;
}

export interface BudgetForm {
    name: string;
    note?: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
}

export interface EditBudgetForm {
    id: string;
    name: string;
    note?: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
    done: boolean;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface EditActualForm {
    id: string;
    name: string;
    note?: string;
    amount: number;
    exDate: Date;
    tags: string;
    assignedTo: string;
    updatedAt: Date;
    updatedBy: string;
}

// Register Actual-related types
export interface BudgetWithName {
    budget: Budget;
    name: string;
}

// Domain types for Project Transactions
export interface Transaction {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string[];
    project: string;
    active: boolean;
    exDate: Date;
    assignedTo: string | null;
    arrActual: string[];
    position: number;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// Form state types for Transactions
export interface TransactionForm {
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
    active: boolean;
}

export interface EditTransactionForm {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
    active: boolean;
    exDate: Date;
    assignedTo: string;
    updatedAt: Date;
    updatedBy: string;
}