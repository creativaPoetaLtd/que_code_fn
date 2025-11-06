export const extractPublicIdFromLink = (link: string): string | null => {
    try {
        const patterns = [
            /\/welcome\/([a-fA-F0-9\-]{36})(?:\?.*)?$/, // /welcome/userId format (UUID)
            /\/add-contact\/([a-zA-Z0-9]+)$/, // /add-contact/publicId
            /publicId=([a-zA-Z0-9]+)/, // ?publicId=value
            /\/([a-fA-F0-9\-]{36})(?:\?.*)?$/, // /userId at end (UUID)
            /\/([a-zA-Z0-9]+)$/, // /publicId at end
        ]

        for (const pattern of patterns) {
            const match = link.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        // If it's just a plain ID without URL structure
        if (/^[a-fA-F0-9\-]{36}$/.test(link.trim())) {
            return link.trim(); // UUID format
        }
        if (/^[a-zA-Z0-9]+$/.test(link.trim())) {
            return link.trim(); // Simple alphanumeric ID
        }
        return null;
    } catch (error) {
        console.error("Error extracting public ID from link:", error);
        return null;
    }
}

export const validatePublicId = (publicId: string): boolean => {
    // Accept UUID format (like user IDs) or alphanumeric IDs
    return (/^[a-fA-F0-9\-]{36}$/.test(publicId) || /^[a-zA-Z0-9]+$/.test(publicId)) && publicId.length > 5
}