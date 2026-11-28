interface TypeBadgeProps {
    type: 'income' | 'expense';
}

export function TypeBadge({ type }: TypeBadgeProps) {
    return (
        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            type === 'income'
                ? 'bg-green-100 border-green-100 text-green-700 text-[9px]'
                : 'bg-red-100 border-red-100 text-red-700 text-[9px]'
        }`}>
            {type === 'income' ? 'i' : 'e'}
        </div>
    );
}