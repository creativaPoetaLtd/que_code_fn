export function formatTimestampWithoutSeconds(timestamp?: string): string {
    if (!timestamp) return "";

    const parts = timestamp.split(" ");
    const time = parts[0];
    const period = parts[1] ?? "";

    const [hour, minute] = time.split(":");

    return `${hour}:${minute} ${period}`.trim();
}
