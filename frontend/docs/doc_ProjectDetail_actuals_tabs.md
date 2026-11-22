# Project Detail - Actuals Tabs Documentation

## Overview

The Actuals tab displays a flat list of all actual entries across a project, showing the relationship between actuals, budgets, and transactions. Users can manage actuals through filtering, sorting, drag-and-drop reordering, and bulk operations.

## Data Model

### Actual
- `id`: Unique identifier
- `name`: Actual name
- `note`: Optional note
- `amount`: Actual amount
- `type`: 'income' | 'expense' (inferred from budget)
- `tags`: Array of tag strings
- `project`: Project ID reference
- `budget`: Budget ID reference
- `exDate`: Execution date
- `assignedTo`: User ID reference
- `transaction`: Transaction ID reference (if linked to transaction)
- `active`: Boolean flag
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `updatedBy`: User ID who last updated

### Extended Model (ActualWithBudgetInfo)
- `headerName`: Name of parent header
- `headerId`: Header ID reference
- `headerOrder`: Position of header in project
- `budgetType`: 'income' | 'expense' (from budget)
- `transaction`: TransactionInfo object or undefined
- `assignedTo`: User ID
- `assignedToName`: User name string

### TransactionInfo
- `id`: Transaction ID
- `name`: Transaction name
- `amount`: Transaction amount
- `projectName`: Project name
- `project`: Project ID

## Layout Structure

```
ProjectDetail/Actuals
├── Toolbar (top)
│   ├── Selection Actions (when actuals selected)
│   │   ├── (N) sel button
│   │   │   ├── Assign to User
│   │   │   ├── Register to Transaction
│   │   │   └── Delete
│   │   └── "No actuals selected" placeholder
│   ├── Save Positions icon button
│   ├── Search inputs (Name, Tags, Header, asgTo)
│   ├── Filter Type dropdown
│   ├── Filter Sort dropdown
│   └── Total amount display
├── Actuals Table
│   ├── Table Header
│   │   ├── Checkbox (select all)
│   │   ├── Name
│   │   ├── Tags
│   │   ├── Header
│   │   ├── t (type indicator)
│   │   ├── Amount
│   │   ├── exDate
│   │   ├── asgTo
│   │   ├── trxName (transaction name)
│   │   └── trxAmount (transaction amount)
│   └── Table Body
│       └── Actual Rows (sortable)
```

## Features

### Data Loading

#### Initial Load
- Fetches headers, budgets, actuals, transactions, projects in parallel
- Loads all users (optional, silent fail on error)
- Builds projects map for display names
- Creates ActualWithBudgetInfo by enriching actuals with:
  - Header information (name, order)
  - Budget type
  - Transaction info (if linked)
  - User name for assignedTo

#### Sorting Logic
1. Primary: Header order (from project.arrHeader)
2. Secondary: Budget order (from header.arrBudget)
3. Tertiary: Created date (oldest first)

#### Project Order Override
- If project has `arrActual` defined, uses that for display order
- Actuals not in `arrActual` are appended at end
- Enables user reordering persistence

### Filtering & Search

#### Search Filters
- **Name**: Case-insensitive substring match
- **Tags**: Tags containing search term
- **Header**: Header name containing search term
- **Assigned To**: Assignee name containing search term
- All filters apply AND logic

#### Type Filter
- **All**: Show all actuals
- **Income**: Only income-type actuals
- **Expense**: Only expense-type actuals

#### Sort Filter
- **None**: Natural order (from project order or default sorting)
- **Oldest**: Sort by exDate ascending
- **Newest**: Sort by exDate descending

### Selection Actions

#### Assign to User
- **Trigger**: Select 1+ actuals, click dropdown menu
- **Modal**: Opens assign dialog with user list
- **Search**: Filter users by name
- **Selection**: Multi-select users (but applies to all selected actuals)
- **Action**: Calls `actualApi.update()` for each actual with same `assignedTo`
- **Confirmation**: None (instant assignment)
- **Result**: Toast with count of assigned actuals

#### Register to Transaction
- **Trigger**: Select 1+ actuals, click "Register to Transaction"
- **Modal**: Opens with two-column layout
- **Column 1 - Projects**: Click to select project
- **Column 2 - Transactions**: Loaded when project selected
- **Single Actual**: Direct registration
- **Multiple Actuals**: Batch registration to same transaction
- **Confirmation**: Shown when registering >1 actual
- **Action**: Calls `budgetApi.registerToTransaction()` per actual
- **Result**: Links `actual.trx` to `transaction.id`

#### Delete
- **Trigger**: Select 1+ actuals, click "Delete"
- **Condition**: Actual must not have `transaction !== undefined`
- **Validation**: Checks all selected actuals
- **Error**: Shows count of protected actuals
- **Confirmation**: `window.confirm()` with count
- **Action**: `Promise.all()` delete for all selected
- **Result**: Toast with count of deleted actuals

### Actual Management

#### View Actual Details
- **Trigger**: Click actual name
- **Action**: Navigates to `/actuals/:id` route
- **Alternative**: Opens ActualEditDialog in view mode

#### Edit Actual
- **Trigger**: Click actual name (or edit button if shown)
- **Modal**: ActualEditDialog
- **Modes**: View mode (read-only) or edit mode (form)
- **Form Fields**:
  - Name (text input)
  - Amount (formatted text input)
  - Execution Date (date picker)
  - Note (textarea)
  - Tags (comma-separated)
- **Validation**: None on save (trims strings)
- **Save Action**: Calls `actualApi.update()`
- **Cancel Action**: Closes modal without changes
- **Delete Action**: Calls `actualApi.delete()` (only in edit mode)

#### Register Actual
- **Trigger**: Via dropdown menu (not directly in Actuals tab - available from Budgets tab)
- **Modal**: ActualRegisterDialog
- **Form Fields**:
  - Name (text input, defaults to budget name)
  - Amount (formatted, defaults to budget amount)
  - Type toggle (income/expense, defaults to budget type)
  - Tags (comma-separated, defaults to budget tags)
  - Execution Date (date picker)
- **Action**: 
  1. Calls `budgetApi.registerActual()` to create
  2. Immediately updates new actual with form values
- **Result**: Creates new actual linked to budget

### Drag and Drop

#### Reorder Actuals
- **Enable**: Click and hold any actual row
- **Constraint**: Not disabled (always draggable)
- **UI**: Cursor changes to grab/move
- **Behavior**: Row lifts and follows cursor
- **Drop Target**: Row where cursor is released
- **Persistence**: Requires "Save Positions" click

#### Save Positions
- **Trigger**: Click save icon in toolbar
- **Action**: Calls `api.put(/project/${projectId}, { arrActual: order })`
- **Order**: Current displayed order (filtered actuals)
- **Result**: Saves `project.arrActual` for persistent ordering

### Transaction Connection

#### View Transaction Info
- **If linked**: Shows transaction name in primary color
- **Project link**: Clickable link to other project's transactions tab
- **If not linked**: Shows "—" in muted foreground

#### Transaction Badge
- Shows when actual is linked to transaction
- Warning: "⚠ Warning: This actual is linked to a transaction" in yellow
- Location: ActualEditDialog bottom section

## Dialogs

### ActualEditDialog

**Purpose**: View and edit actual details

**Props**:
- `isOpen`: boolean
- `onOpenChange`: (isOpen: boolean) => void
- `editActualForm`: EditActualForm
- `setEditActualForm`: React.Dispatch<React.SetStateAction<EditActualForm>>
- `onEditActual`: () => void
- `onDeleteActual?`: () => void
- `budgetName?`: string (optional)
- `transactionName?`: string (optional)
- `hasTransaction?`: boolean (optional)
- `isNew?`: boolean (optional, default false)

**States**:
- `viewMode`: boolean (true = read-only, false = edit form)

**View Mode Content**:
- Name (large, bold)
- Amount (extra large, primary color)
- Execution Date (small)
- Assigned To (with user lookup)
- Note (whitespace-pre-wrap)
- Tags (comma-separated, pill-style)
- Budget name (if provided)
- Transaction name + warning (if linked)
- Updated at / Updated by (timestamp + user)

**Edit Mode Content**:
- Name input
- Amount input (formatted)
- Execution Date input (date picker)
- Note textarea
- Tags input (comma-separated)

**Actions**:
- View Mode: "Close", "Edit" buttons
- Edit Mode: "Cancel", "Delete", "Save" buttons

### ActualRegisterDialog

**Purpose**: Register a new actual from a budget

**Props**:
- `isOpen`: boolean
- `onOpenChange`: (isOpen: boolean) => void
- `budget`: Budget
- `onRegisterActual`: (data) => Promise<void>

**State**:
- `actualName`: string (default: budget.name)
- `actualAmount`: number (default: budget.amount)
- `actualType`: 'income' | 'expense' (default: budget.type)
- `actualTags`: string (default: budget.tags joined by ', ')
- `exDate`: Date (default: new Date())

**Form Fields**:
- Name (text input)
- Amount (formatted text input)
- Type (toggle switch between income/expense)
- Tags (comma-separated input)
- Execution Date (date input)

**Registration Flow**:
1. Calls `onRegisterActual()` with budgetId, actualName, exDate, updatedBy
2. Waits for actual creation
3. Immediately updates new actual with amount, type, tags
4. Closes modal

### Register to Transaction Modal

**Purpose**: Link actual(s) to existing transaction

**State**:
- `isRegisterToTransactionModalOpen`: boolean
- `selectedProjectId`: string | null
- `allProjects`: { id, name }[]
- `transactionsForSelectedProject`: { id, name }[]
- `selectedTransactionId`: string | null
- `isLoadingTransactions`: boolean

**Layout**:
- Two-column grid
- Column 1: Projects list (clickable, highlights selection)
- Column 2: Transactions list (loaded when project selected)
- Bottom: Cancel and Register buttons

**Behavior**:
1. Open: Loads all projects
2. Click project: Sets `selectedProjectId`, loads transactions
3. Click transaction: Sets `selectedTransactionId`
4. Click Register: Iterates over selected actuals, calls API per actual
5. Confirmation: Shown only when >1 actual selected

**API Call**:
```typescript
budgetApi.registerToTransaction({
    actualId: actualId,
    transactionId: selectedTransactionId,
})
```

**Backend Action**:
1. Find actual by ID
2. Find transaction by ID
3. Set `actual.trx = transactionId`
4. Add actual to `transaction.arrActual` (if not present)
5. Add transaction to `project.arrTransaction` (if not present)
6. Return both updated entities

## Filter Functions

### filterActualsBySearch
```typescript
(actuals, searchNameTerm, searchTagTerm, searchHeaderTerm, assignToSearchTerm) => Actual[]
```
- AND logic across all search terms
- Empty string matches all
- Case-insensitive substring matching

### filterActualsByType
```typescript
(actuals, filterType: 'all' | 'income' | 'expense') => Actual[]
```
- Filters by `actual.budgetType`
- 'all' returns original array

### sortActualsByDate
```typescript
(actuals, sortByDate: 'none' | 'asc' | 'desc') => Actual[]
```
- Sorts by `actual.exDate`
- 'none' returns original array
- 'asc': oldest first
- 'desc': newest first

### calculateTotalAmount
```typescript
(actuals, selectedIds: Set<string>) => number
```
- Sums amounts of selected actuals
- Income adds positive, expense adds negative
- Returns signed total

## State Management

### Component State (ProjectActuals)
```typescript
- actuals: ActualWithBudgetInfo[]          // All actuals with enrichment
- isLoading: boolean                       // Initial data load
- isEditActualDialogOpen: boolean
- editActualForm: EditActualForm
- selectedActualIds: Set<string>
- isAssignToMenuOpen: boolean
- assignToSearchTerm: string
- allUsers: User[]
- isLoadingUsers: boolean
- selectedUsers: Set<string>
- searchNameTerm: string
- searchTagTerm: string
- searchHeaderTerm: string
- isRegisterToTransactionModalOpen: boolean
- selectedProjectId: string | null
- allProjects: { id, name }[]
- transactionsForSelectedProject: { id, name }[]
- selectedTransactionId: string | null
- isLoadingTransactions: boolean
- filterType: 'all' | 'income' | 'expense'
- sortByDate: 'none' | 'asc' | 'desc'
- isOrderDirty: boolean
```

### Derived State
```typescript
- filteredActuals: ActualWithBudgetInfo[]
  (apply filters in order: search → type → date sort)
- selectedTotalAmount: number
  (calculateTotalAmount(actuals, selectedActualIds))
```

### Sorting Logic
1. Initial sort: headerOrder → budgetOrder → createdAt
2. Project order override: if `project.arrActual` exists
3. Filtered actuals: `sortActualsByDate(filterActualsByType(filterActualsBySearch(...)))`

## Key APIs

```typescript
// Headers
headerApi.getAllByProject(projectId)

// Budgets
budgetApi.getAllByProject(projectId)
budgetApi.registerActual(formData)
budgetApi.registerToTransaction(formData)

// Actuals
actualApi.getAllByProject(projectId)
actualApi.update(id, formData)
actualApi.delete(id)

// Projects
api.get('/project')
api.put(`/project/${projectId}`, { arrActual: order })

// Transactions
transactionApi.getAll({ project: projectId })

// Users
userApi.getAll()
```

## Visual Indicators

### Type Badges
- **Income**: Green background (`bg-green-100`), green text
- **Expense**: Red background (`bg-red-100`), red text

### Status Indicators
- **Linked to Transaction**: Primary color for transaction name
- **Not Linked**: Muted "—" in muted-foreground

### Borders
- ** trxName column**: Left border (`border-l-2 border-border`)
- **Actual rows**: Bottom border (`border-b border-border`)

### Assignment Status
- **Assigned**: User name (font-medium)
- **Not Assigned**: "—" (muted-foreground)

### Sort Indicators
- **Sort: None**: Text "None"
- **Sort: Oldest**: Text "Oldest"
- **Sort: Newest**: Text "Newest"

## Data Flow

### Initial Load
```
1. useEffect(projectId, active) → loadData()
2. Parallel fetch: headers, budgets, actuals, transactions, projects
3. Build projects map
4. Map actuals → ActualWithBudgetInfo
5. Sort by: headerOrder, budgetOrder, createdAt
6. Apply project.arrActual order if present
7. setActuals()
8. setIsLoading(false)
```

### Filter Application
```
1. filterActualsBySearch(actuals, all search terms)
2. filterActualsByType(result, filterType)
3. sortActualsByDate(result, sortByDate)
4. Store in filteredActuals
```

### Selection and Bulk Action
```
1. toggleSelectActual(id) → selectedActualIds
2. User clicks dropdown action
3. Validate conditions (e.g., no transaction for delete)
4. Show confirmation if needed
5. Promise.all(map(actions))
6. Toast success
7. Reload data
```

### Drag and Drop
```
1. Drag start → store active ID
2. Drag move → highlight drop target
3. Drop → arrayMove(actuals, fromIndex, toIndex)
4. setActuals(newOrder)
5. setIsOrderDirty(true)
6. User clicks "Save Positions"
7. api.put(projectId, { arrActual: order })
8. setIsOrderDirty(false)
```

## Important Behaviors

### Transaction Linking Rules
- Actual can only be linked to one transaction
- Transaction must exist in database
- Actual cannot be deleted if linked to transaction
- Multiple actuals can link to same transaction
- Linking adds to transaction.arrActual

### Ordering Persistence
- Project maintains `arrHeader` for header order
- Header maintains `arrBudget` for budget order
- Project maintains `arrActual` for actual order
- All saved via separate API calls
- Display reverts to natural sort if `arrActual` is empty

### Silent Failures
- User loading (optional, displays "Unknown" if missing)
- Project data loading (falls back to natural sort)

### Form Validation
- Name: Trims whitespace, requires non-empty (on create)
- Amount: Parses to float, defaults to 0
- Tags: Splits by comma, trims, filters empty strings
- Execution Date: Converts to Date, defaults to today

## Known Limitations

1. **Assign to User**: Only assigns first selected user to all actuals
2. **Register to Transaction**: All selected actuals link to same transaction
3. **Delete Protection**: Cannot delete actuals linked to transactions
4. **Sorting**: Project order (`arrActual`) takes precedence, may override user expectations
5. **Bulk Delete**: No transaction protection check on bulk delete
6. **Search**: All search filters use AND logic (no OR/NOT options)