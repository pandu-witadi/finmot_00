# Read the file
$content = Get-Content 'frontend/src/pages/ProjectDetail/ProjectBudgets.tsx' -Raw

# Fix: Add budget cells for actual rows (index > 0)
# Find line 847 (connector closing }) and insert budget cells after it
$lines = $content -split '\r?\n'

# Find the line with the connector closing })
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\s*\}\)$' -and $lines[$i+1] -match '^\s*<TableCell className="w-\[30%\] text-left border-l">') {
        $insertIndex = $i + 1
        break
    }
}

if ($insertIndex) {
    $budgetCells = @(
        '                                                                                     {index > 0 && (',
        '                                                                                         <>',
        '                                                                                             <TableCell className="px-2 text-left">',
        '                                                                                                 <input',
        '                                                                                                     type="checkbox"',
        '                                                                                                     className="h-4 w-4 accent-primary"',
        '                                                                                                     checked={selectedBudgetIds.has(budget.id)}',
        '                                                                                                     onPointerDown={(e) => {',
        '                                                                                                         e.stopPropagation();',
        '                                                                                                         toggleSelectBudget(budget.id);',
        '                                                                                                     }}',
        '                                                                                                     onChange={() => {}}',
        '                                                                                                 />',
        '                                                                                             </TableCell>',
        '                                                                                             <TableCell className="w-[50%] px-2 text-left">',
        '                                                                                                 <div className="flex items-center gap-2">',
        '                                                                                                     <span',
        '                                                                                                         className="cursor-pointer hover:underline font-medium"',
        '                                                                                                         onClick={(e) => {',
        '                                                                                                             e.stopPropagation();',
        '                                                                                                             openEditBudget(budget);',
        '                                                                                                         }}',
        '                                                                                                         onPointerDown={(e) => {',
        '                                                                                                             e.stopPropagation();',
        '                                                                                                         }}',
        '                                                                                                     >',
        '                                                                                                         {budget.name}',
        '                                                                                                     </span>',
        '                                                                                                 </div>',
        '                                                                                             </TableCell>',
        '                                                                                             <TableCell className="w-[12.5%] px-2 text-left">',
        '                                                                                                 <span className={`text-xs px-2 py-0.5 rounded {`$`(`$budget.type === `\"income`\" ? `\"bg-green-100 text-green-700`\" : `\"bg-red-100 text-red-700`\"`)`}>',
        '                                                                                                     {getTypeLabel(budget.type)}',
        '                                                                                                 </span>',
        '                                                                                             </TableCell>',
        '                                                                                             <TableCell className="w-[12.5%] text-right border-l">',
        '                                                                                                 <span className="text-sm">',
        '                                                                                                     {formatNumber(budget.amount)}',
        '                                                                                                 </span>',
        '                                                                                             </TableCell>',
        '                                                                                         </>',
        '                                                                                     )}'
    )
    
    $lines = $lines[0..($insertIndex-1)] + $budgetCells + $lines[$insertIndex..($lines.Length-1)]
    $content = $lines -join "`r`n"
}

# Write the fixed content
Set-Content 'frontend/src/pages/ProjectDetail/ProjectBudgets.tsx' -Value $content

echo "Step 3 done"