const num_formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
});

export function fmtNumber(num: number): string {
    return num_formatter.format(num);
}