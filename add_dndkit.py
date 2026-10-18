import re

# Read the original file
with open('frontend/src/pages/ProjectDetail/ProjectBudgets.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add dnd-kit imports after the Budget import
content = content.replace(
    'import { Budget } from "./useBudgets";',
    '''import { Budget } from "./useBudgets";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";'''
)

# Update state variables - remove old drag state
content = content.replace(
    '''    const [draggedHeaderId, setDraggedHeaderId] = useState<string | null>(null);
    const [dragOverHeaderId, setDragOverHeaderId] = useState<string | null>(null);
    const [draggedBudgetId, setDraggedBudgetId] = useState<string | null>(null);
    const [draggedBudgetHeaderId, setDraggedBudgetHeaderId] = useState<string | null>(null);
    const tableBodyRef = useRef<HTMLTableSectionElement>(null);''',
    '''    // Dnd-kit context IDs
    const headersContextId = "headers-context";
    const budgetsContextId = "budgets-context";'''
)

# Add dnd-kit context IDs after expandedHeaders
content = content.replace(
    '''    const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());

    useEffect(() => {''',
    '''    const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());

    // Dnd-kit context IDs
    const headersContextId = "headers-context";
    const budgetsContextId = "budgets-context";

    useEffect(() => {'''
)

# Update loadData to expand headers by default
content = content.replace(
    '''            setHeaders(headersRes.data);
            setBudgets(budgetsRes.data);''',
    '''            const headers = Array.isArray(headersRes.data) ? headersRes.data : [];
            setHeaders(headers);
            const budgets = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
            setBudgets(budgets);
            // Default: expand all headers on load
            setExpandedHeaders(new Set(headers.map((h) => h.id)));'''
)

# Update header drag/drop handlers with dnd-kit
old_header_handlers = '''    // Header drag/drop handlers
    const handleHeaderDragStart = (e: React.DragEvent, headerId: string) => {
        setDraggedHeaderId(headerId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleHeaderDragOver = (e: React.DragEvent, headerId: string) => {
        e.preventDefault();
        if (headerId !== draggedHeaderId) {
            setDragOverHeaderId(headerId);
        }
    };

    const handleHeaderDragLeave = () => {
        setDragOverHeaderId(null);
    };

    const handleHeaderDrop = (e: React.DragEvent, targetHeaderId: string) => {
        e.preventDefault();
        setDragOverHeaderId(null);

        if (!draggedHeaderId || draggedHeaderId === targetHeaderId) {
            setDraggedHeaderId(null);
            return;
        }

        setHeaders((prevHeaders) => {
            const newHeaders = [...prevHeaders];
            const draggedIndex = newHeaders.findIndex(h => h.id === draggedHeaderId);
            const targetIndex = newHeaders.findIndex(h => h.id === targetHeaderId);

            if (draggedIndex > -1 && targetIndex > -1) {
                const [draggedHeader] = newHeaders.splice(draggedIndex, 1);
                const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
                newHeaders.splice(adjustedTargetIndex, 0, draggedHeader);
            }

            return newHeaders;
        });

        setDraggedHeaderId(null);
    };

    const handleHeaderDragEnd = () => {
        setDraggedHeaderId(null);
        setDragOverHeaderId(null);
    };'''

new_header_handlers = '''    // Dnd-kit header drag end handler
    const handleHeaderDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        setHeaders((prevHeaders) => {
            const oldIndex = prevHeaders.findIndex(h => h.id === activeId);
            const newIndex = prevHeaders.findIndex(h => h.id === overId);
            return arrayMove(prevHeaders, oldIndex, newIndex);
        });
    };'''

content = content.replace(old_header_handlers, new_header_handlers)

# Update budget drag/drop handlers with dnd-kit
old_budget_handlers = '''    // Budget drag/drop handlers
    const handleBudgetDragStart = (e: React.DragEvent, budgetId: string, headerId: string) => {
        setDraggedBudgetId(budgetId);
        setDraggedBudgetHeaderId(headerId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleBudgetDrop = (e: React.DragEvent, targetBudgetId: string) => {
        e.preventDefault();

        if (!draggedBudgetId || draggedBudgetId === targetBudgetId) {
            setDraggedBudgetId(null);
            setDraggedBudgetHeaderId(null);
            return;
        }

        const draggedHeader = headers.find(h => h.id === draggedBudgetHeaderId);
        if (!draggedHeader) {
            setDraggedBudgetId(null);
            setDraggedBudgetHeaderId(null);
            return;
        }
        
        setBudgets((prevBudgets) => {
            // Get all budgets for the dragged header
            const budgetsInDraggedHeader = prevBudgets.filter(b => b.header === draggedHeader.id);
            
            const draggedIndex = budgetsInDraggedHeader.findIndex(b => b.id === draggedBudgetId);
            const targetIndex = budgetsInDraggedHeader.findIndex(b => b.id === targetBudgetId);

            if (draggedIndex > -1 && targetIndex > -1) {
                // Reorder budgets within this header
                const reorderedBudgets = [...budgetsInDraggedHeader];
                const [draggedBudget] = reorderedBudgets.splice(draggedIndex, 1);
                const adjustedTargetIndex = targetIndex;
                reorderedBudgets.splice(adjustedTargetIndex, 0, draggedBudget);

                const reorderedBudgetIds = new Set(reorderedBudgets.map(b => b.id));
                
                // Rebuild full budgets array: iterate over prevBudgets and replace dragged header budgets in new order
                const result: Budget[] = [];
                const draggedIndexMap = new Map(reorderedBudgets.map((b, i) => [b.id, i]));
                
                for (const budget of prevBudgets) {
                    if (reorderedBudgetIds.has(budget.id)) {
                        result.push(reorderedBudgets[draggedIndexMap.get(budget.id)!]);
                    } else {
                        result.push(budget);
                    }
                }
                return result;
            }

            return prevBudgets;
        });

        setDraggedBudgetId(null);
        setDraggedBudgetHeaderId(null);
    };

    const handleTableBodyDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the target budget from the drop target
        const targetElement = e.target as HTMLElement;
        const targetRow = targetElement.closest('[data-budget-id]');
        
        if (targetRow) {
            const targetBudgetId = targetRow.getAttribute('data-budget-id');
            if (targetBudgetId && draggedBudgetId) {
                handleBudgetDrop(e, targetBudgetId);
            }
        }
        
        setDraggedBudgetId(null);
        setDraggedBudgetHeaderId(null);
    }, [draggedBudgetId, draggedBudgetHeaderId, handleBudgetDrop]);

    const handleBudgetDragEnd = () => {
        setDraggedBudgetId(null);
        setDraggedBudgetHeaderId(null);
    };'''

new_budget_handlers = '''    // Dnd-kit budget drag end handler
    const handleBudgetDragEnd = (headerId: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        setBudgets((prevBudgets) => {
            const associatedBudgets = prevBudgets.filter(b => b.header === headerId);
            const activeIndex = associatedBudgets.findIndex(b => b.id === activeId);
            const overIndex = associatedBudgets.findIndex(b => b.id === overId);

            if (activeIndex === -1 || overIndex === -1) return prevBudgets;

            const newAssociatedBudgets = arrayMove(associatedBudgets, activeIndex, overIndex);
            const otherBudgets = prevBudgets.filter(b => b.header !== headerId);
            return [...otherBudgets, ...newAssociatedBudgets];
        });
    };'''

content = content.replace(old_budget_handlers, new_budget_handlers)

# Update the return statement to use DndContext and SortableContext
# Find and replace the grid section
old_grid_section = '''            <div className="grid gap-4">
                {headers.map((header) => {
                    const associatedBudgets = budgets.filter(b => b.header === header.id);
                    const headerTotal = getHeaderTotal(header);

                    return (
                        <Card
                            key={header.id}
                            className={`transition-all ${
                                draggedHeaderId === header.id ? 'opacity-50 scale-95' : ''
                            } ${
                                dragOverHeaderId === header.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onDragOver={(e) => handleHeaderDragOver(e, header.id)}
                            onDragLeave={handleHeaderDragLeave}
                            onDrop={(e) => handleHeaderDrop(e, header.id)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div
                                    draggable={!expandedHeaders.has(header.id)}
                                    onDragStart={(e) => handleHeaderDragStart(e, header.id)}
                                    onDragEnd={handleHeaderDragEnd}
                                    className={`cursor-move space-y-1 ${!expandedHeaders.has(header.id) ? 'cursor-grab' : 'cursor-not-allowed'}`}
                                    style={{ touchAction: 'none' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newExpanded = new Set(expandedHeaders);
                                        if (newExpanded.has(header.id)) {
                                            newExpanded.delete(header.id);
                                        } else {
                                            newExpanded.add(header.id);
                                        }
                                        setExpandedHeaders(newExpanded);
                                    }}
                                >
                                    <CardTitle className="text-lg">{header.name}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            header.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {getTypeLabel(header.type)}
                                        </span>
                                        <span>{formatNumber(headerTotal)}</span>
                                        <button
                                            type="button"
                                            className="ml-2 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newExpanded = new Set(expandedHeaders);
                                                if (newExpanded.has(header.id)) {
                                                    newExpanded.delete(header.id);
                                                } else {
                                                    newExpanded.add(header.id);
                                                }
                                                setExpandedHeaders(newExpanded);
                                            }}
                                        >
                                            {expandedHeaders.has(header.id) ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                                                    <path d="m18 15-6-6-6 6" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                                                    <path d="m6 9 6 6 6-6" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); setSelectedHeaderId(header.id); setIsAddBudgetDialogOpen(true); }}
                                        title="Add budget"
                                    >
                                        +
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); openEditHeader(header); }}
                                        title="Edit header"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            <path d="m15 5 4 4" />
                                        </svg>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); handleSaveBudgetPositions(header.id); }}
                                        title="Save header budget positions"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <path d="M17 21v-8H7v8" />
                                            <path d="M7 10V3a1 1 0 0 1 1-1h5v7" />
                                        </svg>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteHeader(header.id); }}
                                        title="Delete header"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                                        </svg>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className={!expandedHeaders.has(header.id) ? 'p-0' : ''}>
                                            {!expandedHeaders.has(header.id) ? (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    Click chevron to show budgets
                                                </div>
                                            ) : (
                                                <>
                                                    <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody ref={tableBodyRef} onDrop={handleTableBodyDrop}>
                                                {associatedBudgets.map((budget) => (
                                                    <TableRow
                                                        key={budget.id}
                                                        data-budget-id={budget.id}
                                                        draggable
                                                        onDragStart={(e) => handleBudgetDragStart(e, budget.id, header.id)}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDragEnd={handleBudgetDragEnd}
                                                        className={`cursor-move hover:bg-muted/50 transition-colors ${
                                                            draggedBudgetId === budget.id ? 'opacity-50' : ''
                                                        }`}
                                                    >
                                                        <TableCell className="font-medium">{budget.name}</TableCell>
                                                        <TableCell>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                                budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {getTypeLabel(budget.type)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatNumber(budget.amount)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); openEditBudget(budget); }}
                                                                title="Edit budget"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                    <path d="m15 5 4 4" />
                                                                </svg>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteBudget(budget.id); }}
                                                                title="Delete budget"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                                                    <path d="M3 6h18" />
                                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                    <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                                                                </svg>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                ) }
                            </CardContent>
                        </Card>
                    );
                })}
            </div>'''

new_grid_section = '''            <DndContext onDragEnd={handleHeaderDragEnd}>
                <div className="grid gap-4">
                    <SortableContext items={headers.map(h => h.id)} strategy={verticalListSortingStrategy}>
                        {headers.map((header) => (
                            <SortableHeader
                                key={header.id}
                                id={header.id}
                                header={header}
                                budgets={budgets.filter(b => b.header === header.id)}
                                expanded={expandedHeaders.has(header.id)}
                                onToggle={() => {
                                    const newExpanded = new Set(expandedHeaders);
                                    if (newExpanded.has(header.id)) {
                                        newExpanded.delete(header.id);
                                    } else {
                                        newExpanded.add(header.id);
                                    }
                                    setExpandedHeaders(newExpanded);
                                }}
                                onAddBudget={() => setSelectedHeaderId(header.id)}
                                onEditHeader={() => openEditHeader(header)}
                                onSaveBudgets={() => handleSaveBudgetPositions(header.id)}
                                onDeleteHeader={() => handleDeleteHeader(header.id)}
                                onBudgetDragEnd={(event) => handleBudgetDragEnd(header.id, event)}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>'''

content = content.replace(old_grid_section, new_grid_section)

# Add the SortableHeader and SortableBudgetItem components before the export
components = '''
// Sortable header component
function SortableHeader({ 
    id, 
    header, 
    budgets, 
    expanded,
    onToggle,
    onAddBudget,
    onEditHeader,
    onSaveBudgets,
    onDeleteHeader,
    onBudgetDragEnd
}: { 
    id: string;
    header: Header;
    budgets: Budget[];
    expanded: boolean;
    onToggle: () => void;
    onAddBudget: () => void;
    onEditHeader: () => void;
    onSaveBudgets: () => void;
    onDeleteHeader: () => void;
    onBudgetDragEnd: (event: DragEndEvent) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: 'transform 200ms ease-out',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1
    };

    const headerTotal = budgets.reduce((sum: number, b: Budget) => sum + (b.type === 'income' ? b.amount : -b.amount), 0);

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`transition-all ${isDragging ? 'opacity-50 scale-95' : ''}`}
            {...attributes}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div
                    className="cursor-move space-y-1"
                    {...listeners}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    <CardTitle className="text-lg">{header.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                            header.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {getTypeLabel(header.type)}
                        </span>
                        <span>{formatNumber(headerTotal)}</span>
                        <button
                            type="button"
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle();
                            }}
                        >
                            {expanded ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                                    <path d="m18 15-6-6-6 6" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onAddBudget(); }}
                        title="Add budget"
                    >
                        +
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onEditHeader(); }}
                        title="Edit header"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                        </svg>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onSaveBudgets(); }}
                        title="Save header budget positions"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <path d="M17 21v-8H7v8" />
                            <path d="M7 10V3a1 1 0 0 1 1-1h5v7" />
                        </svg>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onDeleteHeader(); }}
                        title="Delete header"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                        </svg>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className={!expanded ? 'p-0' : ''}>
                {!expanded ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                        Click chevron to show budgets
                    </div>
                ) : (
                    <DndContext onDragEnd={onBudgetDragEnd}>
                        <SortableContext items={budgets.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budgets.map((budget) => (
                                        <SortableBudgetItem
                                            key={budget.id}
                                            id={budget.id}
                                            budget={budget}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </SortableContext>
                    </DndContext>
                )}
            </CardContent>
        </Card>
    );
}

// Sortable budget item component
function SortableBudgetItem({ id, budget }: { id: string; budget: Budget }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: 'transform 200ms ease-out',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className="cursor-move"
            {...attributes}
        >
            <TableCell className="font-medium">{budget.name}</TableCell>
            <TableCell>
                <span className={`text-xs px-2 py-0.5 rounded ${
                    budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {getTypeLabel(budget.type)}
                </span>
            </TableCell>
            <TableCell className="text-right">{formatNumber(budget.amount)}</TableCell>
            <TableCell className="text-right" {...listeners}>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Edit budget"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                    </svg>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Delete budget"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                    </svg>
                </Button>
            </TableCell>
        </TableRow>
    );
}
'''

# Insert components before export
content = content.replace(
    'export default ProjectBudgets;',
    components + 'export default ProjectBudgets;'
)

# Remove unused imports
content = content.replace(
    'import { useState, useEffect, useRef, useCallback } from "react";',
    'import { useState, useEffect } from "react";'
)

# Write the modified content
with open('frontend/src/pages/ProjectDetail/ProjectBudgets.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully")