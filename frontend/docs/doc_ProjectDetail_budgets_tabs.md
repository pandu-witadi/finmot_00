# Project Detail - Budgets Tabs Documentation

## Overview

The Budgets tab displays a hierarchical structure of budget headers and their associated budgets within a project. Users can manage headers, budgets, and their associated actuals through a drag-and-drop interface.

## Data Model

### Header
- `id`: Unique identifier
- `name`: Header name
- `type`: 'income' | 'expense'
- `tags`: Array of tag strings
- `project`: Project ID reference
- `done`: Boolean flag
- `arrBudget`: Ordered array of budget IDs

### Budget
- `id`: Unique identifier
- `name`: Budget name
- `note`: Optional note
- `type`: 'income' | 'expense'
- `amount`: Budgeted amount
- `tags`: Array of tag strings
- `project`: Project ID reference
- `header`: Header ID reference
- `done`: Boolean flag
- `arrActual`: Ordered array of actual IDs

### Actual
- `id`: Unique identifier
- `name`: Actual name
- `note`: Optional note
- `type`: 'income' | 'expense'
- `amount`: Actual amount
- `tags`: Array of tag strings
- `project`: Project ID reference
- `budget`: Budget ID reference
- `exDate`: Execution date
- `assignedTo`: User ID reference
- `transaction`: Transaction ID reference (if registered)

## Layout Structure

```
ProjectDetail/Budgets
├── Toolbar (top)
│   ├── Add Header button
│   └── Save Header Positions icon button
├── Header Cards (expandable)
│   ├── Card Header (draggable when collapsed)
│   │   ├── Chevron (expand/collapse)
│   │   ├── Header Name (clickable to edit)
│   │   ├── Type Badge (green/red)
│   │   ├── Total (formatted number)
│   │   ├── Selection Actions (when budgets selected)
│   │   │   ├── Register Actual button
│   │   │   ├── Delete button
│   │   │   └── "N selected" count
│   │   ├── Add Budget icon button (+)
│   │   ├── Save Budget Positions icon button
│   │   └── Delete Header icon button
│   └── Card Content (table when expanded)
│       └── Budget Table
│           ├── Table Header
│           │   ├── Checkbox (select all)
│           │   ├── Name
│           │   ├── Tags
│           │   ├── Stat (type indicator + done status)
│           │   ├── Amount
│           │   ├── actName
│           │   ├── actAmount
│           │   └── actDate
│           └── Table Body
│               └── Budget Rows (sortable)
```

## Features

### Header Management

#### Add Header
- **Trigger**: Click "Add Header" button in toolbar
- **Action**: Opens HeaderAddDialog
- **Form Fields**:
  - Name (required)
  - Type (income/expense)
  - Tags (comma-separated)
- **Result**: Creates new header with `done: false`

#### Edit Header
- **Trigger**: Click header name
- **Action**: Opens HeaderEditDialog
- **Form Fields**: Same as Add Header
- **Result**: Updates header details

#### Delete Header
- **Trigger**: Click delete icon in header card
- **Condition**: Header must have no budgets
- **Result**: Removes header from project

#### Save Header Positions
- **Trigger**: Click save icon in toolbar
- **Action**: Persists `arrHeader` order to project
- **UI**: Toast success message

### Budget Management

#### Add Budget
- **Trigger**: Click "+" icon in header card
- **Condition**: Requires selected header
- **Action**: Opens BudgetAddDialog
- **Form Fields**:
  - Name (required)
  - Note
  - Type (income/expense)
  - Amount
  - Tags (comma-separated)
- **Result**: Creates budget linked to header

#### Edit Budget
- **Trigger**: Click budget name
- **Action**: Opens BudgetEditDialog
- **Form Fields**: Same as Add Budget
- **Result**: Updates budget details

#### Delete Budget
- **Trigger**: Via dropdown menu (requires selection)
- **Condition**: Budget must have no actuals
- **Result**: Removes budget from header

#### Save Budget Positions
- **Trigger**: Click save icon in header card
- **Action**: Persists `arrBudget` order to header
- **UI**: Toast success message

### Budget Rows

#### Row Types

**Empty State (no actuals)**:
- Checkbox
- Budget Name (clickable to edit)
- Tags (or "—" if empty)
- Stat: Type badge + Square (undone) or CheckSquare (done)
- Amount (formatted)
- actName: "—"
- actAmount: "—"
- actDate: "—" (bottom border visible)

**With Actuals**:
- Shared cells (rowSpan): All budget info except actual columns
- Actual rows:
  - actName: Actual name (clickable, shows tooltip)
  - actAmount: Formatted number
  - actDate: Formatted date or "-"

#### Table Header Columns

| Column | Width | Content |
|--------|-------|---------|
| Checkbox | 10% | Select all toggle |
| Name | 35% | Budget name |
| Tags | 18% | Tags array |
| Stat | 12% | Type + done status |
| Amount | 9% | Budgeted amount (right-aligned) |
| actName | 28% | Actual name (left-aligned) |
| actAmount | 10% | Actual amount (right-aligned) |
| actDate | 11% | Actual date (left-aligned) |

### Actual Registration

#### Register Actual
- **Trigger**: Select 1+ budgets, click dropdown menu
- **Single Budget**: Opens ActualRegisterDialog
- **Multiple Budgets**: Confirms with date picker
- **Form Fields**:
  - Execution Date
- **Result**: Creates actual linked to budget

#### Edit Actual
- **Trigger**: Click actual name in table
- **Action**: Navigates to `/actuals/:id` page
- **Alternative**: Opens ActualEditDialog (inline edit)

#### Delete Actual
- **Trigger**: Via dropdown menu (requires selection)
- **Condition**: Actual must not be linked to transaction
- **Result**: Removes actual from budget

### Transaction Connection

#### Register to Transaction
- **Trigger**: Select actual(s), click "Register to Transaction" from dropdown
- **Action**: Opens modal with projects/transactions selection
- **Selection Flow**:
  1. Select project
  2. Load transactions for project
  3. Select transaction
- **Single Actual**: Direct registration
- **Multiple Actuals**: Batch registration (same transaction)
- **Confirmation**: Shown for multiple actuals
- **Result**: Links actual.transaction to transaction.id

### Drag and Drop

#### Header Reordering
- **Enable**: Click and hold header card
- **Constraint**: Disabled when header is expanded
- **Persistence**: Requires "Save Header Positions"

#### Budget Reordering
- **Enable**: Click and hold budget row
- **Constraint**: First actual row only (when actuals exist)
- **Persistence**: Requires "Save Budget Positions" per header

## Dialogs

### HeaderAddDialog
- **State**: `isAddHeaderDialogOpen`
- **Form**: `headerForm`
- **API**: `headerApi.create()`

### HeaderEditDialog
- **State**: `isEditHeaderDialogOpen`
- **Form**: `editHeaderForm`
- **API**: `headerApi.update()`

### BudgetAddDialog
- **State**: `isAddBudgetDialogOpen`
- **Form**: `budgetForm`
- **API**: `budgetApi.create()`

### BudgetEditDialog
- **State**: `isEditBudgetDialogOpen`
- **Form**: `editBudgetForm`
- **API**: `budgetApi.update()`

### ActualEditDialog
- **State**: `isEditActualDialogOpen`
- **Form**: `editActualForm`
- **API**: `actualApi.update()`, `actualApi.delete()`

### ActualRegisterDialog
- **State**: `isRegisterActualDialogOpen`
- **Form**: Budget reference + execution date
- **API**: `budgetApi.registerActual()`

### Register to Transaction Modal
- **State**: `isRegisterToTransactionModalOpen`
- **Columns**:
  - Projects list (click to select)
  - Transactions list (loaded when project selected)
- **Selected**: `selectedProjectId`, `selectedTransactionId`
- **Action**: `handleRegisterSelectedToTransaction()`
- **API**: `budgetApi.registerToTransaction()` (per actual)

## State Management

### Component State
- `headers`: Header[]
- `budgets`: Budget[]
- `actuals`: {[budgetId]: Actual[]}
- `isLoading`: boolean
- Selection states for headers, budgets, actuals
- Dialog open states
- Form states

### Data Loading
- Fetches headers, budgets, actuals, transactions, projects in parallel
- Loads users for assignment (optional, silent fail)
- Maps budget/hierarchy relationships
- Sorts by header order, budget order, creation date

## Visual Indicators

### Type Badges
- **Income**: Green background (`bg-green-100`)
- **Expense**: Red background (`bg-red-100`)

### Done Status
- **Done**: Green checkmark icon (CheckSquare filled)
- **Not Done**: Red empty square icon (Square)

### Actual Status
- **With Actual**: Primary color, linked name
- **No Actual**: Muted "—"

### Borders
- **actName column**: Left border (`border-l-2 border-border`)
- **Actual rows**: Bottom border between rows, last row bottom border

## Toolbar Actions

| Button | Icon | Function |
|--------|------|----------|
| Add Header | - | Create new budget header |
| Save Positions | Save icon | Persist header order |
| Filter Type | Chevron | Filter by income/expense |
| Filter Sort | Chevron | Sort by date |
| Search Name | Text input | Filter by name |
| Search Tags | Text input | Filter by tags |
| Search Header | Text input | Filter by header name |
| Search Assigned | Text input | Filter by assignee |

## Selection Actions (when items selected)

| Action | Condition | Behavior |
|--------|-----------|----------|
| Assign to User | 1+ selected | Opens assign modal |
| Register to Transaction | 1+ selected | Opens transaction modal |
| Delete | 1+ selected | Deletes with confirmation |

## Key APIs

```typescript
// Headers
headerApi.getAllByProject(projectId)
headerApi.create(formData)
headerApi.update(id, formData)
headerApi.delete(id)

// Budgets
budgetApi.getAllByProject(projectId)
budgetApi.create(formData)
budgetApi.update(id, formData)
budgetApi.delete(id)
budgetApi.registerActual(formData)
budgetApi.registerToTransaction(formData)

// Actuals
actualApi.getAllByProject(projectId)
actualApi.update(id, formData)
actualApi.delete(id)

// Projects
projectApi.update(projectId, { arrHeader: order })

// Transactions
transactionApi.getAll({ project: projectId })
```