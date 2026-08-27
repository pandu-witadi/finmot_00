# Separate APIs Implementation - Before and After

## Overview
This document shows the changes made to simplify data flow by creating separate APIs for different user data updates.

---

## BEFORE: Single API for All Updates

### Backend (Original)

**Single endpoint**: `PUT /user/:id`
- All user data (main info, bank info, deposits) sent in one request
- Controller `updateUser` handled all fields with complex conditional logic
- Frontend had one `handleSubmit` that validated and sent everything at once

**Controller Logic** (simplified):
```typescript
export async function updateUser(id: string, body: UpdateUserRequest) {
    const updateFields: any = {};
    
    // All fields handled together
    if (body.email !== undefined && body.email !== "") updateFields.email = body.email;
    if (body.password && body.password.trim() !== "") updateFields.password = await hashPassword(body.password.trim());
    if (body.name !== undefined && body.name !== "") updateFields.name = body.name;
    if (body.role !== undefined) updateFields.role = body.role;
    if (body.bankInfo !== undefined) updateFields.bankInfo = body.bankInfo;
    if (body.deposit !== undefined) updateFields.deposit = { ... };
    
    // ... save to database
}
```

**API Service** (Original):
```typescript
export const userApi = {
    update: (id: string, data: any) => api.put(`/user/${id}`, data),
    // ... other methods
};
```

### Frontend (Original)

**Single submit handler**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ALL fields (main info, bank info, deposits)
    userSchema.parse(formData);
    finalBankInfo.forEach(bank => bankInfoSchema.parse(bank));
    finalDeposits.forEach(deposit => depositEntrySchema.parse(deposit));
    
    // Send everything at once
    await userApi.update(id, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        bankInfo: finalBankInfo,
        deposit: { detail: finalDeposits },
    });
};
```

**Problems with this approach**:
1. **Tight coupling** - All data types updated together
2. **Inefficient** - Sending unnecessary data when only one section changes
3. **Complex validation** - All validations run even when only one tab is modified
4. **Error handling** - Hard to pinpoint which section failed
5. **Poor user experience** - Cannot save bank info without touching deposits

---

## AFTER: Separate APIs for Each Data Type

### Backend (New)

**Three new dedicated endpoints**:
```
PUT /user/:id/info     → Update main info (email, password, name, role)
PUT /user/:id/bank     → Update bank information
PUT /user/:id/deposit  → Update deposit information
```

**Controller Logic** (separate functions):
```typescript
// 1. Update main info only
export async function updateUserMainInfo(id: string, body: UpdateUserMainInfoRequest) {
    const updateFields: any = {};
    if (body.email !== undefined && body.email !== "") updateFields.email = body.email;
    if (body.password && body.password.trim() !== "") updateFields.password = await hashPassword(body.password.trim());
    if (body.name !== undefined && body.name !== "") updateFields.name = body.name;
    if (body.role !== undefined) updateFields.role = body.role;
    // ... save to database
}

// 2. Update bank info only
export async function updateUserBankInfo(id: string, body: UpdateUserBankInfoRequest) {
    const updateFields: any = { bankInfo: body.bankInfo };
    // ... save to database
}

// 3. Update deposit info only
export async function updateUserDeposit(id: string, body: UpdateUserDepositRequest) {
    const updateFields: any = {
        deposit: {
            total: calculateDepositTotal(body.detail),
            detail: body.detail,
        }
    };
    // ... save to database
}
```

**API Routes** (New):
```typescript
// Update main info (email, password, name, role)
app.put('/user/:id/info', async (request, reply) => {
    const user = await updateUserMainInfo(request.params.id, request.body);
    // ...
});

// Update bank information
app.put('/user/:id/bank', async (request, reply) => {
    const user = await updateUserBankInfo(request.params.id, request.body);
    // ...
});

// Update deposit information
app.put('/user/:id/deposit', async (request, reply) => {
    const user = await updateUserDeposit(request.params.id, request.body);
    // ...
});
```

### Frontend (New)

**API Service** (Updated):
```typescript
export const userApi = {
    update: (id: string, data: any) => api.put(`/user/${id}`, data),  // Keep for backward compatibility
    
    // NEW: Separate methods for each data type
    updateMainInfo: (id: string, data: any) => api.put(`/user/${id}/info`, data),
    updateBankInfo: (id: string, data: any) => api.put(`/user/${id}/bank`, data),
    updateDeposit: (id: string, data: any) => api.put(`/user/${id}/deposit`, data),
};
```

**Frontend Save Handlers** (New):
```typescript
// 1. Main info save handler
const handleMainInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ONLY main info fields
    const { email, password, name, role } = formData;
    userSchema.parse({ email, password, name, role });
    
    // Send ONLY main info
    await userApi.updateMainInfo(id, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
    });
    
    toast.success("Main information updated successfully");
};

// 2. Bank info save handler
const handleBankInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ONLY bank info
    finalBankInfo.forEach(bank => bankInfoSchema.parse(bank));
    
    // Send ONLY bank info
    await userApi.updateBankInfo(id, { bankInfo: finalBankInfo });
    
    toast.success("Bank information updated successfully");
};

// 3. Deposit info save handler
const handleDepositInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ONLY deposits
    deposits.forEach(deposit => depositEntrySchema.parse(deposit));
    
    // Send ONLY deposits
    await userApi.updateDeposit(id, { detail: deposits });
    
    toast.success("Deposit information updated successfully");
};
```

**Tab Buttons** (Updated):
```tsx
// Main Info Tab - uses handleMainInfoSave
<Button onClick={handleMainInfoSave}>Update Main Info</Button>

// Bank Info Tab - uses handleBankInfoSave  
<Button onClick={handleBankInfoSave}>Save Bank Information</Button>

// Deposit Info Tab - uses handleDepositInfoSave
<Button onClick={handleDepositInfoSave}>Save Deposit Information</Button>
```

---

## Benefits of the New Approach

### 1. **Separation of Concerns**
- Each API handles one specific data type
- Clear boundaries between different concerns
- Easier to understand and maintain

### 2. **Efficiency**
- Only sends data that's actually changing
- Reduces network payload size
- Database updates are more targeted

### 3. **Simplified Validation**
- Each save handler validates only relevant fields
- No complex conditional validation logic
- Clearer error messages for each section

### 4. **Better Error Handling**
- Errors are scoped to specific data types
- Easier to debug and fix issues
- Better user feedback (which section failed?)

### 5. **Improved User Experience**
- Users can save bank info without touching deposits
- Independent control over each data section
- Clearer feedback about what was updated

### 6. **Backward Compatibility**
- Original `update` endpoint still available
- Existing functionality preserved
- Gradual migration path

---

## API Endpoint Summary

| Endpoint | Purpose | Data Sent |
|----------|---------|-----------|
| `PUT /user/:id` | Full update (legacy) | All user data |
| `PUT /user/:id/info` | Main info only | email, password, name, role |
| `PUT /user/:id/bank` | Bank info only | bankInfo array |
| `PUT /user/:id/deposit` | Deposit info only | deposit.detail array |

---

## Files Modified

### Backend
1. `backend/src/controller/user.ts` - Added 3 new update functions
2. `backend/src/api/user.ts` - Added 3 new routes
3. `backend/src/model/user.ts` - No changes (schema unchanged)

### Frontend
1. `frontend/src/services/api.ts` - Added 3 new API methods
2. `frontend/src/pages/UserDetail.tsx` - Updated to use separate save handlers

---

## Testing Recommendations

1. **Test each tab independently**:
   - Update only main info → Verify bank/deposit unchanged
   - Update only bank info → Verify main/deposit unchanged
   - Update only deposits → Verify main/bank unchanged

2. **Test validation**:
   - Invalid email in main info tab → Should not affect deposits
   - Invalid bank code in bank tab → Should not affect main info
   - Invalid deposit amount → Should not affect other tabs

3. **Test error handling**:
   - Network error in one tab → Other tabs should still work
   - Server validation error → Clear error message for that section

4. **Test backward compatibility**:
   - Original `update` endpoint still functional
   - Can still send full user data if needed