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
import { projectApi } from "@/services/api";

const projectSchema = z.object({
    code: z.string().min(1, { message: "Project code is required." }),
    name: z.string().min(1, { message: "Project name is required." }),
    note: z.string().optional(),
    typ: z.enum(["project", "routine", "other"]),
});

type ProjectForm = z.infer<typeof projectSchema>;

export function ProjectAdd() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ProjectForm>({
        code: "",
        name: "",
        note: "",
        typ: "project",
    });
    const [errors, setErrors] = useState<Partial<ProjectForm>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof ProjectForm]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            projectSchema.parse(formData);
            setErrors({});

            setIsLoading(true);

            const submitData = {
                code: formData.code.trim(),
                name: formData.name.trim(),
                note: formData.note?.trim() || "",
                typ: formData.typ,
            };

            await projectApi.create(submitData);

            toast.success("Project created successfully");
            navigate("/projects");
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                for (const err of (error as z.ZodError<ProjectForm>).issues) {
                    if (err.path.length > 0) {
                        fieldErrors[err.path[0] as string] = err.message;
                    }
                }
                setErrors(fieldErrors as Partial<ProjectForm>);
                toast.error("Please fix the errors below");
            } else if (error.response) {
                const errorMessage = error.response.data?.error || "Failed to create project";
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
                    <CardTitle className="text-2xl">Add New Project</CardTitle>
                    <CardDescription>
                        Create a new project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Project Code</Label>
                            <Input
                                id="code"
                                name="code"
                                type="text"
                                placeholder="e.g., PROJ-001"
                                value={formData.code}
                                onChange={handleChange}
                                className={errors.code ? "border-red-500" : ""}
                            />
                            {errors.code && (
                                <p className="text-sm text-red-500">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Project name"
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
                            <Label htmlFor="note">Note (optional)</Label>
                            <textarea
                                id="note"
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                className={`h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none ${errors.note ? "border-red-500" : ""}`}
                                placeholder="Additional notes..."
                            />
                            {errors.note && (
                                <p className="text-sm text-red-500">
                                    {errors.note}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="typ">Type</Label>
                            <select
                                id="typ"
                                name="typ"
                                value={formData.typ}
                                onChange={handleChange}
                                className={`h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none ${errors.typ ? "border-red-500" : ""}`}
                            >
                                <option value="project">Project</option>
                                <option value="routine">Routine</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.typ && (
                                <p className="text-sm text-red-500">
                                    {errors.typ}
                                </p>
                            )}
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        form="project-form"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating project..." : "Create Project"}
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                        <Link to="/projects" className="font-medium text-primary hover:text-primary/80">
                            Cancel
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}