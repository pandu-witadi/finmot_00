interface TypeBadgeProps {
    type: 'income' | 'expense';
    size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
    const sizeClasses = {
        sm: 'text-[8px] px-1 py-0.5',
        md: 'text-[10px] px-1.5 py-0.5'
    };
    
    return (
        <span className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
            type === 'income' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
        }`}>
            {type === 'income' ? 'i' : 'e'}
        </span>
    );
}