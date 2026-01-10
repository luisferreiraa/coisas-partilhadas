// app/docs/DocMenu.tsx

// Directive required for Next.js components that use client-side features like hooks (e.g., usePathname).
"use client"

import { Folder, File as FileIcon } from "lucide-react" // Imports Lucide icons for folder and file representation.
import Link from "next/link" // Imports Next.js Link component for client-side navigation.
import { usePathname } from "next/navigation" // Imports hook to get the current URL pathname.

/**
 * @typedef {Object} DocItem
 * @description Defines the structure for a single item (file or folder) in the documentation tree.
 * @property {string} name - The display name of the file or folder.
 * @property {string} path - The relative path fragment used to construct the full URL slug.
 * @property {"file" | "folder"} type - The type of the item.
 * @property {DocItem[]} [children] - Optional array of child DocItems, present only if the type is "folder".
 */
export interface DocItem {
    name: string
    path: string
    type: "file" | "folder"
    children?: DocItem[]
}

/**
 * @typedef {Object} DocMenuProps
 * @description Defines the props for the DocMenu component.
 * @property {DocItem[]} tree - The hierarchical array representing the documentation structure.
 * @property {string} [currentPath] - Optional prop for the current path (appears unused in current implementation as usePathname is used).
 */
interface DocMenuProps {
    tree: DocItem[]
    currentPath?: string
}

/**
 * @function DocMenu
 * @description Renders a recursive, tree-like sidebar menu for navigating documentation files and folders.
 *
 * @param {DocMenuProps} props - The component props, primarily containing the 'tree' data structure.
 * @returns {JSX.Element} The documentation navigation menu.
 */
export default function DocMenu({ tree }: DocMenuProps) {
    // Retrieves the current URL pathname. Defaults to "/docs" if pathname is null (e.g., during static generation fallback).
    const pathname = usePathname() || "/docs"

    /**
     * @function getSlugFromPath
     * @description Constructs the full public URL path for a doc item.
     * @param {string} path - The relative path fragment (e.g., 'getting-started/introduction').
     * @returns {string} The full URL slug (e.g., '/docs/getting-started/introduction').
     */
    const getSlugFromPath = (path: string) => `/docs/${path}`

    /**
     * @function isOpen
     * @description Determines if a folder should be rendered in the 'open' state.
     * A folder is open if the current pathname starts with the folder's slug, meaning
     * a child file or the folder itself is currently active.
     * @param {string} itemPath - The path fragment of the folder item.
     * @returns {boolean} True if the current route is within this item's path hierarchy.
     */
    const isOpen = (itemPath: string) => {
        const slug = getSlugFromPath(itemPath)
        return pathname.startsWith(slug)
    }

    /**
     * @function renderItem
     * @description Recursively renders a single DocItem, handling both file and folder types.
     *
     * @param {DocItem} item - The documentation item to render.
     * @returns {JSX.Element} The rendered list item (<li>).
     */
    const renderItem = (item: DocItem) => {
        // Renders a file item.
        if (item.type === "file") {
            // CRITICAL MISSING COMMENT: The use of `font-bold` here correctly styles the link
            // if its calculated slug exactly matches the current pathname, visually indicating the active page.
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

        // Renders a folder item (type === "folder").
        // Uses the native HTML <details> element for collapsible functionality.
        return (
            <li key={item.path}>
                <details open={isOpen(item.path)}> {/* Folder is open if its path is a prefix of the current URL. */}
                    <summary className="flex items-center gap-2 cursor-pointer">
                        <Folder size={15} />
                        {item.name}
                    </summary>
                    {/* Recursive call to render children, indented by ml-4. */}
                    <ul className="ml-4">
                        {item.children?.map((child) => renderItem(child))}
                    </ul>
                </details>
            </li>
        )
    }

    // Main component rendering.
    return (
        <nav className="w-64 p-4 border-r"> {/* Styling for the fixed-width sidebar with a right border. */}
            <h2 className="font-bold mt-5 mb-4">Docs</h2> {/* Title of the menu. */}
            <ul>{tree.map((item) => renderItem(item))}</ul> {/* Starts the recursive rendering of the tree structure. */}
        </nav>
    )
}