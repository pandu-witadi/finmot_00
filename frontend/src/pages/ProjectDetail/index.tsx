import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { projectApi } from "@/services/api";
import { ProjectDetailInfo } from "./ProjectDetailInfo";
import { ProjectBudgets } from "./ProjectBudgets";
import { ProjectActuals } from "./ProjectActuals";
import { ProjectTransactions } from "./ProjectTransactions";

export function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("detail");
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProjectData = async () => {
            if (!id) return;

            try {
                const response = await projectApi.getById(id);
                setProject(response.data);
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to load project";
                toast.error(errorMessage);
                navigate("/projects");
            } finally {
                setIsLoading(false);
            }
        };

        loadProjectData();
    }, [id, navigate]);

    const handleProjectSave = (updatedProject: any) => {
        setProject(updatedProject);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 px-8 py-8">
            <div className="mx-auto w-full max-w-none">
                <div className="mb-4 flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <span className="text-muted-foreground">|</span>
                    <p className="text-sm text-muted-foreground">
                        {project.code}
                    </p>
                </div>

                <Tabs defaultValue="detail" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="detail" className="flex-1 text-base">
                            Details
                        </TabsTrigger>
                        <TabsTrigger value="budgets" className="flex-1 text-base">
                            Budgets
                        </TabsTrigger>
                        <TabsTrigger value="actuals" className="flex-1 text-base">
                            Actuals
                        </TabsTrigger>
                        <TabsTrigger value="transactions" className="flex-1 text-base">
                            Transactions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="detail" className="mt-6">
                        <ProjectDetailInfo project={project} onSave={handleProjectSave} />
                    </TabsContent>

                    <TabsContent value="budgets" className="mt-6">
                        <ProjectBudgets projectId={id!} />
                    </TabsContent>

                    <TabsContent value="actuals" className="mt-6">
                        <ProjectActuals active={activeTab === "actuals"} key={activeTab} projectId={id!} />
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-6">
                        <ProjectTransactions projectId={id!} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default ProjectDetail;
