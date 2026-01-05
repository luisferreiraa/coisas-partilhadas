
// app/items/[id]/page.tsx
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ItemDetailClient } from "./ItemDetailClient"
import { ItemType } from "@/lib/types"

export default async function ItemPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    // Await params no Next.js 15+
    const { id } = await params

    const item = await prisma.item.findUnique({
        where: { id }
    })

    if (!item) return notFound()

    return (
        <ItemDetailClient
            item={{
                ...item,
                type: item.type as ItemType,
                addedAt: item.addedAt.toISOString()
            }}
        />
    )
}