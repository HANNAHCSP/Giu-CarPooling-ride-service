import * as cookie from "cookie";
import * as jwt from "jsonwebtoken";

export function fetchRole(headerCookies: any): string {
    if (headerCookies === undefined) {
        return "Unauthorized";
    }

    // Parse cookies
    const cookies = cookie.parse(headerCookies);
    
    if (cookies.Authorization === undefined || cookies.Authorization === null) {
        return "Unauthorized";
    }

    try {
        const auth = jwt.verify(cookies.Authorization, process.env.JWT_SECRET_KEY as string) as any;
        return auth.role;
    } catch (error) {
        return "Unauthorized";
    }
}

export function checkAuth(rolesAuthorized: string[], rolePassed: string): boolean {
    return rolesAuthorized.includes(rolePassed);
}