# Project Detail - Transactions Tab

## Overview

Displays all transactions for a specific project. Shows transaction details including name, type, amount, date, assigned user, and linked actuals. Supports filtering, sorting, drag-and-drop reordering, bulk operations, and batch assignments.

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Card Container                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Header Bar                                                        │  │
│  │ ┌──────────────────┐  ┌────┐  ┌──────┐  ┌─────────┐  ┌─────┐      │  │
│  │ │ (n) sel ▼        │  │ +  │  │ save │  │ Name    │  │ Type│      │  │
│  │ └──────────────────┘  └────┘  └──────┘  └─────────┘  └─────┘      │  │
│  │ ┌──────┐  ┌──────┐  ┌──────┐  ┌─────────────┐                     │  │
│  │ │ Tags │  │ asgTo│  │search│  │ Sort: None  │  Total: 0.00        │  │
│  │ └──────┘  └──────┘  └──────┘  └─────────────┘                     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Table                                                             │  │
│  │ ┌────┬─────┬─────┬───┬─────┬─────┬─────┬─────────────────────┐    │  │
│  │ │ [] │Name │Tags │t  │Amt  │exD  │asg  │actual               │    │  │
│  │ ├────┼─────┼─────┼───┼─────┼─────┼─────┼─────────────────────┤    │  │
│  │ │ [] │...  │...  │...│...  │...  │...  │...                  │    │  │
│  │ └────┴─────┴─────┴───┴─────┴─────┴─────┴─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Table Columns

|------------------------------------------------------------------------------|
| Column | Width | Content  | Description                                      |
|--------|-------|----------|--------------------------------------------------|
| []     | 5%    | Checkbox | Select row for bulk operations                   |
| Name   | 25%   | Text     | Transaction name, clickable to view details      |
| Tags   | 12%   | Tags     | Comma-separated tags associated with transaction |
| t      | 4%    | Badge    | Type indicator (Income/Expense)                  |
| Amount | 13%   | Number   | Transaction amount                               |
| exDate | 6%    | Date     | Execution date                                   |
| asgTo  | 9%    | User     | Assigned user name                               |
| actual | 25%   | Actuals  | Linked actuals with project links                |
|------------------------------------------------------------------------------|

## Header Bar Components

### Selection Toolbar (shown when items selected)

**Button: (n) sel ▼**
- Shows count of selected transactions
- Dropdown menu with:
  - **Assign to User**: Open assignment dialog
  - **Delete**: Remove selected transactions

### Actions

**Button: + (Add)**
- Opens "Add Transaction" modal dialog
- Creates new transaction for current project

**Button: Save (floppy icon)**
- Saves current transaction order (drag-and-drop positions)
- Calls `/api/transaction/bulk-position` with project ID and ordered transaction IDs

**Input: Name**
- Filter transactions by name (partial match, case-insensitive)
- Real-time filtering as user types

**Input: Tags**
- Filter transactions by tags (partial match, case-insensitive)
- Matches any tag in transaction's tag array

**Input: asgTo**
- Filter transactions by assigned user name (partial match, case-insensitive)
- Searches user name field

**Dropdown: Type**
- Filter by transaction type
- Options: All, Income, Expense
- Shows current filter in button text

**Dropdown: Sort**
- Sort transactions by execution date
- Options: None, Oldest, Newest
- None = default backend order
- Oldest = ascending date order
- Newest = descending date order

**Total Display**
- Shows sum of selected transaction amounts
- Income adds positively, expense subtracts
- Only considers currently selected transactions

## Modal Dialogs

### Add Transaction Dialog

**Title**: "Add Transaction"

**Fields**:
1. **Name** (required)
   - Text input
   - Transaction name
   - Cannot be empty

2. **Type** (required)
   - Radio-style buttons (Income/Expense)
   - One must be selected

3. **Amount** (required)
   - Number input
   - Minimum: 0
   - Step: 0.01

4. **Tags**
   - Text input
   - Comma-separated values
   - Stored as array

5. **Active**
   - Checkbox
   - Default: checked

6. **Date** (required)
   - Date picker (YYYY-MM-DD)
   - Default: today

**Buttons**:
- Cancel: Close dialog without saving
- Create Transaction: Submit form

### Assign to User Dialog

**Title**: "Assign to User"

**Description**: Shows count of selected transactions

**Search**: User search input (name or email)

**User List**:
- Scrollable list of all users
- Checkbox selection for each user
- Shows: user name and email
- Filtered by search term

**Buttons**:
- Cancel: Close dialog without assigning
- Assign (n selected): Apply assignment to all selected transactions

## Features

### Bulk Selection

- Click checkbox in table header to toggle all rows
- Click individual row checkboxes to select specific transactions
- Visual indication: rows are highlighted when selected
- Selected count shown in header toolbar

### Drag and Drop Reordering

- Drag rows by clicking and holding any part of the row
- Visual feedback: cursor changes to move icon
- Drop row in new position
- Changes are实时 reflected in display order
- Click "Save" button to persist positions to backend

### Filtering

**Name Filter**:
- Partial string match
- Case-insensitive
- Searches transaction.name field

**Tags Filter**:
- Partial string match
- Case-insensitive
- Searches all tags in transaction.tags array
- Matches if any tag contains search term

**Assigned To Filter**:
- Partial string match
- Case-insensitive
- Searches assigned user's name field
- Uses user lookup by ID

**Type Filter**:
- Exact match on transaction type
- Options: all, income, expense

**Combined Behavior**:
- All filters work together (AND logic)
- Each filter reduces the result set

### Sorting

**Date Sort**:
- None: Default backend sort order
- Oldest: Ascending by execution date
- Newest: Descending by execution date
- Empty dates sorted to end

### Bulk Operations

**Delete Selected**:
- Removes all selected transactions
- Confirmation required before deletion
- Shows toast on success/failure
- Clears selection after successful deletion

**Assign Selected**:
- Assigns all selected transactions to chosen user(s)
- Single user selection only
- Confirmation required
- Shows toast on success/failure
- Clears selection after successful assignment

### Linking to Actuals

Each transaction shows linked actuals in the "actual" column:
- Shows count of linked actuals
- For each actual:
  - Actual name (bold)
  - Actual amount
  - Project link (clickable, opens project with actuals tab)
- Link color indicates if actuals are present
- Link text shows project name where actual belongs

### Date Handling

- Displays formatted dates
- Empty dates shown as "—"
- Sort handles empty dates (sorted to end)
- Default date for new transactions is today

### Type Indicators

- Income: Green background, green text
- Expense: Red background, red text
- Badge style with rounded corners

### User Assignment Display

- Shows assigned user's name
- "—" shown when no user assigned
- "Unknown" shown when user ID not found in user list
- Links to user details page (navigate to `/users/:userId`)

## State Management

### Local State

- `transactions`: Array of transaction objects
- `selectedTransactionIds`: Set of selected transaction IDs
- `searchNameTerm`, `searchTagTerm`, `searchAssignedTerm`: Filter strings
- `filterType`: Current type filter
- `sortByExDate`: Current sort preference
- `isAddDialogOpen`, `isAssignToMenuOpen`: Modal visibility flags
- `form`: Current form state for new transaction
- `users`: All users from API
- `allProjects`: All projects from API
- `allActuals`: All actuals from API

### Derived State

- `filteredTransactions`: Transactions matching all filters
- `filteredAndSortedTransactions`: Filtered + sorted for display
- `transactionActualsMap`: Map of transaction ID to array of linked actuals
- `selectedTotalAmount`: Sum of selected transaction amounts

## Data Flow

### Loading

1. Component mounts
2. Parallel API calls:
   - `/api/transaction` (via useTransactions hook)
   - `/api/user` (get all users)
   - `/api/project` (get all projects)
   - `/api/actual` (get all actuals)
3. Load all data into respective state variables
4. Build transactionActualsMap for display

### Creating Transaction

1. Click "+" button
2. Modal opens with empty form
3. User fills in required fields
4. Click "Create Transaction"
5. Validate name is not empty
6. Call `createTransaction` with form data
7. Close modal and reset form on success
8. Toast success/error message

### Deleting Transactions

1. Select one or more transactions
2. Click "(n) sel" button
3. Click "Delete" in dropdown
4. Confirm dialog
5. Delete all selected transactions in parallel
6. Clear selection
7. Toast success/error message

### Assigning Transactions

1. Select one or more transactions
2. Click "(n) sel" button
3. Click "Assign to User" in dropdown
4. User selection dialog opens
5. Select user(s) from list
6. Click "Assign (n selected)"
7. Confirm dialog
8. Assign all selected transactions to chosen user
9. Clear selection
10. Toast success/error message

### Reordering Transactions

1. Drag row by clicking and holding
2. Visual feedback: cursor changes
3. Drop row in new position
4. Table updates immediately
5. Click "Save" button to persist
6. Call `/api/transaction/bulk-position` with ordered IDs
7. Toast success/error message

## API Integration

### Transaction API (via useTransactions hook)

- `getTransactions(projectId)`: Fetch transactions for project
- `createTransaction(data)`: Create new transaction
- `updateTransaction(id, data)`: Update transaction
- `deleteTransaction(id)`: Delete transaction

### Transaction API (direct calls)

- `updateBulkPosition(projectId, orderedIds)`: Save position order

### User API

- `getAll()`: Get all users

### Project API

- `get('/project')`: Get all projects

### Actual API

- `get('/actual')`: Get all actuals

## Error Handling

- Toast notifications for all errors
- Failed operations logged to console
- User feedback for:
  - Validation errors (e.g., missing name)
  - Network errors
  - Server errors
  - Success confirmations

## Keyboard Navigation

- No explicit keyboard shortcuts defined
- Standard browser behavior:
  - Tab through interactive elements
  - Space to toggle checkboxes
  - Enter to activate buttons

## Responsive Behavior

- Table uses `table-fixed` class for column width control
- Header elements use flexbox for wrapping
- Modal dialogs are centered and scrollable
- Mobile: Table may require horizontal scroll

## Performance Considerations

- Use `SortableContext` for drag-and-drop optimization
- Filter after loading all data (client-side filtering)
- Parallel API calls for initial data load
- Memoization available but not currently implemented
- Large datasets: consider virtual scrolling

## Known Limitations

1. Assign to User only allows one user selection (not multiple)
2. Filter search is case-insensitive but not fuzzy
3. No pagination (loads all transactions at once)
4. Drag-and-drop requires save to persist
5. No undo for delete or assign operations