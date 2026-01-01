// app/api/items/[id]/route.ts

import { NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/prisma"

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const item = await prisma.item.findUnique({
            where: { id: params.id },
        })

        if (!item) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(item)
    } catch (error) {
        console.error("Error fetching item:", error)
        return NextResponse.json(
            { error: "Failed to fetch item" },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const formData = await req.formData()

        // Buscar item atual para verificar se tem arquivo antigo
        const currentItem = await prisma.item.findUnique({
            where: { id: params.id },
        })

        if (!currentItem) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            )
        }

        // Extrair dados do formulário
        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const theme = formData.get("theme") as string
        const addedBy = formData.get("addedBy") as string
        const url = formData.get("url") as string | null
        const file = formData.get("file") as File | null
        const removeFile = formData.get("removeFile") as string | null

        let filePath = currentItem.filePath

        // Se remover arquivo existente
        if (removeFile === "true" && currentItem.filePath) {
            // Remover arquivo do sistema de arquivos
            const fs = await import("fs")
            const filePathOnDisk = join(process.cwd(), "public", currentItem.filePath)

            if (fs.existsSync(filePathOnDisk)) {
                await unlink(filePathOnDisk)
            }

            filePath = null
        }

        // Processar novo upload de arquivo se existir
        if (file && file.size > 0) {
            // Remover arquivo antigo se existir
            if (currentItem.filePath) {
                const fs = await import("fs")
                const oldFilePath = join(process.cwd(), "public", currentItem.filePath)

                if (fs.existsSync(oldFilePath)) {
                    await unlink(oldFilePath)
                }
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Gerar nome único para o arquivo
            const uniqueFileName = `${uuidv4()}-${file.name}`
            const uploadDir = join(process.cwd(), "public", "uploads")

            // Criar diretório se não existir
            const fs = await import("fs")
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            const filePathOnDisk = join(uploadDir, uniqueFileName)
            await writeFile(filePathOnDisk, buffer)

            filePath = `/uploads/${uniqueFileName}`
        }

        // Atualizar item no banco de dados
        const item = await prisma.item.update({
            where: { id: params.id },
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
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Buscar item para verificar se tem arquivo associado
        const item = await prisma.item.findUnique({
            where: { id: params.id },
        })

        if (!item) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            )
        }

        // Remover arquivo do sistema de arquivos se existir
        if (item.filePath) {
            const fs = await import("fs")
            const filePath = join(process.cwd(), "public", item.filePath)

            if (fs.existsSync(filePath)) {
                await unlink(filePath)
            }
        }

        // Deletar item do banco de dados
        await prisma.item.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Error deleting item:", error)
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        )
    }
}