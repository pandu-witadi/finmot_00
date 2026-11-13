import { Transaction } from './useTransactions';
import { Actual } from './useActuals';
import { formatNumber, getTypeLabel } from '@/utils/formatters';
import { formatDate } from '@/utils/dateFormatters';
import { Link } from 'react-router-dom';
import { TableCell, TableRow } from '@/components/ui/table';

export interface TransactionInfo {
    id: string;
    name: string;
    amount: number;
    projectName: string;
    project: string;
}

export interface ActualWithProject {
    actual: Actual;
    projectName: string;
}

export interface TransactionWithActuals {
    transaction: Transaction;
    actuals: ActualWithProject[];
}

export interface TableProps {
    flattenedRows: FlattenedRow[];
    transactionActualsMap: Map<string, ActualWithProject[]>;
    getUserById: (userId: string | null) => string;
    projectName: string;
    selectedTransactionIds: Set<string>;
    setSelectedTransactionIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    onTransactionClick: (id: string) => void;
}

/**
 * Filter transactions by search terms
 */
export function filterTransactions(
    transactions: Transaction[],
    searchNameTerm: string,
    searchTagTerm: string,
    searchAssignedTerm: string,
    users: { id: string; name: string; email: string }[]
): Transaction[] {
    return transactions.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(searchNameTerm.toLowerCase());
        const tagMatch =
            searchTagTerm === '' ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchTagTerm.toLowerCase()));
        const assignedMatch =
            searchAssignedTerm === '' ||
            getUserById(t.assignedTo, users).toLowerCase().includes(searchAssignedTerm.toLowerCase());
        return nameMatch && tagMatch && assignedMatch;
    });
}

/**
 * Sort transactions by field and order
 */
export function sortTransactions(
    transactions: Transaction[],
    field: 'exDate' | 'none',
    order: 'asc' | 'desc' | 'none'
): Transaction[] {
    if (field === 'none' || order === 'none') return transactions;

    return [...transactions].sort((a, b) => {
        let cmp = 0;
        if (field === 'exDate') {
            cmp = new Date(a.exDate).getTime() - new Date(b.exDate).getTime();
        }
        return order === 'asc' ? cmp : -cmp;
    });
}

/**
 * Look up user name by ID
 */
export function getUserById(
    userId: string | null,
    users: { id: string; name: string; email: string }[]
): string {
    if (!userId || userId === '000000000000000000000000') return '—';
    const user = users.find((u) => String(u.id) === String(userId));
    return user ? user.name : 'Unknown';
}

/**
 * Map actual IDs to actual objects with project names
 */
export function mapActualsToTransactions(
    transactions: Transaction[],
    allActuals: Actual[],
    projectsMap: Map<string, string>
): Map<string, ActualWithProject[]> {
    const transactionActualsMap = new Map<string, ActualWithProject[]>();

    transactions.forEach((transaction) => {
        const uniqueActualIds = Array.from(new Set(transaction.arrActual || []));
        const transactionActuals: ActualWithProject[] = [];

        uniqueActualIds.forEach((actualId) => {
            const actual = allActuals.find((a) => a.id === actualId);
            if (actual) {
                const projectName = projectsMap.get(actual.project) || '';
                transactionActuals.push({ actual, projectName });
            }
        });

        if (transactionActuals.length > 0) {
            transactionActualsMap.set(transaction.id, transactionActuals);
        }
    });

    return transactionActualsMap;
}

/**
 * Flatten transactions with their actuals for table display
 */
export interface FlattenedRow {
    type: 'transaction';
    transaction: Transaction;
    actual: ActualWithProject | null;
    index: number;
}

export function flattenTransactionsWithActuals(
    transactions: Transaction[],
    transactionActualsMap: Map<string, ActualWithProject[]>
): FlattenedRow[] {
    const flattenedRows: FlattenedRow[] = [];

    transactions.forEach((transaction) => {
        const transactionActuals = transactionActualsMap.get(transaction.id) || [];
        if (transactionActuals.length === 0) {
            flattenedRows.push({
                type: 'transaction',
                transaction,
                actual: null,
                index: 0,
            });
        } else {
            transactionActuals.forEach((actualWithProject, index) => {
                flattenedRows.push({
                    type: 'transaction',
                    transaction,
                    actual: actualWithProject,
                    index,
                });
            });
        }
    });

    return flattenedRows;
}

/**
 * Calculate transaction totals
 */
export function calculateTransactionTotals(transactions: Transaction[]): {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
} {
    const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netAmount };
}

/**
 * Calculate selected transaction total
 */
export function calculateSelectedTotal(
    selectedTransactionIds: Set<string>,
    transactions: Transaction[]
): number {
    return Array.from(selectedTransactionIds).reduce((sum, id) => {
        const transaction = transactions.find((t) => t.id === id);
        const sign = transaction?.type === 'income' ? 1 : -1;
        return sum + (transaction?.amount || 0) * sign;
    }, 0);
}

// ============== TransactionRow Component ==============

export interface TransactionRowProps {
    transaction: Transaction;
    actual: ActualWithProject | null;
    index: number;
    transactionActualsMap: Map<string, ActualWithProject[]>;
    getUserById: (userId: string | null) => string;
    isSelected: boolean;
    onToggle: () => void;
    onNameClick: (e: React.MouseEvent) => void;
}

export function TransactionRow({ transaction, actual, index, transactionActualsMap, getUserById, isSelected, onToggle, onNameClick }: TransactionRowProps) {
    const transactionActuals = transactionActualsMap.get(transaction.id) || [];
    const hasActuals = transactionActuals.length > 0;

    const renderSharedCells = () => {
        const cells = [];
        
        // Checkbox cell
        cells.push(
            <TableCell className="w-[5%] px-2 text-left" key="cb" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                />
            </TableCell>
        );
        
        // Name cell
        cells.push(
            <TableCell className="w-[22%] px-2 text-left border-b border-gray-200" key="name" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <div className="flex items-center gap-2">
                    <span
                        className="cursor-pointer hover:underline font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNameClick(e);
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {transaction.name}
                    </span>
                </div>
            </TableCell>
        );
        
        // Tags cell
        cells.push(
            <TableCell className="w-[8%] px-2 text-left border-b border-gray-200" key="tags" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {transaction.tags.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {transaction.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </TableCell>
        );
        
        // Type cell
        cells.push(
            <TableCell className="w-[4%] px-2 text-center border-b border-gray-200" key="type" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {getTypeLabel(transaction.type)}
                </span>
            </TableCell>
        );
        
        // Amount cell
        cells.push(
            <TableCell className="w-[7%] text-right border-b border-gray-200" key="amount" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <span className="text-xs">
                    {formatNumber(transaction.amount)}
                </span>
            </TableCell>
        );
        
        // Date cell
        cells.push(
            <TableCell className="w-[6%] px-2 text-right border-b border-gray-200" key="date" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {transaction.exDate ? <span className="text-xs">{formatDate(transaction.exDate)}</span> : '—'}
            </TableCell>
        );
        
        // AssignedTo cell
        cells.push(
            <TableCell className="w-[7%] px-2 text-left border-b border-gray-200" key="assigned" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {getUserById(transaction.assignedTo)}
            </TableCell>
        );
        
        return cells;
    };

    const renderActualCell = () => {
        if (!hasActuals || !actual) {
            return (
                <>
                    <TableCell className="w-[22%] border-l-2 border-border text-left border-b border-gray-200" key="act-name">
                        <span className="text-sm text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell className="w-[9%] text-right border-b border-gray-200" key="act-amount">
                        <span className="text-sm text-muted-foreground">—</span>
                    </TableCell>
                </>
            );
        }

        const lastRowClass = index === transactionActuals.length - 1 ? "border-b border-gray-200" : "";

        return (
            <>
                <TableCell className={`w-[22%] text-left ${lastRowClass} border-l-2 border-border`} key="act-name">
                    <div className="flex flex-col">
                        <span
                            className="font-medium text-primary cursor-pointer"
                            title={actual?.actual.name}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {actual?.actual.name}
                        </span>
                        {actual?.projectName && actual?.actual.project ? (
                            <Link
                                to={`/projects/${actual.actual.project}?tab=actuals`}
                                className="text-xs italic text-muted-foreground hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {actual.projectName}
                            </Link>
                        ) : (
                            <span className="text-xs italic text-muted-foreground">
                                {actual?.projectName || ''}
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className={`w-[9%] text-right ${lastRowClass}`} key="act-amount">
                    <span className="text-xs text-muted-foreground">
                        {actual ? formatNumber(actual.actual.amount) : '-'}
                    </span>
                </TableCell>
            </>
        );
    };

    if (!hasActuals || !actual) {
        return (
            <TableRow key={transaction.id} className="cursor-pointer" onClick={(e) => onNameClick(e)}>
                {renderSharedCells()}
                {renderActualCell()}
            </TableRow>
        );
    }

    return (
        <TableRow key={transaction.id} className="cursor-pointer" onClick={(e) => onNameClick(e)}>
            {index === 0 && renderSharedCells()}
            {renderActualCell()}
        </TableRow>
    );
}