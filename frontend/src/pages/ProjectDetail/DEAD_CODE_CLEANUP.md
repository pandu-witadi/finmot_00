# Dead Code Analysis and Cleanup Summary

## Files Deleted

### 1. SharedDialogs.tsx (dead code)
- **Location**: `frontend/src/pages/ProjectDetail/components/SharedDialogs.tsx`
- **Reason**: Not imported by any file in the codebase
- **Content**: Had duplicate `BudgetEditDialog` and `ActualEditDialog` components that were not used

### 2. actuals-types.ts (dead code)
- **Location**: `frontend/src/pages/ProjectDetail/actuals-types.ts`
- **Reason**: Not imported by any file in the codebase
- **Content**: Defined `TransactionInfo` and `User` types (duplicates)

### 3. actuals-transactions.ts (dead code)
- **Location**: `frontend/src/pages/ProjectDetail/actuals-transactions.ts`
- **Reason**: Not imported by any file in the codebase
- **Content**: Had `loadTransactionsForProject` and `resetRegisterToTransactionState` functions

### 4. TransactionDetailDialog.tsx (dead code)
- **Location**: `frontend/src/pages/ProjectDetail/TransactionDetailDialog.tsx`
- **Reason**: Not imported by any file in the codebase
- **Content**: Transaction detail dialog component

### 5. HeaderRow.tsx (dead code)
- **Location**: `frontend/src/pages/ProjectDetail/components/HeaderRow.tsx`
- **Reason**: Not imported by TabBudgets (has inline `renderHeader` and `BudgetTable`)
- **Content**: Header row component for budget tables

### 6. BudgetRow.tsx (dead code)
- **Location**: `frontend/src/pages/ProjectDetail/components/BudgetRow.tsx`
- **Reason**: Only used by HeaderRow which was not used
- **Content**: Budget row component with actuals support

## Files Modified

### 1. actuals-users.ts
- **Location**: `frontend/src/pages/ProjectDetail/actuals-users.ts`
- **Change**: Removed `toggleUserSelection` function (dead code - never called)
- **Preserved**: `filterUsers` function (used by TabActuals)

## Files Created

### 1. ProjectActuals.ts
- **Location**: `frontend/src/pages/ProjectDetail/ProjectActuals.ts`
- **Reason**: Missing dependency for `actuals-filters.ts` and `actuals-users.ts`
- **Content**: Defines `User` and `ActualWithBudgetInfo` types

## Files Restored (from deleted folder)

### 1. components/TypeBadge.tsx
- **Location**: `frontend/src/pages/ProjectDetail/components/TypeBadge.tsx`
- **Reason**: TabBudgets, TabActuals, and TabTransactions all use this component

### 2. components/DoneBadge.tsx
- **Location**: `frontend/src/pages/ProjectDetail/components/DoneBadge.tsx`
- **Reason**: TabBudgets, TabActuals, and TabTransactions all use this component

## Files Cleaned

### 1. TabTransactions.tsx.backup
- **Location**: `frontend/src/pages/ProjectDetail/TabTransactions.tsx.backup`
- **Action**: Deleted (backup file no longer needed)

## Dependency Graph (After Cleanup)

```
TabBudgets.tsx
├── HeaderAddDialog.tsx ✓
├── BudgetAddDialog.tsx ✓
├── HeaderEditDialog.tsx ✓
├── BudgetEditDialog.tsx ✓
├── ActualEditDialog.tsx ✓
├── ActualRegisterDialog.tsx ✓
├── useBudgetHeaders.ts ✓
├── useBudgets.ts ✓
├── types.ts ✓
├── components/TypeBadge.tsx ✓
├── components/DoneBadge.tsx ✓

TabActuals.tsx
├── useActuals.ts ✓
├── useTransactions.ts ✓
├── ActualEditDialog.tsx ✓
├── types.ts ✓
├── actuals-filters.ts ✓
├── actuals-users.ts ✓
├── components/TypeBadge.tsx ✓
├── components/DoneBadge.tsx ✓
├── ProjectActuals.ts ✓ (new)

TabTransactions.tsx
├── useTransactions.ts ✓
├── types.ts ✓
├── components/TypeBadge.tsx ✓
├── components/DoneBadge.tsx ✓

actuals-filters.ts
├── ProjectActuals.ts ✓ (new)

actuals-users.ts
├── ProjectActuals.ts ✓ (new)

ProjectActuals.ts (NEW)
└── Shared types for actuals filtering
```

## Verification

All imports in TabBudgets, TabActuals, and TabTransactions are now resolved. The files reference only:
1. Components that exist
2. Types that exist
3. Functions that are actually used

No dead code remains in the three tab files or their direct dependencies.