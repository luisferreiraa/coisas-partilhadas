// app/api/items/route.ts

import { NextResponse } from "next/server"      // Next.js utility for handling API responses.
import { v4 as uuidv4 } from "uuid"     // Library for generating universally unique identifiers (UUIDSs) for file naming.
import prisma from "@/lib/prisma"       // Imports the configured Prisma client instance.
import { PutObjectCommand } from "@aws-sdk/client-s3"       // Command object for uploading files to S3.
import s3 from "@/lib/s3"       // Imports the configured S3 client instance.
import { getUserFromRequest } from "@/lib/auth-server"

/**
 * @async
 * @function GET
 * @description - Handles HTTP GET requests to retrieve a paginated list of all items from the database.
 * The endpoint supports query parameters for page number.
 * @param {Request} req - The incoming Next.js Request object.
 * @returns {Promise<NextResponse>} JSON response containing the list of items, pagination details, or an error message.
 */
// export async function GET(req: Request) {
//     try {
//         const user = getUserFromRequest()

//         // Extract search parameters from the request URL.
//         const { searchParams } = new URL(req.url)

//         // Determine the current page number, defaulting to 1 and ensuring it's a positive integer.
//         const page = Math.max(
//             1,
//             Number(searchParams.get("page") ?? "1")
//         )

//         const pageSize = Math.max(
//             1,
//             Number(searchParams.get("pageSize") ?? "10")
//         )

//         const skip = (page - 1) * pageSize      // Calculate the offset for pagination (how many records to skip).

//         // Fetch items from the database using Prisma, applying ordering, skipping, and limiting (taking).
//         const items = await prisma.item.findMany({
//             orderBy: { addedAt: "desc" },       // Order results by creation date, newest first.
//             skip,       // Apply the offset.
//             take: pageSize,     // Limit the number of results to the page size.
//             include: {
//                 addedBy: {
//                     select: {
//                         id: true,
//                         username: true,
//                     }
//                 }
//             }
//         })

//         // Count the total number of records in the 'item' table (for calculating total pages).
//         const totalItems = await prisma.item.count()

//         // Return a successful JSON response with the fetched items and pagination metadata.
//         return NextResponse.json({
//             items,
//             pagination: {
//                 page,
//                 pageSize,
//                 totalItems,
//                 totalPages: Math.ceil(totalItems / pageSize),       // Calculate the total number of pages.
//             },
//         })
//     } catch (error) {
//         // Log the error for server-side debugging.
//         console.error("Error fetching items:", error)
//         // Return a 500 Internal Server Error response to the client.
//         return NextResponse.json(
//             { error: "Failed to fetch items" },
//             { status: 500 }
//         )
//     }
// }

export async function GET(req: Request) {
    try {
        const user = await getUserFromRequest()

        const { searchParams } = new URL(req.url)

        // Pagination parameters
        const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
        const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? "10"))
        const skip = (page - 1) * pageSize

        // Filter parameters
        const type = searchParams.get("type") // "all" or specific type
        const theme = searchParams.get("theme") // "all" or specific theme
        const search = searchParams.get("search") // search query
        const showFavorites = searchParams.get("showFavorites") === "true"

        // Build Prisma where clause
        const where: any = {}

        // Type filter
        if (type && type !== "all") {
            where.type = type
        }

        // Theme filter
        if (theme && theme !== "all") {
            where.theme = {
                has: theme // Prisma syntax for array contains
            }
        }

        // Search filter (title OR description)
        if (search && search.trim() !== "") {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ]
        }

        // Favorites filter
        if (showFavorites && user) {
            // First get user's favorite item IDs
            const favorites = await prisma.favorite.findMany({
                where: { userId: user.sub },
                select: { itemId: true }
            })

            const favoriteItemIds = favorites.map(f => f.itemId)

            // Filter items by favorite IDs
            where.id = {
                in: favoriteItemIds
            }
        }

        // Fetch filtered and paginated items
        const items = await prisma.item.findMany({
            where,
            orderBy: { addedAt: "desc" },
            skip,
            take: pageSize,
            include: {
                addedBy: {
                    select: {
                        id: true,
                        username: true,
                    }
                }
            }
        })

        // Count total items matching the filters
        const totalItems = await prisma.item.count({ where })

        // Get favorite status for current user
        let itemsWithFavorites = items
        if (user) {
            const favoriteItems = await prisma.favorite.findMany({
                where: {
                    userId: user.sub,
                    itemId: { in: items.map(item => item.id) }
                },
                select: { itemId: true }
            })

            const favoriteIds = new Set(favoriteItems.map(f => f.itemId))

            itemsWithFavorites = items.map(item => ({
                ...item,
                isFavorite: favoriteIds.has(item.id)
            }))
        }

        return NextResponse.json({
            items: itemsWithFavorites,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
            },
        })
    } catch (error) {
        console.error("Error fetching items:", error)
        return NextResponse.json(
            { error: "Failed to fetch items" },
            { status: 500 }
        )
    }
}

/**
 * @async
 * @function POST
 * @description - Handles HTTP POST requests to create a new item. It processes form data,
 * handles file uploads to S3, and saves the item record (including S3 file paths) to the database.
 * @param {Request} req - The incoming Next.js request object, expected to contain FormData. 
 * @returns {Promise<NextResponse>} JSON response containing the newly created item or an error message.
 */
export async function POST(req: Request) {
    try {
        const user = await getUserFromRequest()

        // Parse the incoming request body as FormData, which is necessary for handling file uploads.
        const formData = await req.formData()

        // Extract required string fields from the FormData and cast them.
        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string

        // Handle 'theme': Extracts all values for the "theme" key (which might be an array if sent multiple times).
        let themeRaw = formData.getAll("theme") as string[]
        // Check if a single string containing comma-separated values was sent, and split it.
        if (themeRaw.length === 1 && themeRaw[0].includes(",")) {
            themeRaw = themeRaw[0].split(",").map((t) => t.trim())
        }

        // Final theme array (even if it contains a single element).
        const theme = themeRaw

        // const addedBy = formData.get("addedBy") as string       // User who created the item.

        // Handle 'url': Extracts all values for the "url" key.
        let urlRaw = formData.getAll("url") as string[]
        // Check if a single string containing comma-separated URLs was sent, and split it.
        if (urlRaw.length === 1 && urlRaw[0].includes(",")) {
            urlRaw = urlRaw[0].split(",").map((u) => u.trim())
        }
        // Final URL array.
        const url = urlRaw.length > 0 ? urlRaw : []

        // Extract all files provided under the "files" key.
        const files = formData.getAll("files") as File[]
        const filePaths: string[] = []      // Array to store the resulting S3 URLs for the files.

        // Loop through each file object received.
        for (const file of files) {
            if (file && file.size > 0) {
                // Convert the file content to an ArrayBuffer, then to a Node.js Buffer for S3 upload.
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)
                // Extract the file extension (e.g., "pdf", "jpg").
                const fileExtension = file.name.split(".").pop()
                // Create a unique key for S3: 'uploads/' + UUID + extension.
                const key = `uploads/${uuidv4()}.${fileExtension}`

                // Execute the S3 upload command.
                await s3.send(
                    new PutObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET!,     // Bucket name from environment variables.
                        Key: key,       // The unique file path in the bucket.
                        Body: buffer,       // The file content.
                        ContentType: file.type,     // The MIME type (e.g., 'application/pdf').
                    })
                )

                // Construct the public access URL for the file and store it.
                filePaths.push(
                    `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
                )
            }
        }

        // Create the new item record in the database using Prisma.
        const item = await prisma.item.create({
            data: {
                type,
                title,
                description,
                theme,      // Stored as a string array.
                addedById: user.sub,
                url,        // Stored as a string array.
                filePath: filePaths,        // Stored as a string array containing S3 URLs.
            },
            include: {
                addedBy: {
                    select: {
                        id: true,
                        username: true,
                    }
                }
            }
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

