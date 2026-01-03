// app/api/items/route.ts

import { NextResponse } from "next/server"      // Next.js utility for handling API responses.
import { v4 as uuidv4 } from "uuid"     // Library for generating universally unique identifiers (UUIDSs) for file naming.
import prisma from "@/lib/prisma"       // Imports the configured PRisma client instance.
import { PutObjectCommand } from "@aws-sdk/client-s3"
import s3 from "@/lib/s3"

/**
 * @async
 * @function GET
 * @description - Handles HTTP GET requests to retrieve all items from database.
 * @returns {Promise<NextResponse>} JSON response containing the list of items or an error message.
 */
export async function GET() {
    try {
        // Query the database to find all items.
        const items = await prisma.item.findMany({
            // Order the results by the 'addedAt' timestamp in descending order (newest first).
            orderBy: { addedAt: "desc" },
        })

        // Return a successful 200 OK response with the fetched items as JSON.
        return NextResponse.json(items)
    } catch (error) {
        // Log the error for server-side debugging.
        console.error("Error fetching items:", error)

        // Return a 500 Internal Server Error response to the client.
        return NextResponse.json(
            { error: "Failed to fetch items" },
            { status: 500 }
        )
    }
}

/**
 * @async
 * @description - Handles HTTP POST requests to create a new item, including file uploads.
 * @param {Request} req - The incoming Next.js request object, which contains FormData. 
 * @returns {Promise<NextResponse>} JSON response containing the newly created item or an error message.
 */
export async function POST(req: Request) {
    try {
        // Parse the incoming request body as FormData, which is necessary for handling file uploads.
        const formData = await req.formData()

        // Extract required string fields from the FormData.
        // Type casting is used as values are unknown by default.
        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const theme = formData.get("theme") as string
        const addedBy = formData.get("addedBy") as string

        // Extract optional fields.
        // 'url' is string or null, 'file' is a File object or null.
        const url = formData.get("url") as string | null
        const file = formData.get("file") as File | null

        let filePath: string | null = null

        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const fileExtension = file.name.split(".").pop()
            const key = `uploads/${uuidv4()}.${fileExtension}`

            await s3.send(
                new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: key,
                    Body: buffer,
                    ContentType: file.type,
                })
            )

            filePath = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        }

        // Create the new item record in the database using Prisma.
        const item = await prisma.item.create({
            data: {
                type,
                title,
                description,
                theme,
                addedBy,
                // Use the provided URL or null if absent.
                url: url || null,
                // Store the public file path (or null if no file was uploaded).
                filePath,
            },
        })

        // Return a successful 200 OK response with the newly created item.
        return NextResponse.json(item)
    } catch (error) {
        // Log the error for server-side debugging.
        console.error("Error creating item:", error)

        // Return a 500 Internal Server Error response to the client.
        return NextResponse.json(
            { error: "Failed to create item" },
            { status: 500 }
        )
    }
}

