import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { userApi } from "@/services/api";
import { UserForm, userSchema } from "./schemas";
import { useBankInfo } from "./useBankInfo";
import { useDepositInfo } from "./useDepositInfo";
import { MainInfoTab } from "./MainInfoTab";
import { BankInfoTab } from "./BankInfoTab";
import { DepositInfoTab } from "./DepositInfoTab";

export function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("mainInfo");
    
    const [formData, setFormData] = useState<UserForm>({
        email: "",
        password: "",
        name: "",
        role: "user",
        bankInfo: [],
    });
    const [errors, setErrors] = useState<Partial<UserForm>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const [bankState, bankActions] = useBankInfo(formData, setFormData);
    const [depositState, depositActions] = useDepositInfo();

    useEffect(() => {
        const loadUserData = async () => {
            if (!id) return;
            
            try {
                const response = await userApi.getById(id);
                const user = response.data;
                
                const getDepositDate = (deposit: any): Date | undefined => {
                    return deposit.date || deposit.dateEntry;
                };
                
                const normalizeDeposit = (deposit: any): any => {
                    const date = getDepositDate(deposit);
                    return {
                        ...deposit,
                        date: date ? new Date(date) : undefined,
                    };
                };
                
                const normalizedDeposits = (user.deposit?.detail || [])
                    .map(normalizeDeposit)
                    .sort((a: any, b: any) => {
                        const dateA = a.date ? a.date.getTime() : 0;
                        const dateB = b.date ? b.date.getTime() : 0;
                        return dateB - dateA;
                    });
                
                setFormData({
                    email: user.email || "",
                    password: "",
                    name: user.name || "",
                    role: user.role || "user",
                    bankInfo: user.bankInfo || [],
                    deposit: user.deposit,
                });
                depositActions.setDeposits(normalizedDeposits);
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to load user data";
                toast.error(errorMessage);
                navigate("/users");
            } finally {
                setIsDataLoading(false);
            }
        };
        
        loadUserData();
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof UserForm]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage user information
                    </p>
                </div>

                <Tabs defaultValue="mainInfo" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="mainInfo" className="flex-1">Main Info</TabsTrigger>
                        <TabsTrigger value="bankInfo" className="flex-1">Bank Information</TabsTrigger>
                        <TabsTrigger value="depositInfo" className="flex-1">Deposit Information</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="mainInfo" className="space-y-4 mt-6">
                        <MainInfoTab 
                            formData={formData}
                            errors={errors}
                            isLoading={isLoading}
                            handleChange={handleChange}
                            handleMainInfoSave={handleMainInfoSave}
                            setShowPassword={setShowPassword}
                            showPassword={showPassword}
                            setFormData={setFormData}
                            setErrors={setErrors}
                        />
                    </TabsContent>

                    <TabsContent value="bankInfo" className="space-y-4 mt-6">
                        <BankInfoTab 
                            formData={formData}
                            isLoading={isLoading}
                            state={bankState}
                            actions={bankActions}
                            handleBankInfoSave={handleBankInfoSave}
                        />
                    </TabsContent>

                    <TabsContent value="depositInfo" className="space-y-4 mt-6">
                        <DepositInfoTab 
                            isLoading={isLoading}
                            state={depositState}
                            actions={depositActions}
                            handleDepositInfoSave={handleDepositInfoSave}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

async function handleMainInfoSave(e: React.FormEvent, id: string | undefined, formData: UserForm, errors: Partial<UserForm>, setErrors: any, setIsLoading: any) {
    e.preventDefault();

    if (!id) {
        toast.error("User ID not found");
        return;
    }

    try {
        const { email, password, name, role } = formData;
        userSchema.parse({ email, password, name, role });
        
        setErrors({});
        setIsLoading(true);

        const submitData: any = {
            email: formData.email || undefined,
            password: formData.password || undefined,
            name: formData.name && formData.name.trim() !== "" ? formData.name : undefined,
            role: formData.role,
        };

        await userApi.updateMainInfo(id, submitData);

        toast.success("Main information updated successfully");
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string> = {};
            error.issues.forEach((err: any) => {
                if (err.path && err.path.length > 0) {
                    fieldErrors[err.path[0]] = err.message;
                }
            });
            setErrors(fieldErrors as Partial<UserForm>);
            toast.error("Please fix the errors below");
        } else if (error.response) {
            const errorMessage = error.response?.data?.error || "Failed to update main information";
            toast.error(errorMessage);
        } else if (error.request) {
            toast.error("Network error. Please check if the server is running.");
        } else {
            toast.error(error.message || "An error occurred");
        }
    } finally {
        setIsLoading(false);
    }
}

async function handleBankInfoSave(e: React.FormEvent, id: string | undefined, formData: any, bankState: any, setIsLoading: any) {
    e.preventDefault();

    if (!id) {
        toast.error("User ID not found");
        return;
    }

    try {
        const hasPendingBankInfo = bankState.bankAccount.bank.trim() !== "" && 
                                   bankState.bankAccount.code.trim() !== "" && 
                                   bankState.bankAccount.accountNo.trim() !== "" && 
                                   bankState.bankAccount.name.trim() !== "";
        
        const finalBankInfo = hasPendingBankInfo 
            ? [...(formData.bankInfo || []), bankState.bankAccount]
            : formData.bankInfo || [];

        if (finalBankInfo.length > 0) {
            const { bankInfoSchema } = await import("./schemas");
            finalBankInfo.forEach((bank: any) => {
                bankInfoSchema.parse(bank);
            });
        }

        setIsLoading(true);

        await userApi.updateBankInfo(id, { bankInfo: finalBankInfo });

        toast.success(hasPendingBankInfo ? "Bank information updated successfully (new account added)" : "Bank information updated successfully");
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string> = {};
            error.issues.forEach((err: any) => {
                if (err.path && err.path.length > 0) {
                    fieldErrors[err.path[0]] = err.message;
                }
            });
            bankActions.setBankErrors(fieldErrors);
            toast.error("Please fix the errors below");
        } else if (error.response) {
            const errorMessage = error.response?.data?.error || "Failed to update bank information";
            toast.error(errorMessage);
        } else if (error.request) {
            toast.error("Network error. Please check if the server is running.");
        } else {
            toast.error(error.message || "An error occurred");
        }
    } finally {
        setIsLoading(false);
    }
}

async function handleDepositInfoSave(e: React.FormEvent, id: string | undefined, depositState: any, setIsLoading: any, depositActions: any) {
    e.preventDefault();

    if (!id) {
        toast.error("User ID not found");
        return;
    }

    try {
        if (depositState.deposits.length > 0) {
            const { depositEntrySchema } = await import("./schemas");
            depositState.deposits.forEach((deposit: any) => depositEntrySchema.parse(deposit));
        }

        const depositsForAPI = depositState.deposits.map(deposit => ({
            ...deposit,
            date: deposit.date ? new Date(deposit.date).toISOString() : undefined,
        }));

        setIsLoading(true);

        await userApi.updateDeposit(id, { detail: depositsForAPI });

        toast.success("Deposit information updated successfully");
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string> = {};
            error.issues.forEach((err: any) => {
                if (err.path && err.path.length > 0) {
                    fieldErrors[err.path[0]] = err.message;
                }
            });
            depositActions.setDepositErrors(fieldErrors);
            toast.error("Please fix the errors below");
        } else if (error.response) {
            const errorMessage = error.response?.data?.error || "Failed to update deposit information";
            toast.error(errorMessage);
        } else if (error.request) {
            toast.error("Network error. Please check if the server is running.");
        } else {
            toast.error(error.message || "An error occurred");
        }
    } finally {
        setIsLoading(false);
    }
}

export default UserDetail;