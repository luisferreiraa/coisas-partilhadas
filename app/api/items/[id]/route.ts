// // app/api/items/[id]/route.ts

// import { NextRequest, NextResponse } from "next/server"     // Next.js utilities for handling requests and responses.
// import { writeFile, unlink } from "fs/promises"     // Asynchronous functions for file system operations (write and delete).
// import { join } from "path"     // Utility for constructing absolute file paths.
// import { v4 as uuidv4 } from "uuid"     // Library for generating UUIDs for unique filenames.
// import prisma from "@/lib/prisma"       // Imports the configured Prisma client instance.

// /**
//  * @async
//  * @function GET
//  * @description Handles HTTP GET requests to retrieve a single item by ID.
//  * 
//  * @param {_req: NextRequest} _req - The incoming request object.  
//  * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters. 
//  * @returns {Promise<NextResponse>} JSON response containing the item or an error message.
//  */
// export async function GET(
//     _req: NextRequest,
//     context: { params: Promise<{ id: string }> }
// ) {
//     try {
//         // Destructure the item ID from the route parameters.
//         const { id } = await context.params

//         // Query the database to find a unique item matching the ID.
//         const item = await prisma.item.findUnique({
//             where: { id },
//         })

//         // Check if the item was found.
//         if (!item) {
//             // Return a 404 Not Found response if the item does not exist.
//             return NextResponse.json({ error: "Item not found" }, { status: 404 })
//         }

//         // Return a successful 200 OK response with the fetched item as JSON.
//         return NextResponse.json(item)
//     } catch (error) {
//         // Log the error for server-side debugging.
//         console.error("Error fetching item:", error)
//         // Return a 500 Internal Server Error response.
//         return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
//     }
// }

// /**
//  * @async
//  * @function PUT
//  * @description Handles HTTP PUT requests to update an existing item by ID, including file handling (upload/replacement/removal).
//  * 
//  * @param {req: NextRequest} req - The incoming request object containing FormData.
//  * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters.
//  * @returns {Promise<NextResponse>} JSON response containing the updated item or an error message.
//  */
// export async function PUT(
//     req: NextRequest,
//     context: { params: Promise<{ id: string }> }
// ) {
//     try {
//         // Extract the item ID from the route parameters.
//         const { id } = await context.params
//         // Parse the request body as FormData for handling potential file uploads.
//         const formData = await req.formData()

//         // 1. Fetch the current item details to handle existing file paths and default values.
//         const currentItem = await prisma.item.findUnique({ where: { id } })
//         if (!currentItem) return NextResponse.json({ error: "Item not found" }, { status: 404 })

//         // 2. Fetch the current item details to handle existing file paths and default values.
//         const type = formData.get("type") as string
//         const title = formData.get("title") as string
//         const description = formData.get("description") as string
//         const theme = formData.get("theme") as string
//         const addedBy = formData.get("addedBy") as string
//         const url = formData.get("url") as string | null
//         const file = formData.get("file") as File | null
//         // Flag indicating the file path to the current itemn's path.
//         const removeFile = formData.get("removeFile") as string | null

//         // Initialize the file path to the current item's path.
//         let filePath = currentItem.filePath

//         // 3. Handle File Removal: Check if the 'removeFile' flag is true and a file currently exists.
//         if (removeFile === "true" && currentItem.filePath) {
//             // Construct the absolute path to the file on disk (in the public directory).
//             const filePathOnDisk = join(process.cwd(), "public", currentItem.filePath)
//             // Attempt to delete the file.
//             // The .catch(() => {}) supresses errors if the file is already gone or permissions fail.
//             await unlink(filePathOnDisk).catch(() => { })
//             // Clear the database file path entry.
//             filePath = null
//         }

//         // 4. Handle New File Upload/Replacement: Check if a new file was provided.
//         if (file && file.size > 0) {
//             // If an old file exists, delete it first.
//             if (currentItem.filePath) {
//                 const oldFilePath = join(process.cwd(), "public", currentItem.filePath)
//                 await unlink(oldFilePath).catch(() => { })
//             }

//             // Read the new file data.
//             const bytes = await file.arrayBuffer()
//             const buffer = Buffer.from(bytes)

//             // Generate a unique filename and define the upload directory.
//             const uniqueFileName = `${uuidv4()}-${file.name}`
//             const uploadDir = join(process.cwd(), "public", "uploads")

//             // Ensure the upload directory exists.
//             await import("fs").then(fs => fs.mkdirSync(uploadDir, { recursive: true }))

//             // Write the new file to disk.
//             const filePathOnDisk = join(uploadDir, uniqueFileName)
//             await writeFile(filePathOnDisk, buffer)

//             // Update the database file path entry.
//             filePath = `/uploads/${uniqueFileName}`
//         }

//         // 5. Update the Database Record.
//         const item = await prisma.item.update({
//             where: { id },
//             data: {
//                 // Use the new value if provided, otherwise stick with the current item's value.
//                 type: type || currentItem.type,
//                 title: title || currentItem.title,
//                 description: description || currentItem.description,
//                 theme: theme || currentItem.theme,
//                 addedBy: addedBy || currentItem.addedBy,
//                 // Special handling for URL: if the client explicitly sent null (empty string), update it to null.
//                 url: url !== null ? url : currentItem.url,
//                 // Use the updated 'filePath' (either null, old, or new file path).
//                 filePath,
//             },
//         })

//         // Return the fully updated item object.
//         return NextResponse.json(item)
//     } catch (error) {
//         // Log the error and return a 500 status.
//         console.error("Error updating item:", error)
//         return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
//     }
// }

// export async function DELETE(
//     _req: NextRequest,
//     context: { params: Promise<{ id: string }> }
// ) {
//     try {
//         // Extract the item ID.
//         const { id } = await context.params

//         // Verify the item exists before attempting to delete.
//         const item = await prisma.item.findUnique({ where: { id } })
//         if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

//         // Of a file path is associated with the item, delete the file from the disk.
//         if (item.filePath) {
//             const filePath = join(process.cwd(), "public", item.filePath)
//             // Attempt to delete the file, suppressing errors on failure.
//             await unlink(filePath).catch(() => { })
//         }

//         // Delete the item record from the database.
//         await prisma.item.delete({ where: { id } })

//         // Return a successful response.
//         return NextResponse.json({ ok: true })
//     } catch (error) {
//         // Log the error and return a 500 status.
//         console.error("Error deleting item:", error)
//         return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
//     }
// }

// app/api/items/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"     // Next.js utilities for handling requests and responses.
import { v4 as uuidv4 } from "uuid"     // Library for generating UUIDs for unique filenames.
import prisma from "@/lib/prisma"       // Imports the configured Prisma client instance.
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import s3 from "@/lib/s3"

function getS3KeyFromUrl(url: string) {
    const bucket = process.env.AWS_S3_BUCKET!
    const region = process.env.AWS_REGION!
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`
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
        const { id } = await context.params
        const formData = await req.formData()

        // 1. Item atual
        const currentItem = await prisma.item.findUnique({ where: { id } })
        if (!currentItem) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        // 2. Campos
        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const theme = formData.get("theme") as string
        const addedBy = formData.get("addedBy") as string
        const url = formData.get("url") as string | null
        const file = formData.get("file") as File | null
        const removeFile = formData.get("removeFile") as string | null

        let filePath = currentItem.filePath

        // 3. Remover ficheiro atual
        if (removeFile === "true" && currentItem.filePath) {
            const key = getS3KeyFromUrl(currentItem.filePath)

            await s3.send(
                new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: key,
                })
            )

            filePath = null
        }

        // 4. Substituir / adicionar novo ficheiro
        if (file && file.size > 0) {
            // apagar ficheiro antigo
            if (currentItem.filePath) {
                const oldKey = getS3KeyFromUrl(currentItem.filePath)

                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET!,
                        Key: oldKey,
                    })
                )
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const extension = file.name.split(".").pop()
            const key = `uploads/${uuidv4()}.${extension}`

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

        // 5. Update BD
        const item = await prisma.item.update({
            where: { id },
            data: {
                type: type || currentItem.type,
                title: title || currentItem.title,
                description: description || currentItem.description,
                theme: theme || currentItem.theme,
                addedBy: addedBy || currentItem.addedBy,
                url: url !== null ? url : currentItem.url,
                filePath,
            },
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error("Error updating item:", error)
        return NextResponse.json(
            { error: "Failed to update item" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const item = await prisma.item.findUnique({ where: { id } })
        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        // Apagar ficheiro no S3
        if (item.filePath) {
            const key = getS3KeyFromUrl(item.filePath)

            await s3.send(
                new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: key,
                })
            )
        }

        // Apagar registo
        await prisma.item.delete({ where: { id } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Error deleting item:", error)
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        )
    }
}

