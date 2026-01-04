// app/api/items/[id]/download/route.ts

import { NextRequest, NextResponse } from "next/server"     // Next.js server utilities for handling requests and responses.
import { GetObjectCommand } from "@aws-sdk/client-s3"       // AWS S3 command for retrieving an object.
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"        // Utility to generate a temporary, signed URL for S3 access.
import prisma from "@/lib/prisma"       // Import the Prisma client for database interactions.
import s3 from "@/lib/s3"       // Custom S3 client instance configured for AWS interaction.

/**
 * @function getS3KeyFromUrl
 * @description Extracts the S3 object key (the path within the bucket) from its full public URL.
 * This key is required for S3 operations like GetObjectCommand.
 * 
 * @param {string} url - The full public URL of the S3 object. 
 * @returns {string} The S3 object key.
 */
function getS3KeyFromUrl(url: string) {
    const bucket = process.env.AWS_S3_BUCKET!       // Get the bucket name from env variables.
    const region = process.env.AWS_REGION!      // Get the region from env variables.
    // Construct the fixed prefix part of the S3 URL.
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`
    // Remove the prefix from the URL to get only the object key.
    return url.replace(prefix, "")
}

/**
 * @async
 * @function GET
 * @description Handles HTTP GET requests to generate a secure, time-limited re-signed URL for file download.
 * This pattern is used to securely serve private or protected files stored in S3.
 * @param {_req: NextRequest} _req - The incoming request object (unused). 
 * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters (item ID).
 * @returns {Promise<NextResponse>} JSON response containing the signed download URL or an error message.
 */
// export async function GET(
//     _req: NextRequest,
//     context: { params: Promise<{ id: string }> }
// ) {
//     try {
//         const { id } = await context.params     // Extract the item ID from the route parameters.

//         // 1. Retrieve the item from the database.
//         const item = await prisma.item.findUnique({ where: { id } })

//         // Check if the item exists OR if it has an associated file path.
//         if (!item || !item.filePath) {
//             // If file is not found (either item is missing or file path is missing), return 404.
//             return NextResponse.json(
//                 { error: "File not found" },
//                 { status: 404 }
//             )
//         }

//         // 2. Extract the S3 key.
//         const key = getS3KeyFromUrl(item.filePath)

//         // 3. Generate the pre-signed URL.
//         const signedUrl = await getSignedUrl(
//             s3,     // The S3 client instance.
//             new GetObjectCommand({      // The command defining the action (getting the object).
//                 Bucket: process.env.AWS_S3_BUCKET!,     // Target bucket.
//                 Key: key,
//             }),
//             { expiresIn: 60 * 5 }       // Configuration: The URL expires after 5 minutes (60 seconds * 5).
//         )

//         // 4. Return the generated signed URL to the client.
//         return NextResponse.json({ url: signedUrl })
//     } catch (error) {
//         // Handle and log errors during the URL generation process.
//         console.error("Error generating download URL:", error)
//         return NextResponse.json(
//             { error: "Failed to generate download URL" },
//             { status: 500 }
//         )
//     }
// }

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        // 🔹 URL do ficheiro pedida pelo frontend
        const fileUrl = req.nextUrl.searchParams.get("file")

        if (!fileUrl) {
            return NextResponse.json(
                { error: "Missing file parameter" },
                { status: 400 }
            )
        }

        // 1. Obter o item
        const item = await prisma.item.findUnique({
            where: { id },
        })

        if (!item || !item.filePath || !item.filePath.includes(fileUrl)) {
            return NextResponse.json(
                { error: "File not found for this item" },
                { status: 404 }
            )
        }

        // 2. Extrair a key do S3
        const key = getS3KeyFromUrl(fileUrl)

        // 3. Gerar URL assinada
        const signedUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: key,
            }),
            { expiresIn: 60 * 5 }
        )

        return NextResponse.json({ url: signedUrl })
    } catch (error) {
        console.error("Error generating download URL:", error)
        return NextResponse.json(
            { error: "Failed to generate download URL" },
            { status: 500 }
        )
    }
}

