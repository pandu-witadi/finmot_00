import { CheckSquare, Square } from "lucide-react";

interface DoneBadgeProps {
    done: boolean;
}

export function DoneBadge({ done }: DoneBadgeProps) {
    return done ? (
        <CheckSquare className="w-5 h-5 text-green-700 fill-green-100" />
    ) : (
        <Square className="w-5 h-5 text-red-700" />
    );
}