export const theme = {
    colors: {
        error: {
            text: 'text-error',
        },
        button: {
            primary: 'w-full flex justify-center items-center gap-2 py-3 px-4 bg-trust hover:bg-trust-mid text-white text-base font-semibold rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-trust/50 disabled:opacity-50 disabled:cursor-not-allowed',
            ghost: 'w-full flex justify-center items-center py-2 px-4 text-ink-muted hover:text-ink hover:bg-surface-raised text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-border/50',
        }
    }
};

export function getInputClasses(hasError: boolean): string {
    const base = "w-full px-4 py-3 bg-surface border rounded-md text-base text-ink placeholder:text-ink-muted/50 focus:outline-none transition-all";
    if (hasError) {
        return `${base} border-error focus:ring-2 focus:ring-error/20`;
    }
    return `${base} border-border focus:border-trust focus:ring-2 focus:ring-trust/20`;
}
