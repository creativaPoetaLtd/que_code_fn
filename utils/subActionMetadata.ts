/**
 * Sub-action metadata is a free-form JSONB column, and older rows were written as
 * JSON strings (sometimes double-encoded). Spreading such a value would spread the
 * string's characters, so always normalize through this before reading or copying it.
 */
export const parseMetadata = (value: unknown): Record<string, any> => {
    let current: unknown = value;

    // Unwrap until we reach a non-string; double-encoded values need more than one pass
    for (let i = 0; i < 3 && typeof current === 'string'; i++) {
        try {
            current = JSON.parse(current);
        } catch {
            return {};
        }
    }

    if (!current || typeof current !== 'object' || Array.isArray(current)) return {};
    return current as Record<string, any>;
};
