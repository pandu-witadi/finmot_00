import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card.tsx';

export const About = () => {
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>About Finmot</CardTitle>
                    <CardDescription>
                        Multi-Project Financial Tracker - MVP
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">What is Finmot?</h3>
                        <p className="text-sm text-muted-foreground">
                            Finmot is a comprehensive financial tracking application designed to
                            help you manage multiple projects and their related expenses, revenues,
                            and financial insights all in one place.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Current Status</h3>
                        <p className="text-sm text-muted-foreground">
                            This is the MVP version of Finmot. The current implementation includes:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                            <li>Project management dashboard</li>
                            <li>Basic project tracking</li>
                            <li>Multi-project financial overview</li>
                            <li>Responsive UI with TailwindCSS</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Technology Stack</h3>
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                Backend: Fastify
                            </span>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                Database: MongoDB
                            </span>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                ORM: Mongoose
                            </span>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                Frontend: React 18
                            </span>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                Styling: TailwindCSS
                            </span>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                UI: shadcn/ui
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};