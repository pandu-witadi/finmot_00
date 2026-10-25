export function formatNumber(value: number): string {
    const num = Number(value);
    if (isNaN(num)) return "0";
    const integer = Math.floor(Math.abs(num)).toString();
    return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function getTypeLabel(type: 'income' | 'expense'): string {
    return type === 'income' ? 'i' : 'e';
}

export function formatTypeBadge(type: 'income' | 'expense'): string {
    return type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
}

export function parseTags(tags: string): string[] {
    return tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
}