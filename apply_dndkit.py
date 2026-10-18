import re

# Read the HEAD version
with open('frontend/src/pages/ProjectDetail/ProjectBudgets.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add dnd-kit imports
content = content.replace(
    'import { Header } from "./useBudgetHeaders";\nimport { Budget } from "./useBudgets";',
    '''import { Header } from "./useBudgetHeaders";
import { Budget } from "./useBudgets";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";'''
)

# 2. Remove old state variables and keep only expandedHeaders
content = re.sub(
    r'    const \[draggedHeaderId, setDraggedHeaderId\] = useState<string \| null>\(null\);\n    const \[dragOverHeaderId, setDragOverHeaderId\] = useState<string \| null>\(null\);\n    const \[draggedBudgetId, setDraggedBudgetId\] = useState<string \| null>\(null\);\n    const \[draggedBudgetHeaderId, setDraggedBudgetHeaderId\] = useState<string \| null>\(null\);\n    const tableBodyRef = useRef<HTMLTableSectionElement>\(null\);',
    '',
    content
)

# 3. Remove old refs
content = re.sub(
    r'    const headersRef = useRef<Header\[\]>\(\);\n    const budgetsRef = useRef<Budget\[\]>\(\);\n    const dragOffsetRef = useRef\(\{ x: 0, y: 0 \}\);\n    const draggedElementRef = useRef<HTMLTableRowElement \| null>\(null\);\n\n    useEffect\(\(\) => \{\n        headersRef\.current = headers;\n    \}, \[headers\]\);\n\n    useEffect\(\(\) => \{\n        budgetsRef\.current = budgets;\n    \}, \[budgets\]\);\n',
    '',
    content
)

# 4. Remove pointer event effect
content = re.sub(
    r'    useEffect\(\(\) => \{\n        if \(draggedBudgetId \|\| draggedHeaderId\) \{\n            window\.addEventListener\(\'pointermove\', handleGlobalPointerMove\);\n            window\.addEventListener\(\'pointerup\', handleGlobalPointerUp\);\n        \}\n        return \(\) => \{\n            window\.removeEventListener\(\'pointermove\', handleGlobalPointerMove\);\n            window\.removeEventListener\(\'pointerup\', handleGlobalPointerUp\);\n        \};\n    \}, \[draggedBudgetId, draggedHeaderId\]\);\n\n    const handleGlobalPointerMove = \(e: PointerEvent\) => \{\n        if \(draggedBudgetId\) \{\n            handleBudgetPointerMove\(e as React\.PointerEvent\);\n        \}\n        if \(draggedHeaderId\) \{\n            handleHeaderPointerMove\(e as React\.PointerEvent\);\n        \}\n    \};\n\n    const handleGlobalPointerUp = \(e: PointerEvent\) => \{\n        if \(draggedBudgetId\) \{\n            handleBudgetPointerUp\(e as React\.PointerEvent\);\n        \}\n        if \(draggedHeaderId\) \{\n            handleHeaderPointerUp\(e as React\.PointerEvent\);\n        \}\n    \};\n',
    '',
    content
)

# 5. Update loadData to expand headers by default
content = re.sub(
    r'            setHeaders\(headersRes\.data\);\n            setBudgets\(budgetsRes\.data\);',
    '''            const headers = Array.isArray(headersRes.data) ? headersRes.data : [];
            setHeaders(headers);
            const budgets = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
            setBudgets(budgets);
            // Default: expand all headers on load
            setExpandedHeaders(new Set(headers.map((h) => h.id)));''',
    content
)

# 6. Replace header pointer handlers with dnd-kit
content = re.sub(
    r'''    // Header drag/drop handlers
    const handleHeaderPointerDown = \(e: React\.PointerEvent, headerId: string\) => \{
        if \(e\.button !== 0\) return;
        setDraggedHeaderId\(headerId\);
        dragOffsetRef\.current = \{ x: e\.clientX, y: e\.clientY \};
        draggedElementRef\.current = e\.currentTarget as HTMLElement;
        draggedElementRef\.current\.style\.opacity = '0\.5';
        draggedElementRef\.current\.style\.cursor = 'grabbing';
    \};

    const handleHeaderPointerMove = \(e: React\.PointerEvent\) => \{
        if \(!draggedHeaderId\) return;
   
        e\.preventDefault\(\);
        
        const element = document\.elementFromPoint\(e\.clientX, e\.clientY\);
        const headerCard = element\?\.closest\('\[data-header-id\]'\);
        
        if \(headerCard && draggedHeaderId !== headerCard\.getAttribute\('data-header-id'\)\) \{
            setDragOverHeaderId\(headerCard\.getAttribute\('data-header-id'\) \|\| null\);
        \} else if \(!element\) \{
            setDragOverHeaderId\(null\);
        \}
    \};

    const handleHeaderPointerUp = \(e: React\.PointerEvent\) => \{
        if \(!draggedHeaderId\) return;
        
        if \(dragOverHeaderId\) \{
            handleHeaderDrop\(e, dragOverHeaderId\);
        \}
        
        if \(draggedElementRef\.current\) \{
            draggedElementRef\.current\.style\.opacity = ''\;
            draggedElementRef\.current\.style\.cursor = ''\;
        \}
        setDraggedHeaderId\(null\);
        setDragOverHeaderId\(null\);
        draggedElementRef\.current = null;
    \};

    const handleHeaderDrop = \(e: React\.DragEvent \| React\.PointerEvent, targetHeaderId: string\) => \{
        if \(!draggedHeaderId \|\| draggedHeaderId === targetHeaderId\) \{
            setDraggedHeaderId\(null\);
            return;
        \}

        setHeaders\(\(prevHeaders\) => \{
            const newHeaders = \[\.\.\.prevHeaders\];
            const draggedIndex = newHeaders\.findIndex\(h => h\.id === draggedHeaderId\);
            const targetIndex = newHeaders\.findIndex\(h => h\.id === targetHeaderId\);

            if \(draggedIndex > -1 && targetIndex > -1\) \{
                const \[draggedHeader\] = newHeaders\.splice\(draggedIndex, 1\);
                const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
                newHeaders\.splice\(adjustedTargetIndex, 0, draggedHeader\);
            \}

            return newHeaders;
        \}\);

        setDraggedHeaderId\(null\);
    \};

    const handleHeaderDragEnd = \(\) => \{
        setDraggedHeaderId\(null\);
        setDragOverHeaderId\(null\);
    \};''',
    '''    // Dnd-kit header drag end handler
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
    };''',
    content
)

# 7. Replace budget drag handlers with dnd-kit
content = re.sub(
    r'''    const handleBudgetPointerDown = \(e: React\.PointerEvent, budgetId: string, headerId: string\) => \{
        if \(e\.button !== 0\) return;
        setDraggedBudgetId\(budgetId\);
        setDraggedBudgetHeaderId\(headerId\);
        dragOffsetRef\.current = \{ x: e\.clientX, y: e\.clientY \};
        draggedElementRef\.current = e\.currentTarget as HTMLElement;
        draggedElementRef\.current\.style\.opacity = '0\.5';
        draggedElementRef\.current\.style\.cursor = 'grabbing';
    \};

    const handleBudgetPointerMove = \(e: React\.PointerEvent\) => \{
        if \(!draggedBudgetId\) return;
        e\.preventDefault\(\);
        
        const targetElement = document\.elementFromPoint\(e\.clientX, e\.clientY\);
        const targetRow = targetElement\?\.closest\('\[data-budget-id\]'\);
        
        if \(targetRow\) \{
            const budgetId = targetRow\.getAttribute\('data-budget-id'\);
            if \(budgetId && budgetId !== draggedBudgetId\) \{
                setDragOverBudgetIndex\(budgets\.findIndex\(b => b\.id === budgetId\)\);
            \} else if \(!targetElement\) \{
                setDragOverBudgetIndex\(null\);
            \}
        \}
    \};

    const handleBudgetPointerUp = \(e: React\.PointerEvent\) => \{
        if \(!draggedBudgetId\) return;
        
        if \(dragOverBudgetIndex !== null\) \{
            const budgetsInHeader = budgets\.filter\(b => b\.header === draggedBudgetHeaderId\);
            if \(dragOverBudgetIndex < budgetsInHeader\.length\) \{
                const targetBudgetId = budgetsInHeader\[dragOverBudgetIndex\]\.id;
                if \(targetBudgetId && targetBudgetId !== draggedBudgetId\) \{
                    handleBudgetDrop\(e, targetBudgetId\);
                \}
            \}
        \}
        
        // Reset
        if \(draggedElementRef\.current\) \{
            draggedElementRef\.current\.style\.opacity = ''\;
            draggedElementRef\.current\.style\.cursor = ''\;
        \}
        setDraggedBudgetId\(null\);
        setDraggedBudgetHeaderId\(null\);
        setDragOverBudgetIndex\(null\);
        draggedElementRef\.current = null;
    \};

    const handleBudgetDrop = \(e: React\.DragEvent \| React\.PointerEvent, targetBudgetId: string\) => \{
        if \(!draggedBudgetId \|\| draggedBudgetId === targetBudgetId\) \{
            setDraggedBudgetId\(null\);
            setDraggedBudgetHeaderId\(null\);
            return;
        \}

        const draggedHeader = headers\.find\(h => h\.id === draggedBudgetHeaderId\);
        if \(!draggedHeader\) \{
            setDraggedBudgetId\(null\);
            setDraggedBudgetHeaderId\(null\);
            return;
        \}
        
        setBudgets\(\(prevBudgets\) => \{
            // Get all budgets for the dragged header
            const budgetsInDraggedHeader = prevBudgets\.filter\(b => b\.header === draggedHeader\.id\);
            
            const draggedIndex = budgetsInDraggedHeader\.findIndex\(b => b\.id === draggedBudgetId\);
            const targetIndex = budgetsInDraggedHeader\.findIndex\(b => b\.id === targetBudgetId\);

            if \(draggedIndex > -1 && targetIndex > -1\) \{
                // Reorder budgets within this header
                const reorderedBudgets = \[\.\.\.budgetsInDraggedHeader\];
                const \[draggedBudget\] = reorderedBudgets\.splice\(draggedIndex, 1\);
                const adjustedTargetIndex = targetIndex;
                reorderedBudgets\.splice\(adjustedTargetIndex, 0, draggedBudget\);

                const reorderedBudgetIds = new Set\(reorderedBudgets\.map\(b => b\.id\)\);
                
                // Rebuild full budgets array: iterate over prevBudgets and replace dragged header budgets in new order
                const result: Budget\[\] = \[\];
                const draggedIndexMap = new Map\(reorderedBudgets\.map\(\(b, i\) => \[b\.id, i\]\)\);
                
                for \(const budget of prevBudgets\) \{
                    if \(reorderedBudgetIds\.has\(budget\.id\)\) \{
                        result\.push\(reorderedBudgets\[draggedIndexMap\.get\(budget\.id\)!\]\);
                    \} else \{
                        result\.push\(budget\);
                    \}
                \}
                return result;
            \}

            return prevBudgets;
        \}\);

        setDraggedBudgetId\(null\);
        setDraggedBudgetHeaderId\(null\);
    \};

    const handleTableBodyDrop = useCallback\(\(e: React\.DragEvent\) => \{
        e\.preventDefault\(\);
        e\.stopPropagation\(\);
        
        // Find the target budget from the drop target
        const targetElement = e\.target as HTMLElement;
        const targetRow = targetElement\.closest\('\[data-budget-id\]'\);
        
        if \(targetRow\) \{
            const targetBudgetId = targetRow\.getAttribute\('data-budget-id'\);
            if \(targetBudgetId && draggedBudgetId\) \{
                handleBudgetDrop\(e, targetBudgetId\);
            \}
        \}
        
        setDraggedBudgetId\(null\);
        setDraggedBudgetHeaderId\(null\);
    \}, \[draggedBudgetId, draggedBudgetHeaderId, handleBudgetDrop\]\);

    const handleBudgetDragEnd = \(\) => \{
        setDraggedBudgetId\(null\);
        setDraggedBudgetHeaderId\(null\);
    \};''',
    '''    // Dnd-kit budget drag end handler
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
    };''',
    content
)

# 8. Replace the grid section with DndContext and SortableContext
# This is complex, so we'll use a simpler approach - just replace the return statement structure

# Find and replace the Card return structure
old_grid_pattern = r'''            <div className="grid gap-4">
                \{headers\.map\(\(header\) => \{
                    const associatedBudgets = budgets\.filter\(b => b\.header === header\.id\);
                    const headerTotal = getHeaderTotal\(header\);

                    return \(
                        <Card
                            key=\{header\.id\}
                            className=\{`transition-all \${draggedHeaderId === header\.id ? 'opacity-50 scale-95' : ''} \${dragOverHeaderId === header\.id ? 'ring-2 ring-primary' : ''}`\}
                            onDragOver=\{\(e\) => handleHeaderDragOver\(e, header\.id\)\}
                            onDragLeave=\{handleHeaderDragLeave\}
                            onDrop=\{\(e\) => handleHeaderDrop\(e, header\.id\)\}
                        >'''

new_grid = '''            <DndContext onDragEnd={handleHeaderDragEnd}>
                <div className="grid gap-4">
                    <SortableContext items={headers.map(h => h.id)} strategy={verticalListSortingStrategy}>
                        {headers.map((header) => {
                            const associatedBudgets = budgets.filter(b => b.header === header.id);
                            const headerTotal = getHeaderTotal(header);

                            return (
                                <SortableHeader
                                    key={header.id}
                                    id={header.id}
                                    header={header}
                                    budgets={associatedBudgets}
                                    headerTotal={headerTotal}
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
                                />'''

content = re.sub(old_grid_pattern, new_grid, content)

# Write the result
with open('frontend/src/pages/ProjectDetail/ProjectBudgets.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated")