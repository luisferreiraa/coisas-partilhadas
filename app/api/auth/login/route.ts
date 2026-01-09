// app/api/auth/login/route.ts

import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma"

// Retrieves the JWT secret key from env variables.
// The ! non null assertion operator is used here, assuming the variable is always set.
const JWT_SECRET = process.env.JWT_SECRET!

/**
 * Handles HTTP POST requests for the login route.
 * This is the main function for user authentication.
 * @param {Request} req The incoming Next.js Request object, containing the request body (username and password). 
 * @returns {Promise<NextResponse>} A Promise that resolves the NextResponse object, containing the authentication result (token, user info) or an error.
 */
export async function POST(req: Request) {
    try {
        // Extracts the JSON body from the request, expecting 'username' and 'password'.
        const { username, password } = await req.json()

        // Input validation: Checks if both username and password were provided in the request body.
        if (!username || !password) {
            // If neither is missing, returns a 400 Bad Request response.
            return NextResponse.json(
                { error: "Username e password obrigatórios" },
                { status: 400 }
            )
        }

        // Database interaction: Searches for a unique user record on the provided username.
        const user = await prisma.user.findUnique({
            where: { username },
        })

        // User existence check: Verifies if a user with the given username was found.
        if (!user) {
            // If no user is found, returns a 401 Unauthorized response.
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            )
        }

        // Password verification: Compares the provided plain-text password with the stored hashed password using bcrypt.
        const isValid = await bcrypt.compare(password, user.password)

        // Password validity check.
        if (!isValid) {
            // If the passwords do not match, returns a 401 Unauthorized response.
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            )
        }

        // JWT Creation: If credentials are valid, a JSON Web Token (JWT) is signed.
        const token = jwt.sign(
            {
                // The sub (subject) claim is set to the user's ID.
                sub: user.id,
                // The username is included in the token payload.
                username: user.username,
            },
            // Uses the secret key to sign the token.
            JWT_SECRET,
            { expiresIn: "7d" }     // Token expiration is set to 7 days.
        )

        // Response preparation: Creates a successful JSON response object.
        // It includes sanitized user data (ID and username, excluding the password hash).
        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
            },
        })

        // Cookie Setting: Sets the JWT as a secure HTTP-only cookie.
        response.cookies.set({
            name: "cp:token",       // Cookie name.
            value: token,           // The generated JWT.
            httpOnly: true,         // Crucial for security: prevents client-side JavaScript acccess (mitigates XSS).
            secure: process.env.NODE_ENV === "production",      // Only sends the cookie over HTTPS in production.
            sameSite: "lax",        // Good balance for CSRF protection and usability.
            path: "/",              // Makes the cookie available across the entire site.
            maxAge: 60 * 60 * 24 * 7,       // Matches the 7-day token expiration in seconds.
        })

        // Returns the final response with the user data and the set cookie.
        return response
    } catch (error) {
        // Error Handling: Catches any synchronous or asynchronous errors during the login process.
        console.error("Login error:", error)

        // Returns a generic 500 Internal Server Error response for unhandled exceptions.
        return NextResponse.json(
            { error: "Erro no login" },
            { status: 500 }
        )
    }
}
