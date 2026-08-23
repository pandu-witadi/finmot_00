import { useAuth } from "@/context/AuthProvider";
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
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";

const loginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
    const { login, setIsLoading } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LoginForm>({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<Partial<LoginForm>>({});
    const [isLoading, setIsLoadingState] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof LoginForm]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (loginError) {
            setLoginError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            loginSchema.parse(formData);
            setErrors({});
            setLoginError("");

            setIsLoadingState(true);
            setIsLoading(true);

            // Call the actual backend API
            const response = await api.post("/auth/login", formData);
            const data = response.data;

            // Store the token and user info
            localStorage.setItem("token", data.accessToken);

            const user = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                token: data.accessToken,
                role: data.user.role || 'user',
            };

            login(user);

            toast.success("Welcome back!");
            navigate("/dashboard");
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Partial<LoginForm> = {};
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as keyof LoginForm] =
                            err.message;
                    }
                });
                setErrors(fieldErrors);
                toast.error("Please fix the errors below");
            } else if (error.response) {
                // API error
                setLoginError(error.response.data?.error || "Login failed");
                toast.error(error.response.data?.error || "Invalid credentials");
            } else if (error.request) {
                // Network error
                setLoginError("Network error. Please check if the server is running.");
                toast.error("Network error. Please check if the server is running.");
            } else {
                setLoginError(error.message || "An error occurred");
                toast.error(error.message || "An error occurred");
            }
        } finally {
            setIsLoadingState(false);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
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
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label
                                        htmlFor="remember-me"
                                        className="ml-2 block text-sm text-gray-900"
                                    >
                                        Remember me
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <Link
                                        to="/forgot-password"
                                        className="font-medium text-primary hover:text-primary/80"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-medium text-primary hover:text-primary/80"
                        >
                            Sign up
                        </Link>
                    </div>
                    <div className="text-center text-xs text-gray-500">
                        By signing in, you agree to our{" "}
                        <a href="#" className="underline">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="underline">
                            Privacy Policy
                        </a>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
