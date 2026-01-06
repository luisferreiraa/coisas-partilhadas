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
 * * @param {string} url - The full public URL of the S3 object. 
 * @returns {string} The S3 object key (e.g., 'uploads/uuid.ext').
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
 * This pattern is crucial for securely serving private or protected files stored in S3, ensuring access
 * is tied to a specific item ID and a valid file path.
 * @param {req: NextRequest} req - The incoming request object, used to extract query parameters. 
 * @param {context: { params: Promise<{ id: string }> }} context - Object containing route parameters (item ID).
 * @returns {Promise<NextResponse>} JSON response containing the signed download URL or an error message.
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        // Extract the target file URL from the query parameter 'file'.
        const fileUrl = req.nextUrl.searchParams.get("file")

        // Validation check for the required 'file' query parameter.
        if (!fileUrl) {
            return NextResponse.json(
                { error: "Missing file parameter" },
                { status: 400 }     // Bad Request
            )
        }

        // 1. Retrieve the item from the database using the ID from the route params.
        const item = await prisma.item.findUnique({
            where: { id },
        })

        // Validation check: 
        // 1. Ensure the item exists.
        // 2. Ensure the item has associated file paths.
        // 3. Ensure the requested `fileUrl` is actually one of the paths stored in the item's record (security check).
        if (!item || !item.filePath || !item.filePath.includes(fileUrl)) {
            return NextResponse.json(
                { error: "File not found for this item" },
                { status: 404 }
            )
        }

        // 2. Convert the public file URL back into the internal S3 object key.
        const key = getS3KeyFromUrl(fileUrl)

        // 3. Generate a pre-signed URL for the S3 object. This URL grants temporary access
        // for downloading the object, regardless of the bucket's public settings.
        const signedUrl = await getSignedUrl(
            s3,     // The S3 client instance.
            new GetObjectCommand({      // The command to get the object.
                Bucket: process.env.AWS_S3_BUCKET!,     // Target bucket.
                Key: key,       // The object's unique key.
            }),
            { expiresIn: 60 * 5 }       // The URL will expire in 5 minutes (60 seconds * 5).
        )

        // Return the temporary signed URL to the client.
        return NextResponse.json({ url: signedUrl })
    } catch (error) {
        // Log the error for server-side debugging.
        console.error("Error generating download URL:", error)
        // Return a 500 Internal Server Error response.
        return NextResponse.json(
            { error: "Failed to generate download URL" },
            { status: 500 }
        )
    }
}

