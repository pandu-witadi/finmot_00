import re

# Read the file
with open('frontend/src/pages/ProjectDetail/ProjectBudgets.tsx', 'r') as f:
    lines = f.readlines()

# Fix 1: Swap Amount and actName headers
# Find the line with actName header and swap with Amount header
for i in range(len(lines)):
    if 'actName</TableHead>' in lines[i] and 'border-l' in lines[i]:
        # Check if next line has Amount
        if i + 1 < len(lines) and 'Amount</TableHead>' in lines[i+1]:
            # Swap lines
            lines[i], lines[i+1] = lines[i+1], lines[i]
            # Add border-l to Amount header
            lines[i] = lines[i].replace('text-right w-[12.5%]">Amount</TableHead>', 'text-right w-[12.5%] border-l">Amount</TableHead>')
            print(f"Swapped headers at line {i}")
            break

# Fix 2: Add connector cell after budget Amount cell (before actName)
# Find line with }) followed by <TableCell className="w-[30%] text-left border-l">
for i in range(len(lines)):
    if '})' in lines[i] and i+1 < len(lines) and 'w-[30%] text-left border-l' in lines[i+1]:
        # Insert connector cell
        connector = [
            '                                                                                     {index === 0 && budgetActuals.length > 1 && (\n',
            '                                                                                         <TableCell rowSpan={budgetActuals.length} className="w-[1%] px-0 py-0 text-center border-r border-l">\n',
            '                                                                                             <span className="h-full w-[1px] bg-foreground block mx-auto"></span>\n',
            '                                                                                         </TableCell>\n',
            '                                                                                     )}\n',
        ]
        lines = lines[:i+1] + connector + lines[i+1:]
        print(f"Added connector at line {i}")
        break

# Fix 3: Add budget cells for actual rows (index > 0)
# Find the line with actual actName and insert budget cells before it
for i in range(len(lines)):
    if 'actual.name' in lines[i] and 'title={actual.name}' in lines[i]:
        # Insert budget cells before this cell
        budget_cells = [
            '                                                                                     {index > 0 && (\n',
            '                                                                                         <>\n',
            '                                                                                             <TableCell className="px-2 text-left">\n',
            '                                                                                                 <input\n',
            '                                                                                                     type="checkbox"\n',
            '                                                                                                     className="h-4 w-4 accent-primary"\n',
            '                                                                                                     checked={selectedBudgetIds.has(budget.id)}\n',
            '                                                                                                     onPointerDown={(e) => {\n',
            '                                                                                                         e.stopPropagation();\n',
            '                                                                                                         toggleSelectBudget(budget.id);\n',
            '                                                                                                     }}\n',
            '                                                                                                     onChange={() => {}}\n',
            '                                                                                                 />\n',
            '                                                                                             </TableCell>\n',
            '                                                                                             <TableCell className="w-[50%] px-2 text-left">\n',
            '                                                                                                 <div className="flex items-center gap-2">\n',
            '                                                                                                     <span\n',
            '                                                                                                         className="cursor-pointer hover:underline font-medium"\n',
            '                                                                                                         onClick={(e) => {\n',
            '                                                                                                             e.stopPropagation();\n',
            '                                                                                                             openEditBudget(budget);\n',
            '                                                                                                         }}\n',
            '                                                                                                         onPointerDown={(e) => {\n',
            '                                                                                                             e.stopPropagation();\n',
            '                                                                                                         }}\n',
            '                                                                                                     >\n',
            '                                                                                                         {budget.name}\n',
            '                                                                                                     </span>\n',
            '                                                                                                 </div>\n',
            '                                                                                             </TableCell>\n',
            '                                                                                             <TableCell className="w-[12.5%] px-2 text-left">\n',
            '                                                                                                 <span className={`text-xs px-2 py-0.5 rounded ${\n',
            '                                                                                                     budget.type === \'income\' ? \'bg-green-100 text-green-700\' : \'bg-red-100 text-red-700\'\n',
            '                                                                                                 }`}>\n',
            '                                                                                                     {getTypeLabel(budget.type)}\n',
            '                                                                                                 </span>\n',
            '                                                                                             </TableCell>\n',
            '                                                                                             <TableCell className="w-[12.5%] text-right border-l">\n',
            '                                                                                                 <span className="text-sm">\n',
            '                                                                                                     {formatNumber(budget.amount)}\n',
            '                                                                                                 </span>\n',
            '                                                                                             </TableCell>\n',
            '                                                                                         </>\n',
            '                                                                                     )}\n',
        ]
        lines = lines[:i] + budget_cells + lines[i:]
        print(f"Added budget cells at line {i}")
        break

# Write the fixed content
with open('frontend/src/pages/ProjectDetail/ProjectBudgets.tsx', 'w') as f:
    f.writelines(lines)

print("File updated successfully")