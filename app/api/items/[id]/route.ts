// app/api/items/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/prisma"

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const item = await prisma.item.findUnique({
            where: { id },
        })

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        return NextResponse.json(item)
    } catch (error) {
        console.error("Error fetching item:", error)
        return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const formData = await req.formData()

        const currentItem = await prisma.item.findUnique({ where: { id } })
        if (!currentItem) return NextResponse.json({ error: "Item not found" }, { status: 404 })

        const type = formData.get("type") as string
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const theme = formData.get("theme") as string
        const addedBy = formData.get("addedBy") as string
        const url = formData.get("url") as string | null
        const file = formData.get("file") as File | null
        const removeFile = formData.get("removeFile") as string | null

        let filePath = currentItem.filePath

        if (removeFile === "true" && currentItem.filePath) {
            const filePathOnDisk = join(process.cwd(), "public", currentItem.filePath)
            await unlink(filePathOnDisk).catch(() => { })
            filePath = null
        }

        if (file && file.size > 0) {
            if (currentItem.filePath) {
                const oldFilePath = join(process.cwd(), "public", currentItem.filePath)
                await unlink(oldFilePath).catch(() => { })
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            const uniqueFileName = `${uuidv4()}-${file.name}`
            const uploadDir = join(process.cwd(), "public", "uploads")
            await import("fs").then(fs => fs.mkdirSync(uploadDir, { recursive: true }))
            const filePathOnDisk = join(uploadDir, uniqueFileName)
            await writeFile(filePathOnDisk, buffer)
            filePath = `/uploads/${uniqueFileName}`
        }

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
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const item = await prisma.item.findUnique({ where: { id } })
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

        if (item.filePath) {
            const filePath = join(process.cwd(), "public", item.filePath)
            await unlink(filePath).catch(() => { })
        }

        await prisma.item.delete({ where: { id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Error deleting item:", error)
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }
}
