// Core dependencies: 
// - React hooks for state management, 
// - router navigation, 
// - API services, 
// - UI components, 
// - drag-and-drop utilities

import { useState, useEffect } from "react";

import { toast } from "react-hot-toast";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { transactionApi } from "@/services/api";
import { Transaction } from "./useTransactions";
import { EditTransactionForm, TransactionForm } from "./types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatNumber, parseTags } from "@/utils/formatters";
import { TypeBadge } from "./components/TypeBadge";
import { DoneBadge } from "./components/DoneBadge";


// =============================================================================
// TabTransactions Component
// =============================================================================
// Manages transactions for a project with drag-and-drop reordering
// Supports:
// - Transaction CRUD operations (create, read, update, delete)
// - Transaction drag-and-drop sorting
// - Bulk transaction selection with batch operations (delete)
// - Position persistence for transactions via API
// - Filters: type, search by name/tags/assignedTo
// - Date sorting

// Props interface for TabTransactions component
// projectId: The ID of the project whose transactions are being managed
interface TabTransactionsProps {
    projectId: string;
}

// Transaction Sortable Row - Enables drag-and-drop reordering of transaction rows
// Uses DnD Kit's useSortable hook
function TransactionSortableRow({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners} className={disabled ? '' : 'cursor-move border-b border-border'}>
            {children}
        </tr>
    );
}


// =============================================================================
// MAIN COMPONENT: TabTransactions
export function TabTransactions({ projectId }: TabTransactionsProps) {
    // Core data state: transactions
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog open/close state management for various operations
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Form state for creating and editing transactions
    const [transactionForm, setTransactionForm] = useState<TransactionForm>({
        name: '',
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        tags: '',
        active: true,
    });

    const [editTransactionForm, setEditTransactionForm] = useState<EditTransactionForm>({
        id: '',
        name: '',
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        tags: '',
        active: true,
        exDate: new Date(),
        assignedTo: '',
        updatedAt: new Date(),
        updatedBy: ''
    });

    // UI state for UI interactions: selected transactions, delete confirmations
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set<string>());
    const [transactionsToDelete, setTransactionsToDelete] = useState<string[]>([]);

    // =============================================================================
    // BULK SELECTION HELPERS
    // =============================================================================

    // Toggle single transaction selection in the selectedTransactionIds Set
    const toggleSelectTransaction = (transactionId: string) => {
        const newSet = new Set(selectedTransactionIds);
        newSet.has(transactionId) ? newSet.delete(transactionId) : newSet.add(transactionId);
        setSelectedTransactionIds(newSet);
    };

    // Toggle select all transactions in the current list (select/deselect all)
    const toggleSelectAllTransactions = (transactions: {id: string}[]) => {
        const allSelected = transactions.length > 0 && transactions.every(t => selectedTransactionIds.has(t.id));
        const newSet = new Set(selectedTransactionIds);
        transactions.forEach(t => {
            allSelected ? newSet.delete(t.id) : newSet.add(t.id);
        });
        setSelectedTransactionIds(newSet);
    };

    // =============================================================================
    // DELETE OPERATIONS
    // =============================================================================

    // Delete selected transactions
    const handleDeleteSelectedTransactions = async () => {
        try {
            const deletePromises = transactionsToDelete.map(async (transactionId) => {
                await transactionApi.delete(transactionId);
            });
            
            await Promise.all(deletePromises);
            toast.success(`Successfully deleted ${transactionsToDelete.length} transaction${transactionsToDelete.length !== 1 ? 's' : ''}`);
            
            setIsDeleteConfirmOpen(false);
            setTransactionsToDelete([]);
            setSelectedTransactionIds(new Set<string>());
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete transactions";
            toast.error(errorMessage);
        }
    };

    // Load data when projectId changes (effect hook)
    useEffect(() => {
        loadData();
    }, [projectId]);

    // =============================================================================
// FORM RESET HELPERS
// =============================================================================

    // Reset edit transaction form to default empty state
    const resetTransactionForm = () => setEditTransactionForm({ id: '', name: '', type: 'expense', amount: 0, tags: '', active: true, exDate: new Date(), assignedTo: '', updatedAt: new Date(), updatedBy: '' });

    // =============================================================================
// SINGLE TRANSACTION OPERATIONS
// =============================================================================

    const loadData = async () => {
        try {
            const transactionsRes = await transactionApi.getAllByProject(projectId);
            const transactionsData = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
            const sortedTransactions = transactionsData.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            setTransactions(sortedTransactions);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load transactions";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!transactionForm.name.trim()) {
            toast.error("Transaction name is required");
            return;
        }

        try {
            await transactionApi.create({
                name: transactionForm.name.trim(),
                type: transactionForm.type,
                amount: transactionForm.amount,
                tags: parseTags(transactionForm.tags),
                project: projectId,
                active: transactionForm.active,
                exDate: new Date(),
            });
            toast.success("Transaction added successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to add transaction";
            toast.error(errorMessage);
        }
        setIsAddDialogOpen(false);
        setTransactionForm({ name: '', type: 'expense', amount: 0, tags: '', active: true });
    };

    const openEditTransaction = (transaction: Transaction) => {
        setEditTransactionForm({
            id: transaction.id,
            name: transaction.name,
            type: transaction.type,
            amount: transaction.amount,
            tags: transaction.tags.join(', '),
            active: transaction.active,
            exDate: transaction.exDate ? new Date(transaction.exDate) : new Date(),
            assignedTo: transaction.assignedTo || '',
            updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt) : new Date(),
            updatedBy: transaction.updatedBy || ''
        });
        setIsEditDialogOpen(true);
    };

    const handleEditTransaction = async () => {
        try {
            await transactionApi.update(editTransactionForm.id, {
                name: editTransactionForm.name.trim(),
                type: editTransactionForm.type,
                amount: editTransactionForm.amount,
                tags: editTransactionForm.tags
                    .split(/\s*,\s*/)
                    .map(t => t.trim())
                    .filter(t => t.length > 0),
                active: editTransactionForm.active
            });
            toast.success("Transaction updated successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update transaction";
            toast.error(errorMessage);
        }
        setIsEditDialogOpen(false);
        resetTransactionForm();
    };

    // =============================================================================
// DRAG AND DROP HANDLERS
// =============================================================================

    // Handle drag end for transaction reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeTransactionIndex = transactions.findIndex((t) => t.id === active.id);
        const overTransactionIndex = transactions.findIndex((t) => t.id === over.id);

        if (activeTransactionIndex === -1 || overTransactionIndex === -1) {
            return;
        }

        setTransactions((prev) => {
            const newTransactions = arrayMove(prev, activeTransactionIndex, overTransactionIndex);
            return newTransactions;
        });
    };

    // =============================================================================
    // SAVE POSITION OPERATIONS
    // =============================================================================

    // Save the current order of transactions to the project
    const handleSaveTransactionPositions = async () => {
        if (!window.confirm("Save transaction positions?")) return;
        
        const transactionOrder = transactions.map(t => t.id);
        try {
            await transactionApi.updateBulkPosition(projectId, transactionOrder);
            toast.success("Transaction positions saved successfully");
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to save transaction positions";
            toast.error(errorMessage);
        }
    };

    // =============================================================================
    // UI RENDERERS
    // =============================================================================

    // Render the loading spinner while data is being fetched
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Render the toolbar with Add Transaction button and Save Transaction Positions button
    const renderToolbar = () => (
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    Add Transaction
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSaveTransactionPositions}
                    title="Save Transaction Positions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <path d="M17 21v-8H7v8" />
                        <path d="M7 10V3a1 1 0 0 1 1-1h5v7" />
                    </svg>
                </Button>
            </div>
        </div>
    );

    // Render the transaction table (single table, no header grouping)
    const renderTransactionTable = () => {
        return (
            <DndContext onDragEnd={handleDragEnd}>
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10 px-2 py-3 text-left bg-cyan-50 hover:bg-muted">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-primary"
                                    checked={transactions.length > 0 && transactions.every(t => selectedTransactionIds.has(t.id))}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        toggleSelectAllTransactions(transactions);
                                    }}
                                    onChange={() => {}}
                                />
                            </TableHead>
                            <TableHead className="w-[35%] px-2 text-left border-b border-gray-200 bg-cyan-50 hover:bg-muted">Name</TableHead>
                            <TableHead className="w-[18%] px-2 text-left border-b border-gray-200 bg-cyan-50 hover:bg-muted">Tags</TableHead>
                            <TableHead className="w-[12%] px-2 text-center border-b border-gray-200 bg-cyan-50 hover:bg-muted">t</TableHead>
                            <TableHead className="text-right w-[9%] border-b border-gray-200 bg-cyan-50 hover:bg-muted">Amount</TableHead>
                            <TableHead className="text-left w-[28%] border-l-2 border-border bg-cyan-50 hover:bg-muted">actName</TableHead>
                            <TableHead className="text-right w-[10%] bg-cyan-50 hover:bg-muted">actAmount</TableHead>
                            <TableHead className="text-left w-[11%] bg-cyan-50 hover:bg-muted">actDate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <SortableContext items={transactions.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        <TableBody>
                            {transactions.map((transaction) => renderTransactionRow(transaction))}
                        </TableBody>
                    </SortableContext>
                </Table>
            </DndContext>
        );
    };

    // =============================================================================
    // TRANSACTION TABLE RENDERERS
    // =============================================================================

    // Render a single transaction row - handles transactions without actuals
    const renderTransactionRow = (transaction: Transaction) => {
        return (
            <TransactionSortableRow key={transaction.id} id={transaction.id} disabled={false}>
                <TableCell className="w-10 px-2 py-3 text-left hover:bg-muted">
                    <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selectedTransactionIds.has(transaction.id)}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            toggleSelectTransaction(transaction.id);
                        }}
                        onChange={() => {}}
                    />
                </TableCell>
                <TableCell className="w-[45%] px-2 text-left border-b border-gray-200 hover:bg-muted">
                    <div className="flex items-center gap-2">
                        <span
                            className="cursor-pointer hover:underline font-medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                openEditTransaction(transaction);
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {transaction.name}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="w-[25%] px-2 text-left border-b border-gray-200 hover:bg-muted">
                    {transaction.tags && transaction.tags.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {transaction.tags.map((tag, idx) => (
                                <span key={idx} className="text-xs">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                    )}
                </TableCell>
                <TableCell className="w-[12%] px-2 text-center border-b border-gray-200 hover:bg-muted">
                    <div className="flex items-center justify-center gap-1">
                        <TypeBadge type={transaction.type} />
                        <DoneBadge done={transaction.active} />
                    </div>
                </TableCell>
                <TableCell className="w-[12.5%] text-right border-b border-gray-200 hover:bg-muted">
                    <span className="text-xs">
                        {formatNumber(transaction.amount)}
                    </span>
                </TableCell>
                <TableCell className="w-[40%] text-left border-b border-gray-200 border-l-2 border-border hover:bg-muted">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="w-[20%] text-right border-b border-gray-200 hover:bg-muted">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="w-[11%] text-left border-b border-gray-200 hover:bg-muted">
                    <span className="text-xs text-muted-foreground">-</span>
                </TableCell>
            </TransactionSortableRow>
        );
    };

    // =============================================================================
    // DIALOG RENDERERS
    // =============================================================================

    // Render delete confirmation dialog
    const renderDeleteConfirmDialog = () => {
        const transactionsWithActuals = transactionsToDelete.filter(transactionId => {
            const transaction = transactions.find(t => t.id === transactionId);
            return transaction && transaction.id && transactions.find(t => t.id === transactionId)?.id;
        });
        const deletableCount = transactionsToDelete.length - transactionsWithActuals.length;
        
        return (
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Transactions</DialogTitle>
                        <DialogDescription>
                            {deletableCount > 0 ? (
                                <p>Are you sure you want to delete {deletableCount} transaction{deletableCount !== 1 ? 's' : ''}?</p>
                            ) : (
                                <p>No transactions can be deleted.</p>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsDeleteConfirmOpen(false);
                            setTransactionsToDelete([]);
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSelectedTransactions} disabled={deletableCount === 0}>
                            Delete {deletableCount} transaction{deletableCount !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    // Render the main tab content with transaction table and dialogs
    return (
        <div className="space-y-8">
            {renderToolbar()}
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {transactions.length > 0 && Array.from(selectedTransactionIds).some(id => transactions.some(t => t.id === id)) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" type="button" className="h-8 px-3" onClick={(e) => {
                                            e.stopPropagation();
                                        }}>
                                            {Array.from(selectedTransactionIds).filter(id => transactions.some(t => t.id === id)).length} selected
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <>
                                            <DropdownMenuItem onClick={() => {
                                                const selectedInTable = Array.from(selectedTransactionIds).filter(id => transactions.some(t => t.id === id));
                                                setTransactionsToDelete(selectedInTable);
                                                setIsDeleteConfirmOpen(true);
                                            }}>
                                                Delete
                                            </DropdownMenuItem>
                                        </>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-medium">
                                {transactions.length} transactions
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderTransactionTable()}
                </CardContent>
            </Card>

            {/* Add Transaction Dialog */}
            {isAddDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg w-[500px] max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Add Transaction</h3>
                            <p className="text-sm text-muted-foreground">Create a new transaction for this project</p>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={transactionForm.name}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, name: e.target.value })}
                                    placeholder="Transaction name"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type *</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={transactionForm.type === 'income' ? 'default' : 'outline'}
                                        onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                                        className="flex-1"
                                    >
                                        Income
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={transactionForm.type === 'expense' ? 'default' : 'outline'}
                                        onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                                        className="flex-1"
                                    >
                                        Expense
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount *</label>
                                <input
                                    type="number"
                                    value={transactionForm.amount || ''}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={transactionForm.tags}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, tags: e.target.value })}
                                    placeholder="comma,separated,tags"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={transactionForm.active}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, active: e.target.checked })}
                                    className="h-4 w-4 accent-primary"
                                />
                                <label htmlFor="active" className="text-sm font-medium">Active</label>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAddTransaction}>
                                Create Transaction
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Transaction Dialog */}
            {isEditDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg w-[500px] max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Edit Transaction</h3>
                            <p className="text-sm text-muted-foreground">Modify transaction details</p>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={editTransactionForm.name}
                                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, name: e.target.value })}
                                    placeholder="Transaction name"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type *</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={editTransactionForm.type === 'income' ? 'default' : 'outline'}
                                        onClick={() => setEditTransactionForm({ ...editTransactionForm, type: 'income' })}
                                        className="flex-1"
                                    >
                                        Income
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={editTransactionForm.type === 'expense' ? 'default' : 'outline'}
                                        onClick={() => setEditTransactionForm({ ...editTransactionForm, type: 'expense' })}
                                        className="flex-1"
                                    >
                                        Expense
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount *</label>
                                <input
                                    type="number"
                                    value={editTransactionForm.amount || ''}
                                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={editTransactionForm.tags}
                                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, tags: e.target.value })}
                                    placeholder="comma,separated,tags"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Assigned To</label>
                                <input
                                    type="text"
                                    value={editTransactionForm.assignedTo}
                                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, assignedTo: e.target.value })}
                                    placeholder="User ID"
                                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={editTransactionForm.active}
                                    onChange={(e) => setEditTransactionForm({ ...editTransactionForm, active: e.target.checked })}
                                    className="h-4 w-4 accent-primary"
                                />
                                <label htmlFor="active" className="text-sm font-medium">Active</label>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleEditTransaction}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {renderDeleteConfirmDialog()}
        </div>
    );
}