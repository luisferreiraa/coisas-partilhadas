// app/api/favorites/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth-server"

/**
 * Handles HTTP GET requests to retrieve the current user's list of favorite items.
 * @param {Request} req The incoming Next.js Request object. 
 * @returns {Promise<NextResponse>} A Promise that resolves to a NextResponse object containing an array of item IDs, or an error.
 */
export async function GET(req: Request) {
    try {
        // Authentication Check: Retrieves the authenticated user's details.
        const user = await getUserFromRequest()

        // Database Query: Fetches all Favorite records associated with the authenticated user's ID.
        const favorites = await prisma.favorite.findMany({
            // Filters records where the userId matches the user's subject (sub) ID from the token.
            where: { userId: user.sub },
            // Selects only the itemId field, optimizing the query by retrieving minimal data.
            select: { itemId: true },
        })

        // Response: Returns a 200 OK response with an array containing only the favorited item IDs.
        // Maps the result to simplify the strucure from [{ itemId: ...}] to ['...'].
        return NextResponse.json(favorites.map(f => f.itemId))
    } catch (error) {
        console.error("Error fetching favorites:", error)
        // Returns a 401 Unauthorized response for authentication-related errors, or a generic error message.
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch favorites" },
            { status: 401 }
        )
    }
}

/**
 * Handles HTTP POST requests to toggle the favorite status of an item (add or remove).
 * @param {Request} req The incoming Next.js Request object, containing the item ID in the body. 
 * @returns {Promise<NextResponse>} A Promise that resolves to a NextResponse object indicating the new favorite status, or an error.
 */
export async function POST(req: Request) {
    try {
        // Authentication Check: Retrieves the authenticated user's details.
        const user = await getUserFromRequest()

        // Request Body Parsing: Extracts the 'itemId' from the request body.
        const { itemId } = await req.json()

        // Input Validation: Checks if the required 'itemId' is present in the request body.
        if (!itemId) {
            // Returns a 400 Bad Request if 'itemId' is missing.
            return NextResponse.json(
                { error: "itemId obrigatório" },
                { status: 400 }
            )
        }

        // Existence Check: Queries the database to see if a favorite record already exists for this.
        const existing = await prisma.favorite.findUnique({
            where: {
                // Uses a compound unique index for efficient lookup.
                userId_itemId: { userId: user.sub, itemId },
            },
        })

        // Toggle Logic (Deletion/Unfavorite): If the record exists, it means the item is currently favorited.
        if (existing) {
            // Deletes the existing favorite record.
            await prisma.favorite.delete({
                where: { id: existing.id },
            })
            // Returns the status indicating the item has been unfavorited.
            return NextResponse.json({ favorited: false })
        }

        // Toggle Logic (Creation/Favorite): If the record does NOT exist, it means the item should be favorited.
        await prisma.favorite.create({
            // Creates a new favorite record linking the user and the item.
            data: { userId: user.sub, itemId },
        })

        // Returns the status indicating the item has been favorited.
        return NextResponse.json({ favorited: true })
    } catch (error) {
        // Error Handling: Catches errors, potentially from authentication failure, database transaction issues, or invalid JSON input.
        console.error("Error toggling favorite:", error)
        // Returns a 500 Internal Server Error for generic failures.
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to toggle favorite" },
            { status: 500 }
        )
    }
}