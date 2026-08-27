import { z } from "zod";

const bankInfoSchema = z.object({
    bank: z.string().min(1, "Bank name is required"),
    code: z.string().min(1, "Bank code is required"),
    accountNo: z.string().min(1, "Account number is required"),
    name: z.string().min(1, "Account holder name is required"),
});

const depositEntrySchema = z.object({
    sign: z.enum(["+", "-"]),
    amount: z.number().min(0, "Amount must be 0 or greater"),
    note: z.string().optional(),
    date: z.union([z.date(), z.string()]).optional(),
});

export type DepositEntry = z.infer<typeof depositEntrySchema>;

const userSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters." })
        .or(z.literal(""))
        .transform((val) => val === "" ? undefined : val)
        .optional(),
    name: z.string().optional(),
    role: z.enum(["user", "admin", "finance", "vendor", "guest", "government"]),
    bankInfo: z.array(bankInfoSchema).optional(),
    deposit: z.object({
        total: z.number().optional(),
        detail: z.array(depositEntrySchema).optional(),
    }).optional(),
});

export type UserForm = z.infer<typeof userSchema>;

export { bankInfoSchema, depositEntrySchema, userSchema };