// app/api/favorites/route.ts

import { NextResponse } from "next/server"      // Import NextResponse for creating structured HTTP responses (JSON, status codes).
import prisma from "@/lib/prisma"       // Import the Prisma client instance for database interactions.

/**
 * @function GET
 * @description Handles GET requests to retrieve a user's list of favorited item IDs.
 * It requires a 'username' query parameter.
 * 
 * @param {Request} req - The incoming Next.js Request object. 
 * @returns {Promise<NextResponse>} A response containing an array of favorited item IDs or an error.
 */
export async function GET(req: Request) {
    // Extract search parameters from the request URL.
    const { searchParams } = new URL(req.url)
    // Get the 'username' from the query parameters.
    const username = searchParams.get("username")

    // Input validation: Check if the 'username' parameter is present.
    if (!username) {
        return NextResponse.json(
            { error: "Username obrigatório" },      // Error message
            { status: 400 }     // HTTP 400 Bad Request status code.
        )
    }

    // Query the database for all 'Favorite' records matching the provided username.
    const favorites = await prisma.favorite.findMany({
        where: { username },        // Filter results by the extracted username.
        select: { itemId: true },       // Select only the itemId field to optimize the query.
    })

    // Map the result to return a clean array of item IDs.
    return NextResponse.json(favorites.map(f => f.itemId))
}

/**
 * @function POST
 * @description Handles POST requests to toggle the favorite status of an item (add or remove).
 * It expects 'username' and 'itemId' in the request body.
 * @param {Request} req - The incoming Next.js Request object.
 * @returns {Promise<NextResponse>} A response indicating whether the item was favorited or unfavorited.
 */
export async function POST(req: Request) {
    // Extract 'username' and 'itemId' from the JSON request body.
    const { username, itemId } = await req.json()

    // Input validation: Check if both required fields are present.
    if (!username || !itemId) {
        return NextResponse.json(
            { error: "Dados em falta" },        // Error message in Portuguese.
            { status: 400 }     // HTTP 400 Bad Request status code.
        )
    }

    // Check if the favorite relationship already exists using a composite key unique constraint.
    const existing = await prisma.favorite.findUnique({
        where: {
            username_itemId: { username, itemId },      // Composite unique key for checking existence.
        },
    })

    // Logic for unfavoriting (DELETE operation).
    if (existing) {
        // If the record exists, delete it.
        await prisma.favorite.delete({
            where: { id: existing.id },
        })
        // Return a response indicating the item was unfavorited.
        return NextResponse.json({ favorited: false })
    }

    // Logic for favoriting (CREATE operation).
    // If the record does not exist, create a new one.
    await prisma.favorite.create({
        data: { username, itemId },
    })

    // Return a response indicating the item was newly favorited.
    return NextResponse.json({ favorited: true })
}