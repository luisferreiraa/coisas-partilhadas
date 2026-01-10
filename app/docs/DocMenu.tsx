// app/docs/DocMenu.tsx

"use client"

import { Folder, File as FileIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export interface DocItem {
    name: string
    path: string
    type: "file" | "folder"
    children?: DocItem[]
}

interface DocMenuProps {
    tree: DocItem[]
    currentPath?: string
}

export default function DocMenu({ tree }: DocMenuProps) {
    const pathname = usePathname() || "/docs"

    const getSlugFromPath = (path: string) => `/docs/${path}`

    const isOpen = (itemPath: string) => {
        const slug = getSlugFromPath(itemPath)
        return pathname.startsWith(slug)
    }

    const renderItem = (item: DocItem) => {
        if (item.type === "file") {
            return (
                <li key={item.path}>
                    <Link
                        href={getSlugFromPath(item.path)}
                        className={`flex items-center gap-2 ${pathname === getSlugFromPath(item.path) ? "font-bold" : ""
                            }`}
                    >
                        <FileIcon size={15} />
                        {item.name}
                    </Link>
                </li>
            )
        }

        // Folder
        return (
            <li key={item.path}>
                <details open={isOpen(item.path)}>
                    <summary className="flex items-center gap-2 cursor-pointer">
                        <Folder size={15} />
                        {item.name}
                    </summary>
                    <ul className="ml-4">
                        {item.children?.map((child) => renderItem(child))}
                    </ul>
                </details>
            </li>
        )
    }

    return (
        <nav className="w-64 p-4 border-r">
            <h2 className="font-bold mt-5 mb-4">Docs</h2>
            <ul>{tree.map((item) => renderItem(item))}</ul>
        </nav>
    )
}