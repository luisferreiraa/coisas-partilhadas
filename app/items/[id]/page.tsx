// app/items/[id]/page.tsx

import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ItemDetailClient } from "./ItemDetailClient"
import { ItemType } from "@/lib/types"

/**
 * @async
 * @function ItemPage
 * @description Next.js Server Component for the dynamic route `/items/[id]`.
 * This component is responsible for server-side data fetching of a single item
 * based on its ID, and preparing the data before passing it to a client component.
 * * @param {{ params: Promise<{ id: string }> }} props - The props object containing the route parameters.
 * @returns {Promise<JSX.Element>} The ItemDetailClient component rendered with the item data.
 * @throws {Error} If the item is not found, Next.js's `notFound()` utility is called.
 */
export default async function ItemPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    // Destructure the item ID from the route parameters. Awaiting `params` is necessary
    // for accessing dynamic route segments in async Server Components.
    const { id } = await params

    // Fetch the unique item record from the database matching the provided ID.
    const item = await prisma.item.findUnique({
        where: { id }
    })

    // If no item is found with the given ID, execute Next.js's `notFound` utility,
    // which halts execution and renders the application's 404 page.
    if (!item) return notFound()

    // Pass the fetched item data to the client component (`ItemDetailClient`) for interactive rendering.
    // Data must be serialized for client-side use:
    // 1. `addedAt` (a Date object from Prisma) is converted to an ISO string.
    // 2. `type` is explicitly type-casted to ensure type safety in the client component.
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