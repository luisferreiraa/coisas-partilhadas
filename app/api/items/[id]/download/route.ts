import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import prisma from "@/lib/prisma"
import s3 from "@/lib/s3"

function getS3KeyFromUrl(url: string) {
    const bucket = process.env.AWS_S3_BUCKET!
    const region = process.env.AWS_REGION!
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`
    return url.replace(prefix, "")
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const item = await prisma.item.findUnique({ where: { id } })
        if (!item || !item.filePath) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            )
        }

        // 🔐 aqui podes validar o utilizador autenticado

        const key = getS3KeyFromUrl(item.filePath)

        const signedUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: key,
            }),
            { expiresIn: 60 * 5 } // 5 minutos
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
