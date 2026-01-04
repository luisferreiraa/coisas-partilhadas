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
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const page = Math.max(
            1,
            Number(searchParams.get("page") ?? "1")
        )

        const pageSize = 10
        const skip = (page - 1) * pageSize

        // Buscar items paginados
        const items = await prisma.item.findMany({
            orderBy: { addedAt: "desc" },
            skip,
            take: pageSize,
        })

        // Total de items (para saber quantas páginas existem)
        const totalItems = await prisma.item.count()

        return NextResponse.json({
            items,
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

        // const theme = formData.get("theme") as string

        let themeRaw = formData.getAll("theme") as string[]
        if (themeRaw.length === 1 && themeRaw[0].includes(",")) {
            themeRaw = themeRaw[0].split(",").map((t) => t.trim())
        }

        const theme = themeRaw

        const addedBy = formData.get("addedBy") as string

        // Extract optional fields.
        // 'url' is string or null, 'file' is a File object or null.
        // const url = formData.get("url") as string | null
        // const file = formData.get("file") as File | null

        let urlRaw = formData.getAll("url") as string[]
        if (urlRaw.length === 1 && urlRaw[0].includes(",")) {
            urlRaw = urlRaw[0].split(",").map((u) => u.trim())
        }
        const url = urlRaw.length > 0 ? urlRaw : []

        // Initialize filePath variable, which will store the public URL of the uploaded file, or null if no file is uploaded.
        // let filePath: string | null = null

        const files = formData.getAll("files") as File[]
        const filePaths: string[] = []

        for (const file of files) {
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

                filePaths.push(
                    `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
                )
            }
        }

        // Check if a file object exists and has a size greater than 0 bytes.
        // if (file && file.size > 0) {
        //     // Convert the file object's data into an ArrayBuffer asynchronously.
        //     const bytes = await file.arrayBuffer()
        //     // Convert the ArrayBuffer into a Node.js Buffer object, required by the AWS SDK for efficient transfer.
        //     const buffer = Buffer.from(bytes)

        //     // Extract the file extension from the original file name.
        //     const fileExtension = file.name.split(".").pop()
        //     // Construct the unique storage key (path) for the file in the S3 bucket.
        //     // It uses a UUID to prevent naming conflicts, appended with the original file extensions.
        //     const key = `uploads/${uuidv4()}.${fileExtension}`

        //     // Send the command to the S3 service to upload the object.
        //     await s3.send(
        //         new PutObjectCommand({
        //             Bucket: process.env.AWS_S3_BUCKET!,     // Mandatory: The name of the S3 bucket('!' assertts non nullity).
        //             Key: key,       // Mandatory: The unique path/name of the object in the bucket.
        //             Body: buffer,       // Mandatory: The content of the file (the Buffer).
        //             ContentType: file.type,     // Recommended: The MIME type of the file.
        //         })
        //     )

        //     // Constructs the public URL for the newly uploaded file based on AWS convention.
        //     // This URL allows direct access to the file using the bucket name, region, and key.
        //     filePath = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

        // Create the new item record in the database using Prisma.
        const item = await prisma.item.create({
            data: {
                type,
                title,
                description,
                theme,
                addedBy,
                url,
                filePath: filePaths,
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

