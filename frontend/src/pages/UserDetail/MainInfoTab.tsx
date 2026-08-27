import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserForm } from "./schemas";

interface MainInfoTabProps {
    formData: UserForm;
    errors: Partial<UserForm>;
    isLoading: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMainInfoSave: (e: React.FormEvent) => void;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    showPassword: boolean;
    setFormData: React.Dispatch<React.SetStateAction<UserForm>>;
    setErrors: React.Dispatch<React.SetStateAction<Partial<UserForm>>>;
}

export function MainInfoTab({
    formData,
    errors,
    isLoading,
    handleChange,
    handleMainInfoSave,
    setShowPassword,
    showPassword,
    setFormData,
    setErrors,
}: MainInfoTabProps) {
    return (
        <div className="space-y-4">
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
                    <p className="text-sm text-red-500">{errors.email}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password (leave blank to keep current)</Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? "border-red-500" : ""}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off">
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
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
                    <p className="text-sm text-red-500">{errors.name}</p>
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
                    className={`h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none ${errors.role ? "border-red-500" : ""}`}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="finance">Finance</option>
                    <option value="vendor">Vendor</option>
                    <option value="guest">Guest</option>
                    <option value="government">Government</option>
                </select>
                {errors.role && (
                    <p className="text-sm text-red-500">{errors.role}</p>
                )}
            </div>

            <div className="pt-6">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleMainInfoSave}
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}