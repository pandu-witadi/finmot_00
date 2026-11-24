# Database Flow Rules


## Headers

### Create Header
- Header is created with a project reference
- Header ID is pushed to project.arrHeader
- Header ID is NOT pushed to any parent (headers have no parent container)
- Defaultorder is 0, ormax(order) + 1 for the project

### Delete Header
- Header ID is pulled from project.arrHeader
- Header can only be deleted if header.arrBudget.length === 0
- Error thrown: "Cannot delete header. X budget(s) still reference this header. Please remove them first."
- If validation passes, header is deleted


## Budgets

### Create Budget
- Budget is created withproject and header references
- Budget ID is pushed to project.arrBudget
- Budget ID is pushed to header.arrBudget
- Default done is false

### Delete Budget
- Budget ID is pulled from header.arrBudget
- Budget ID is pulled from project.arrBudget
- Budget can only be deleted if arrActual.length === 0
- Error thrown: "Cannot delete budget. X actual(s) are registered. Please delete or unassign them first."
- If validation passes, budget is deleted


## Actuals (Linked to Budgets)

### Register Actual from Budget
- Actual is created with budget reference
- Actual ID is pushed to budget.arrActual
- Actual ID is pushed to project.arrActual
- default done is false

### Delete Actual
- Actual ID is pulled from budget.arrActual (if budget exists)
- Actual ID is pulled from project.arrActual
- Actual can only be deleted if transaction === null (no transaction)
- Error thrown: "Cannot delete actual: a transaction is connected to it. Remove the transaction connection first."
- If validation passes, actual is deleted


## Transactions (Linked to Actuals)

### Register Actual to Transaction
- Actual trx field is set to transaction ID
- Actual ID is pushed to transaction.arrActual
- Actual ID is pushed to project.arrTransaction

### Clone Actual to Transaction
- New transaction is created with project reference
- New transaction ID is pushed to project.arrTransaction
- Actual trx field is set to new transaction ID
- Actual ID is pushed to transaction.arrActual




## Validation Summary

| Operation     | Guard Condition                      | Error Message                                                                                      |
|---------------|--------------------------------------|----------------------------------------------------------------------------------------------------|
| Delete Header |arrBudget.length === 0             | "Cannot delete header. X budget(s) still reference this header. Please remove them first."         |
| Delete Budget |arrActual.length === 0             | "Cannot delete budget. X actual(s) are registered. Please delete or unassign them first."          |
| Delete Actual |transaction === null | "Cannot delete actual: a transaction is connected to it. Remove the transaction connection first." |

## Project Array References

| Project Array    | References      |
|------------------|-----------------|
|arrHeader      | Header IDs      |
|arrBudget      | Budget IDs      |
|arrActual      | Actual IDs      |
|arrTransaction | Transaction IDs |

