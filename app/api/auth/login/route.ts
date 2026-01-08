// // app/api/auth/login/route.ts

// import { NextResponse } from "next/server" // Imports the NextResponse object from Next.js, used to create and return HTTP responses from API routes.
// import bcrypt from "bcrypt" // Imports the bcrypt library for secure password hashing and comparison.
// import jwt from "jsonwebtoken" // Imports the jsonwebtoken library for creating and verifying JSON Web Tokens (JWTs).
// import prisma from "@/lib/prisma" // Imports the Prisma client instance, the ORM used to interact with the database.

// // Defines the secret key used to sign the JWTs.
// const JWT_SECRET = process.env.JWT_SECRET!

// /**
//  * @async
//  * @function POST
//  * @description Handles the HTTP POST request for user login.
//  * This function processes the provided username and password, authenticates the user,
//  * and issues a JSON Web Token (JWT) upon successful verification.
//  * 
//  * @param req - The incoming Next.js Request object, containing the body with credentials.
//  * @returns {Promise<NextResponse>} A Promise resolving to a JSON response containing either
//  * the auth token and user data or an error message.
//  */
// export async function POST(req: Request) {
//     try {
//         // Extracts the username and password from the JSON body of the request.
//         const { username, password } = await req.json()

//         // Input Validation: Checks if both username and password fields were provided.
//         if (!username || !password) {
//             return NextResponse.json(
//                 { error: "Username e password obrigatórios" },      // Error message for required fields.
//                 { status: 400 }     // Returns 400 Bad Request status if validation fails.
//             )
//         }

//         // Database lookup: Searches for a user with the provided username.
//         const user = await prisma.user.findUnique({
//             where: { username }
//         })

//         // User existence check: If no user is found, authentication fails.
//         if (!user) {
//             return NextResponse.json(
//                 { error: "Credenciais inválidas" },     // General error message to prevent username enumeration.
//                 { status: 401 }     // Returns 401 Unauthorized status.
//             )
//         }

//         // Password verification: Compares the plain-text password with the hashed password stored in the database.
//         // bcrypt.compare is asynchronous and securely handles the comparison.
//         const isValid = await bcrypt.compare(password, user.password)

//         // Password validity check: If the passwords do not match, authentication fails.
//         if (!isValid) {
//             return NextResponse.json(
//                 { error: "Credenciais inválidas" },     // General error message.
//                 { status: 401 }     // Returns 401 Unauthorized status.
//             )
//         }

//         // Token generation: Creates a new JSON Web Token (JWT).
//         const token = jwt.sign(
//             {
//                 // Payload: Contains claims about the user. 'sub' (subject) is typically the user ID.
//                 sub: user.id,
//                 username: user.username
//             },
//             JWT_SECRET,     // The secret key for signing the token.
//             { expiresIn: "7d" }     // Token expiry set to 7 days.
//         )

//         // Successful login response: Returns the generated token and basic user information.
//         return NextResponse.json({
//             token,
//             user: {
//                 id: user.id,
//                 username: user.username,
//             }
//         })
//     } catch (error) {
//         // Catches unexpected errors during the process (e.g., database connection failure, JSON parsing error).
//         console.error("Login error:", error)
//         return NextResponse.json(
//             { error: "Erro no login" },     // Generic server error message.
//             { status: 500 }     // Returns 500 Internal Server Error status.
//         )
//     }
// }

// app/api/auth/login/route.ts

import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username e password obrigatórios" },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            )
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            )
        }

        // 🔐 JWT assinado (NUNCA enviado ao frontend)
        const token = jwt.sign(
            {
                sub: user.id,
                username: user.username,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        )

        // 🍪 Cookie HttpOnly
        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
            },
        })

        response.cookies.set({
            name: "cp:token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 dias
        })

        return response
    } catch (error) {
        console.error("Login error:", error)

        return NextResponse.json(
            { error: "Erro no login" },
            { status: 500 }
        )
    }
}
