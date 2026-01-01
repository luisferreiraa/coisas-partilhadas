// app/api/items/route.ts

import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const items = await prisma.item.findMany({
            orderBy: { addedAt: "desc" },
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error("Error fetching items:", error)
        return NextResponse.json(
            { error: "Failed to fetch items" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()

        // Extrair dados do formulário
        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const theme = formData.get("theme") as string
        const addedBy = formData.get("addedBy") as string
        const url = formData.get("url") as string | null
        const file = formData.get("file") as File | null

        let filePath = null

        // Processar upload do arquivo se existir
        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Gerar nome único para o arquivo
            const uniqueFileName = `${uuidv4()}-${file.name}`
            const uploadDir = join(process.cwd(), "public", "uploads")

            // Em produção, você deve usar um serviço de storage como AWS S3
            // Esta é uma implementação básica para desenvolvimento

            // Criar diretório se não existir
            const fs = await import("fs")
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            const filePathOnDisk = join(uploadDir, uniqueFileName)
            await writeFile(filePathOnDisk, buffer)

            filePath = `/uploads/${uniqueFileName}`
        }

        // Criar item no banco de dados
        const item = await prisma.item.create({
            data: {
                type,
                title,
                description,
                theme,
                addedBy,
                url: url || null,
                filePath,
            },
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error("Error creating item:", error)
        return NextResponse.json(
            { error: "Failed to create item" },
            { status: 500 }
        )
    }
}
