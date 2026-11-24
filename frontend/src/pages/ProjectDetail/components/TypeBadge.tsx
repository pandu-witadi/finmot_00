interface TypeBadgeProps {
    type: 'income' | 'expense';
    variant?: 'circle' | 'pill';
    size?: 'sm' | 'md';
}

export function TypeBadge({ type, variant = 'circle', size = 'md' }: TypeBadgeProps) {
    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
    };
    
    const typeStyles = type === 'income' 
        ? { bg: 'bg-green-100', text: 'text-green-700' }
        : { bg: 'bg-red-100', text: 'text-red-700' };
    
    if (variant === 'circle') {
        return (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold ${typeStyles.bg} ${typeStyles.text} text-xs`}>
                {type === 'income' ? 'i' : 'e'}
            </span>
        );
    }
    
    return (
        <span className={`inline-flex rounded ${typeStyles.bg} ${typeStyles.text} ${sizeClasses[size]}`}>
            {type === 'income' ? 'Income' : 'Expense'}
        </span>
    );
}