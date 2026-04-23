const URL_REGEX =
    /(?:https?:\/\/(?:www\.)?|www\.)[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{0,253}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/g;

export interface TextSegment {
    type: "text" | "url";
    content: string; // the raw text as it appears in the message
    href?: string;   // fully-qualified, sanitized URL (only present when type === "url")
}

export function normalizeUrl(url: string): string {
    return /^www\./i.test(url) ? `https://${url}` : url;
}

export function isValidUrl(url: string): boolean {
    try {
        const { protocol } = new URL(url);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}

export function sanitizeUrl(raw: string): string | null {
    const normalized = normalizeUrl(raw);
    if (!isValidUrl(normalized)) return null;
    try {
        // Re-serialize through the URL constructor to strip injected characters
        return new URL(normalized).toString();
    } catch {
        return null;
    }
}

export function parseMessageSegments(text: string): TextSegment[] {
    if (!text) return [{ type: "text", content: "" }];

    const segments: TextSegment[] = [];
    let lastIndex = 0;

    // Reset the stateful lastIndex before iterating
    URL_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = URL_REGEX.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // Plain text before this URL
        if (start > lastIndex) {
            segments.push({ type: "text", content: text.slice(lastIndex, start) });
        }

        const raw = match[0];
        const href = sanitizeUrl(raw);

        if (href) {
            segments.push({ type: "url", content: raw, href });
        } else {
            // Treat unsanitizable matches as plain text
            segments.push({ type: "text", content: raw });
        }

        lastIndex = end;
    }

    // Any remaining text after the last URL
    if (lastIndex < text.length) {
        segments.push({ type: "text", content: text.slice(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ type: "text", content: text }];
}


export function extractUrls(text: string, max = 3): string[] {
    const seen = new Set<string>();
    const urls: string[] = [];

    for (const seg of parseMessageSegments(text)) {
        if (seg.type === "url" && seg.href && !seen.has(seg.href)) {
            seen.add(seg.href);
            urls.push(seg.href);
            if (urls.length >= max) break;
        }
    }

    return urls;
}
