// lib/auth-server.ts

import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

// Retrieves the JWT secret key from environment variables. The '!' asserts it will be defined.
const JWT_SECRET = process.env.JWT_SECRET!

// Defines the expected structure (type) of the decoded JWT payload.
type JwtPayload = {
    // 'sub' (subject) typically holds the unique identifier of the user (e.g., user ID).
    sub: string
    // Stores the username for convenience or display purposes.
    username: string
}

/**
 * Retrieves the authentication token from the request cookies and verifies it.
 * This function acts as the core server-side authentication middleware/utility.
 * * @returns {Promise<JwtPayload>} A Promise that resolves to the decoded JWT payload (user data) if the token is valid.
 * @throws {Error} Throws an error if the token is missing or invalid.
 */
export async function getUserFromRequest(): Promise<JwtPayload> {
    // Accesses the cookie store specific to the current request.
    const cookieStore = await cookies()
    // Tries to get the value of the authentication cookie named "cp:token".
    const token = cookieStore.get("cp:token")?.value

    // Check 1: Token existence check.
    if (!token) {
        // If the cookie/token is missing, authentication fails.
        throw new Error("Not authenticated")
    }

    // Check 2: Token validity check.
    try {
        // Verifies the token using the secret key.
        // If the token is valid (correctly signed and not expired), it returns the decoded payload.
        // We cast the result to our defined JwtPayload type.
        return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch {
        // If jwt.verify fails (e.g., signature mismatch, expired token, malformed token), it catches the error.
        // Throws a specific error indicating invalidity, which downstream callers (like API routes) can handle.
        throw new Error("Invalid token")
    }
}
