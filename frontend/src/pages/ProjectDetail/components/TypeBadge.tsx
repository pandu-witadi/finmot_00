interface TypeBadgeProps {
    type: 'income' | 'expense';
    size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
    const sizeClasses = {
        sm: 'w-6 h-6 text-[8px]',
        md: 'w-7 h-7 text-[10px]'
    };
    
    return (
        <span className={`${sizeClasses[size]} rounded-full inline-flex items-center justify-center ${
            type === 'income' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
        }`}>
            {type === 'income' ? 'i' : 'e'}
        </span>
    );
}