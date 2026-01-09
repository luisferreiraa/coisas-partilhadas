// app/api/auth/logout/route.ts

import { NextResponse } from "next/server"

/**
 * Handles HTTP POST requests for the logout route.
 * This function's sole purpose is to invalidate the user's session token by removing the cookie.
 * @returns {Promise<NextResponse>} A Promise that resolves to a NextResponse object, confirming the successful logout.
 */
export async function POST() {
    // Creates a basic success response object.
    const response = NextResponse.json({ success: true })

    // Cookie Invalidation: This is the core logic of the logout process.
    response.cookies.set({
        name: "cp:token",       // The name of the authentication cookie to be removed.
        value: "",              // Clears  the cookie's value, although maxAge: 0 is the primary mechanism for deletion.
        maxAge: 0,              // The maxAge property is set to 0. This instructs the browser to immediately expire and delete the cookie.
        path: "/",
    })

    // Returns the response, which includes the header instructing the browser to delete the cookie.
    return response
}
