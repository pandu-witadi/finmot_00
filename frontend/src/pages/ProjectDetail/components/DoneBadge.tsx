interface DoneBadgeProps {
    done: boolean;
}

export function DoneBadge({ done }: DoneBadgeProps) {
    if (!done) {
        return (
            <span className="text-[10px] px-1 py-0.5 rounded border border-red-300 w-[14px] h-[14px] flex items-center justify-center">
                &nbsp;
            </span>
        );
    }
    
    return (
        <span className="text-[10px] text-green-900 px-1 py-0.5">
            ✓
        </span>
    );
}