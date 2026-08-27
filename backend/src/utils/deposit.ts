/**
 * Calculates the total deposit based on deposit entries with signs.
 * 
 * Formula: total = sum of (each deposit entry amount * deposit sign)
 * - If sign is "+", add the amount
 * - If sign is "-", subtract the amount
 * 
 * @param entries - Array of deposit entries with sign and amount
 * @returns The calculated total as a number
 */
export function calculateDepositTotal(entries: Array<{
    sign?: "+" | "-";
    amount?: number;
    note?: string;
    dateEntry?: Date;
}>): number {
    // Handle null/undefined or empty array
    if (!entries || entries.length === 0) {
        return 0;
    }

    return entries.reduce((total, entry) => {
        // Handle null/undefined amount - treat as 0
        const amount = entry.amount ?? 0;
        
        // Handle null/undefined/invalid sign - treat as "+"
        const sign = entry.sign === "-" ? "-" : "+";
        
        // Apply sign to amount and add to total
        return sign === "+" ? total + amount : total - amount;
    }, 0);
}