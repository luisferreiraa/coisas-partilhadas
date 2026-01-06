// app/items/[id]/ItemDetailClient.tsx

"use client"

import { useState } from "react" // Imports the standard React hook for managing state.
import { Copy, Download, ExternalLink } from "lucide-react" // Imports icons for copying, downloading, and external linking.
import { Item } from "@/lib/types" // Imports the type definition for the Item object.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // UI components for displaying content in a structured card.
import { Button } from "@/components/ui/button" // UI component for interactive buttons.
import { Badge } from "@/components/ui/badge" // UI component for displaying categorized labels (tags).

/**
 * @function ItemDetailClient
 * @description A client-side component responsible for rendering the detailed information of a single item.
 * It provides interactivity such as copying the item's URL and initiating file downloads/link navigation.
 * * @param {{ item: Item }} props - The props object containing the detailed item data.
 * @returns {JSX.Element} The rendered item detail view.
 */
export function ItemDetailClient({ item }: { item: Item }) {
    // State to track if the link has just been copied, used to provide temporary visual feedback.
    const [copied, setCopied] = useState(false)

    /**
     * @function handleCopyLink
     * @description Copies the current page URL (which is the permalink for the item) to the clipboard.
     * It uses the browser's `navigator.clipboard` API and sets a temporary `copied` state.
     */
    const handleCopyLink = () => {
        // Construct the full URL for the current item and write it to the clipboard.
        navigator.clipboard.writeText(`${window.location.origin}/items/${item.id}`)
        setCopied(true)
        // Reset the copied state after 1.5 seconds.
        setTimeout(() => setCopied(false), 1500)
    }

    /**
     * @function downloadItem
     * @description Initiates the file download or opens the file in a new browser tab/window.
     * @param {string} url - The URL (typically a signed S3 URL) of the file to be downloaded.
     */
    const downloadItem = (url: string) => window.open(url, "_blank")

    // The component's rendered output.
    return (
        <Card>
            <CardHeader>
                {/* Header section containing badges and the copy button. */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-1">
                        <Badge>{item.type}</Badge>
                        {/* Iterate over the theme array, rendering a badge for each theme. */}
                        {(item.theme ?? []).map((t) => <Badge key={t}>{t}</Badge>)}
                    </div>
                    {/* Copy Link Button */}
                    <Button size="icon" onClick={handleCopyLink} title="Copiar link">
                        {/* Display a checkmark icon if copied is true, otherwise display the Copy icon. */}
                        <Copy />
                    </Button>
                </div>
                {/* Item title and description. */}
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Render external URLs (if any). */}
                {(item.url ?? []).map((url, idx) => (
                    <Button key={idx} size="sm" variant="outline" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink />
                            Link {idx + 1}      {/* Displaying a sequential link number. */}
                        </a>
                    </Button>
                ))}
                {/* Render file download buttons (if any file paths exist). */}
                {(item.filePath ?? []).map((fp, idx) => (
                    <Button key={idx} size="sm" variant="outline" onClick={() => downloadItem(fp)}>
                        <Download /> {fp.split("/").pop()}
                    </Button>
                ))}
            </CardContent>
        </Card>
    )
}
