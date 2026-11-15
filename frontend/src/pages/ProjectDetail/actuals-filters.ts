import { ActualWithBudgetInfo } from "./ProjectActuals";

export function filterActualsBySearch(
    actuals: ActualWithBudgetInfo[],
    searchNameTerm: string,
    searchTagTerm: string,
    searchHeaderTerm: string,
    assignToSearchTerm: string
): ActualWithBudgetInfo[] {
    return actuals.filter(actual => {
        const nameMatch = actual.name.toLowerCase().includes(searchNameTerm.toLowerCase());
        const tagMatch = searchTagTerm === '' || actual.tags.some((tag: string) => tag.toLowerCase().includes(searchTagTerm.toLowerCase()));
        const headerMatch = searchHeaderTerm === '' || actual.headerName.toLowerCase().includes(searchHeaderTerm.toLowerCase());
        const assignToMatch = assignToSearchTerm === '' || actual.assignedToName.toLowerCase().includes(assignToSearchTerm.toLowerCase());
        return nameMatch && tagMatch && headerMatch && assignToMatch;
    });
}

export function filterActualsByType(
    actuals: ActualWithBudgetInfo[],
    filterType: 'all' | 'income' | 'expense'
): ActualWithBudgetInfo[] {
    if (filterType === 'all') {
        return actuals;
    }
    return actuals.filter(actual => actual.budgetType === filterType);
}

export function sortActualsByDate(
    actuals: ActualWithBudgetInfo[],
    sortByDate: 'none' | 'asc' | 'desc'
): ActualWithBudgetInfo[] {
    if (sortByDate === 'none') {
        return actuals;
    }
    return [...actuals].sort((a, b) => {
        const dateA = new Date(a.exDate).getTime();
        const dateB = new Date(b.exDate).getTime();
        return sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
    });
}

export function calculateTotalAmount(
    actuals: ActualWithBudgetInfo[],
    selectedIds: Set<string>
): number {
    return Array.from(selectedIds).reduce((sum, id) => {
        const actual = actuals.find(a => a.id === id);
        const sign = actual?.budgetType === 'income' ? 1 : -1;
        return sum + (actual?.amount || 0) * sign;
    }, 0);
}