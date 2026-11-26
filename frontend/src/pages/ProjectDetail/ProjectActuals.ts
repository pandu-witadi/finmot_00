// Types for ProjectActuals - shared between TabActuals and filter files

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface ActualWithBudgetInfo {
    id: string;
    name: string;
    amount: number;
    active: boolean;
    budget: string;
    project: string;
    exDate: Date;
    assignedTo: string;
    updatedAt: Date;
    updatedBy: string;
    createdAt: string;
    headerName: string;
    headerId: string;
    headerOrder: number;
    budgetType: 'income' | 'expense';
    transaction?: {
        id: string;
        name: string;
        amount: number;
        projectName: string;
        project: string;
    };
    tags: string[];
    assignedToName: string;
}