interface DoneBadgeProps {
    done: boolean;
}

export function DoneBadge({ done }: DoneBadgeProps) {
    return (
        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            done 
                ? 'bg-green-200 border-green-200' 
                : 'bg-transparent border-red-500'
        }`}>
            {done && (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            )}
        </div>
    );
}