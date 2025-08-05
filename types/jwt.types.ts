export interface JWTPayload {
    id: string;
    email: string;
    accountType: string;
    iat: number;
    exp: number;
}