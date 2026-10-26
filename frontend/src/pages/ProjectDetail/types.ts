// Domain types for Project Budgets
export interface Header {
    id: string;
    name: string;
    type: 'income' | 'expense';
    tags: string[];
    project: string;
    arrBudget: string[];
    active: boolean;
    [key: string]: any;
}

export interface Budget {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string[];
    project: string;
    header: string;
    arrActual: string[];
    active: boolean;
    [key: string]: any;
}

export interface Actual {
    id: string;
    name: string;
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
    type: 'income' | 'expense';
    amount: number;
    tags: string;
}

export interface EditBudgetForm {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
}

export interface EditActualForm {
    id: string;
    name: string;
    amount: number;
}

// Cloning-related types
export interface BudgetWithName {
    budget: Budget;
    name: string;
}