import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { userApi } from "@/services/api";

const bankInfoSchema = z.object({
    bank: z.string().min(1, "Bank name is required"),
    code: z.string().min(1, "Bank code is required"),
    accountNo: z.string().min(1, "Account number is required"),
    name: z.string().min(1, "Account holder name is required"),
});

const userSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
    name: z.string().optional(),
    role: z.enum(["user", "admin", "finance", "vendor", "guest", "government"]),
    bankInfo: z.array(bankInfoSchema).optional(),
});

type UserForm = z.infer<typeof userSchema>;

export function UserForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<UserForm>({
        email: "",
        password: "",
        name: "",
        role: "user",
        bankInfo: [],
    });
    const [errors, setErrors] = useState<Partial<UserForm>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [bankErrors, setBankErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [bankAccount, setBankAccount] = useState({
        bank: "",
        code: "",
        accountNo: "",
        name: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof UserForm]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBankAccount(prev => ({ ...prev, [name]: value }));
        if (bankErrors[name as keyof typeof bankAccount]) {
            setBankErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof bankAccount];
                return newErrors;
            });
        }
    };

    const addBankInfo = () => {
        try {
            bankInfoSchema.parse(bankAccount);
            setBankErrors({});
            setFormData(prev => ({
                ...prev,
                bankInfo: [...(prev.bankInfo || []), bankAccount],
            }));
            setBankAccount({ bank: "", code: "", accountNo: "", name: "" });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach((err: { path: string[]; message: string }) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as string] = err.message;
                    }
                });
                setBankErrors(fieldErrors);
            }
        }
    };

    const removeBankInfo = (index: number) => {
        setFormData(prev => ({
            ...prev,
            bankInfo: prev.bankInfo?.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            userSchema.parse(formData);
            setErrors({});
            
            setIsLoading(true);

            const submitData = {
                email: formData.email,
                password: formData.password,
                name: formData.name || "",
                role: formData.role,
                bankInfo: formData.bankInfo,
            };

            await userApi.create(submitData);
            
            toast.success("User created successfully");
            navigate("/users");
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
                    if (err.path.length > 0 && err.path[0] !== "bankInfo") {
                        fieldErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(fieldErrors as Partial<UserForm>);
                toast.error("Please fix the errors below");
            } else if (error.response) {
                const errorMessage = error.response.data?.error || "Failed to create user";
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error("Network error. Please check if the server is running.");
            } else {
                toast.error(error.message || "An error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl">Add New User</CardTitle>
                    <CardDescription>
                        Create a new user account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={
                                        errors.password ? "border-red-500" : ""
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={(e) => {
                                    const value = e.target.value as UserForm["role"];
                                    setFormData(prev => ({ ...prev, role: value }));
                                    if (errors.role) {
                                        setErrors(prev => ({ ...prev, role: undefined }));
                                    }
                                }}
                                className={`h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none ${errors.role ? "border-red-500" : ""}`}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="finance">Finance</option>
                                <option value="vendor">Vendor</option>
                                <option value="guest">Guest</option>
                                <option value="government">Government</option>
                            </select>
                            {errors.role && (
                                <p className="text-sm text-red-500">
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Bank Information (optional)</Label>
                            {formData.bankInfo && formData.bankInfo.length > 0 && (
                                <div className="space-y-2 mb-2">
                                    {formData.bankInfo.map((bank, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-md border p-2 text-sm">
                                            <span>{bank.bank} - {bank.accountNo}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeBankInfo(index)}
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="rounded-md border p-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="bank" className="text-xs">Bank Name</Label>
                                        <Input
                                            id="bank"
                                            name="bank"
                                            placeholder="Bank Name"
                                            value={bankAccount.bank}
                                            onChange={handleBankChange}
                                            className={bankErrors.bank ? "border-red-500" : ""}
                                        />
                                        {bankErrors.bank && (
                                            <p className="text-xs text-red-500">{bankErrors.bank}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-xs">Bank Code</Label>
                                        <Input
                                            id="code"
                                            name="code"
                                            placeholder="Code"
                                            value={bankAccount.code}
                                            onChange={handleBankChange}
                                            className={bankErrors.code ? "border-red-500" : ""}
                                        />
                                        {bankErrors.code && (
                                            <p className="text-xs text-red-500">{bankErrors.code}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="accountNo" className="text-xs">Account No</Label>
                                        <Input
                                            id="accountNo"
                                            name="accountNo"
                                            placeholder="Account Number"
                                            value={bankAccount.accountNo}
                                            onChange={handleBankChange}
                                            className={bankErrors.accountNo ? "border-red-500" : ""}
                                        />
                                        {bankErrors.accountNo && (
                                            <p className="text-xs text-red-500">{bankErrors.accountNo}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountName" className="text-xs">Account Holder</Label>
                                        <Input
                                            id="accountName"
                                            name="name"
                                            placeholder="Account Holder Name"
                                            value={bankAccount.name}
                                            onChange={handleBankChange}
                                            className={bankErrors.name ? "border-red-500" : ""}
                                        />
                                        {bankErrors.name && (
                                            <p className="text-xs text-red-500">{bankErrors.name}</p>
                                        )}
                                    </div>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addBankInfo} className="w-full text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    Add Bank Account
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                        onClick={handleSubmit}
                    >
                        {isLoading ? "Creating user..." : "Create User"}
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                        <Link to="/users" className="font-medium text-primary hover:text-primary/80">
                            Cancel
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}