export function formatCurrency(amount: number, currency: string = "RWF"): string {
    return new Intl.NumberFormat("en-RW", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
