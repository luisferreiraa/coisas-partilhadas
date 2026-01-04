// app/api/items/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"     // Next.js server utilities for handling requests and responses.
import { v4 as uuidv4 } from "uuid"     // Import UUID generator for unique file naming.
import prisma from "@/lib/prisma"       // Import the Prisma client for database interactions.
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"      // AWS S3 commands for uploading and deleting objects.
import s3 from "@/lib/s3"       // Custom S3 client instance configured for AWS interaction.

/**
 * @function getS3KeyFromUrl
 * @description Extracts the S3 object key (the path within the bucket) from its public URL.
 * This is necessary before executing S3 operations like deletion.
 * @param {string} url - The full public URL of the S3 object. 
 * @returns {string} The S3 object key.
 */
function getS3KeyFromUrl(url: string) {
    const bucket = process.env.AWS_S3_BUCKET!       // Get the bucket name from env variables.
    const region = process.env.AWS_REGION!      // Get the region from en variables.
    // Construct the fixed prefix part of the S3 URL
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`
    // Remove the prefix from the URL to get onnly the object key.
    return url.replace(prefix, "")
}

/**
 * @async
 * @function GET
 * @description Handles HTTP GET requests to retrieve a single item by ID.
 * 
 * @param {_req: NextRequest} _req - The incoming request object.  
 * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters. 
 * @returns {Promise<NextResponse>} JSON response containing the item or an error message.
 */
export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Destructure the item ID from the route parameters.
        const { id } = await context.params

        // Query the database to find a unique item matching the ID.
        const item = await prisma.item.findUnique({
            where: { id },
        })

        // Check if the item was found.
        if (!item) {
            // Return a 404 Not Found response if the item does not exist.
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        // Return a successful 200 OK response with the fetched item as JSON.
        return NextResponse.json(item)
    } catch (error) {
        // Log the error for server-side debugging.
        console.error("Error fetching item:", error)
        // Return a 500 Internal Server Error response.
        return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
    }
}

/**
 * @async
 * @function PUT
 * @description Handles HTTP PUT requests to update an existing item by ID, including file handling (upload/replacement/removal).
 * 
 * @param {req: NextRequest} req - The incoming request object containing FormData.
 * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters.
 * @returns {Promise<NextResponse>} JSON response containing the updated item or an error message.
 */
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params     // Extract item ID from parameters.
        const formData = await req.formData()       // Parse the incoming request body as FormData.

        // 1. Current Item Retrieval
        // Fetch the current item data to check existence and retrieve existing file path.
        const currentItem = await prisma.item.findUnique({ where: { id } })
        if (!currentItem) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        // 2. Field Extraction from FormData
        // Extract all expected fields from the FormData.
        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        // const theme = formData.get("theme") as string

        const themes = formData.getAll("theme") as string[]

        const addedBy = formData.get("addedBy") as string
        // const url = formData.get("url") as string | null

        const urls = formData.getAll("url") as string[]

        // const file = formData.get("file") as File | null        // The uploaded file object (if present).

        const files = formData.getAll("files") as File[]

        // const removeFiles = formData.get("removeFile") as string | null      // Flag to explicitly remove existing file.

        const filesToRemove = formData.getAll("filesToRemove") as string[]

        // Initialize the final path to the current existing file path. This will be updated if a new file is uploaded or removed.
        let filePaths: string[] = currentItem.filePath || []

        // 3. Remove existing file
        // Check if the explicit removal flag is set AND if a file actually exists for the current item.
        // if (removeFiles === "true" && filePaths.length > 0) {

        //     for (const url of filePaths) {
        //         const key = getS3KeyFromUrl(url)
        //         await s3.send(new DeleteObjectCommand({
        //             Bucket: process.env.AWS_S3_BUCKET!,
        //             Key: key,
        //         }))
        //     }

        //     // Set the item's file path to null in preparation for database update.
        //     filePaths = []
        // }

        if (filesToRemove.length > 0) {
            for (const url of filesToRemove) {
                const key = getS3KeyFromUrl(url)
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: key,
                }))
                // remove do array final
                filePaths = filePaths.filter(f => f !== url)
            }
        }

        // 4. Replace / add new file
        // Check if a new file object was provided and is not empty.
        for (const file of files) {
            if (!file || file.size === 0) continue

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const extension = file.name.split(".").pop()
            const key = `uploads/${uuidv4()}.${extension}`

            await s3.send(new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: key,
                Body: buffer,
                ContentType: file.type,
            }))

            filePaths.push(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`)
        }

        // 5. Update Database
        // Execute the database update operation.
        const item = await prisma.item.update({
            where: { id },
            data: {
                // Use the new value if provided, otherwise retain the current value.
                type: type || currentItem.type,
                title: title || currentItem.title,
                description: description || currentItem.description,
                theme: themes.length > 0 ? themes : currentItem.theme,
                addedBy: addedBy || currentItem.addedBy,
                // Special handling for URL: if explicitly passed as null (empty string), update it, otherwise retain the current value.
                url: urls.length > 0 ? urls : currentItem.url,
                // Use the updated filePath determined by steps 3 and 4 (or the original if no changes).
                filePath: filePaths,
            },
        })

        // Return the successfully updated item.
        return NextResponse.json(item)
    } catch (error) {
        // Handle and log errors during the update process.
        console.error("Error updating item:", error)
        return NextResponse.json(
            { error: "Failed to update item" },
            { status: 500 }
        )
    }
}

/**
 * @async
 * @function DELETE
 * @description Handles HTTP DELETE requests to remove an item by ID, including its associated file in S3.
 * @param {_req: NextRequest} _req - The incoming request object (Unused here). 
 * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters (item ID).
 * @returns {Promise<NextResponse>} JSON response indicating success or an error message.
 */
export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params     // Extract item ID.

        // Retrieve the item to check existence and get the file path for S3 deletion.
        const item = await prisma.item.findUnique({ where: { id } })

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        // Delete file in S3
        // Check if an associated file exists.
        if (item.filePath && item.filePath.length > 0) {
            for (const url of item.filePath) {
                const key = getS3KeyFromUrl(url)
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: key,
                }))
            }
        }

        // Delete database record
        // Delete the item record from the database.
        await prisma.item.delete({ where: { id } })

        // Return success response.
        return NextResponse.json({ ok: true })
    } catch (error) {
        // Handle and log errors during the deletion process.
        console.error("Error deleting item:", error)
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        )
    }
}

