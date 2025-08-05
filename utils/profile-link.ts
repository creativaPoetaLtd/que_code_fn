export const extractPublicIdFromLink = (link: string): string | null => {
    try {
        const patterns = [
            /\/add-contact\/([a-zA-Z0-9]+)$/, // /add-contact/publicId
            /publicId=([a-zA-Z0-9]+)/, // ?publicId=value
            /\/([a-zA-Z0-9]+)$/, // /publicId at end
        ]

        for (const pattern of patterns) {
            const match = link.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        if (/^[a-zA-Z0-9]+$/.test(link.trim())) {
            return link.trim()
        }
        return null;
    } catch (error) {
        console.error("Error extracting public ID from link:", error);
        return null;
    }
}

export const validatePublicId = (publicId: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(publicId) && publicId.length > 5
}