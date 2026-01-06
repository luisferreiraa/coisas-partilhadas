// components/item-card.tsx

"use client"        // Marks this component as a Client Component, enabling hooks and interactivity.

import { useState } from "react"        // Import the useState hook for managing local state (dialog visibility).
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"        // UI components for displaying content in a card format.
import { Badge } from "@/components/ui/badge"       // UI component for displaying small, categorized labels (tags).
import { Button } from "@/components/ui/button"     // UI component for interactive buttons.
import { Edit, ExternalLink, Trash2, File, FileText, Download, Heart, MoreHorizontal, Copy } from "lucide-react"     // Icons for editing, linking, deleting, and file types.
import type { Item, ItemWithFavorite } from "@/lib/types"     // Type definition for an individual item object.
import { useItems } from "@/lib/items-context"      // Custom hook to access item management functions (like deleteItem).
import { ItemDialog } from "@/components/item-dialog"       // Modal dialog used for editing the item.
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"       // UI components for displaying a confirmation modal (for deletion).
import { useAuth } from "@/lib/auth-context"        // Custom hook to access authentication context, likely for user ID/permissions check (though the user object is not currently used for permission checks on the actions).

/**
 * @async
 * @function downloadItem
 * @description Initiates the process to download an associated file by making an API request.
 * The API endpoint handles file retrieval and generates a pre-signed URL for direct download.
 *
 * @param {string} itemId - The unique ID of the item associated with the file.
 * @param {string} fileUrl - The stored path or key of the file in the storage service.
 * @returns {Promise<void>}
 */
async function downloadItem(itemId: string, fileUrl: string) {
    // Sends a request to the local API route responsible for generating the file download link.
    const res = await fetch(
        `/api/items/${itemId}/download?file=${encodeURIComponent(fileUrl)}`
    )

    if (!res.ok) {
        // If the API call fails, notify the user.
        alert("Erro ao gerar download")
        return
    }

    // Extracts the temporary, pre-signed download URL from the successful API response.
    const { url } = await res.json()
    // Redirects the browser to the generated URL, which triggers the file download.
    window.location.href = url
}


/**
 * @function ItemCard
 * @description Displays the details of a single shared item, along with actions for editing,
 * deleting, favoring, viewing external links, and downloading associated files.
 *
 * @param {{ item: ItemWithFavorite }} props - The item object to display, including the `isFavorite` status.
 * @returns {JSX.Element} The rendered item card component.
 * if the currently authenticated user is not the owner (`item.addedBy`) or an administrator.
 */
export function ItemCard({ item }: { item: ItemWithFavorite }) {
    // Accesses the item context methods.
    const { deleteItem } = useItems()
    const { toggleFavorite } = useItems()

    // State to control the visibility of the Edit Item dialog modal.
    const [isEditOpen, setIsEditOpen] = useState(false)
    // State to control the visibility of the Delete confirmation dialog modal.
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    // State to control the visibility of the "More Options" sharing popover.
    const [isShareOpen, setIsShareOpen] = useState(false)

    // Retrieves the current user data from the authentication context.
    const { user } = useAuth()

    // Formats the item's `addedAt` timestamp into a localized short date string for display.
    const date = new Date(item.addedAt).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })

    /**
     * @function getFileIcon
     * @description Determines the appropriate Lucide icon component based on the file extension.
     *
     * @param {string | null} filePath - The full path to the file.
     * @returns {JSX.Element} The corresponding icon component or a default file icon.
     */
    const getFileIcon = (filePath: string | null) => {
        if (!filePath) return <File className="w-3 h-3 mr-1" />

        // Extract the file extension from the path.
        const extension = filePath.split('.').pop()?.toLowerCase()

        // Check for specific file types (e.g., PDF)
        if (['pdf'].includes(extension || '')) {
            return <FileText className="w-3 h-3 mr-1" />
        }

        // Default icon for other file types.
        return <File className="w-3 h-3 mr-1" />
    }

    /**
    * @function getFileName
    * @description Extracts a user-friendly file name from the stored file path.
    * It assumes the path is prefixed with a UUID followed by a hyphen before the original file name,
    * and removes that UUID prefix.
    * @param {string | null} filePath - The file path (e.g., /uploads/uuid-original-name.pdf).
    * @returns {string} The cleaned filename or a default string.
    */
    const getFileName = (filePath: string | null) => {
        if (!filePath) return "Ficheiro"

        // Splits the path by the directory separator to get the last part (the filename).
        const parts = filePath.split('/')
        const fileNameWithExt = parts[parts.length - 1]

        // Finds the index of the last hyphen, which is expected to separate the UUID prefix from the original name.
        const lastHyphenIndex = fileNameWithExt.lastIndexOf('-')

        // If a hyphen is found, return the substring starting right after the hyphen.
        if (lastHyphenIndex !== -1) {
            return fileNameWithExt.substring(lastHyphenIndex + 1)
        }

        // Return the full filename if no hyphen is found (or a default if somehow empty).
        return fileNameWithExt || "Ficheiro"
    }

    /**
     * @function formatType
     * @description Formats the item type string to be displayed with the first letter capitalized.
     * @param {string} type - The raw item type string (e.g., 'document').
     * @returns {string} The formatted type string (e.g., 'Document').
     */
    const formatType = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    /**
     * @function handleCopyLink
     * @description Constructs the canonical URL for the item and copies it to the user's clipboard.
     *
     * @param {string} itemId - The ID of the item to construct the link for.
     */
    const handleCopyLink = (itemId: string) => {
        // Constructs the full link using the current origin and a hypothetical item route.
        const link = `${window.location.origin}/items/${itemId}`
        // Attempts to write the link to the clipboard.
        navigator.clipboard.writeText(link)
            .then(() => alert("Link copiado."))     // Success feedback.
            .catch(() => alert("Não foi possível copiar o link."))      // Failure feedback.

        // Closes the share popover after the action is attempted.
        setIsShareOpen(false)
    }

    // Logic to display only the first two themes directly.
    const visibleThemes = item.theme.slice(0, 2)
    // All themes beyond the first two are considered hidden/overflow.
    const hiddenThemes = item.theme.slice(2)

    // The component's JSX structure.
    return (
        <>
            {/* The main card component with a visual feedback effect on hover. */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    {/* Container for Badges and Action Buttons */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Badges for Type and Theme */}
                        <div className="flex flex-wrap gap-1 min-h-8 items-center">
                            {/* Primary badge for the item type */}
                            <Badge variant="secondary" className="text-xs">
                                {formatType(item.type)}
                            </Badge>

                            {/* Mapping the first two themes as visible badges. */}
                            {visibleThemes.map((t) => (
                                <Badge key={t} variant="outline" className="text-xs">
                                    {t}
                                </Badge>
                            ))}

                            {/* Conditional rendering for the overflow badge if there are more than 2 themes. */}
                            {hiddenThemes.length > 0 && (
                                <div className="relative group inline-flex items-center">
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        +{hiddenThemes.length}
                                    </Badge>

                                    {/* Tooltip/Popover displaying all hidden themes on hover. */}
                                    <div className="
    absolute z-20 hidden group-hover:block
    top-full mt-1 left-0
    bg-black text-white text-xs
    px-2 py-1 rounded shadow
    whitespace-nowrap
">
                                        {/* Joins the hidden themes into a comma-separated list. */}
                                        {hiddenThemes.join(", ")}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons container (Favorite and Share) */}
                        <div className="relative flex items-center min-h-8">

                            {/* Favorite button: Toggles the item's favorite status on click. */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleFavorite(item.id)}
                                className="h-8 w-8"
                                title="Favorito"
                            >
                                {/* Conditional styling: Heart is filled red if the item is a favorite. */}
                                <Heart
                                    className={`w-4 h-4 ${item.isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : "text-muted-foreground"
                                        }`}
                                />
                            </Button>

                            {/* Button to toggle the visibility of the share options popover. */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setIsShareOpen((prev) => !prev)}
                                title="Mais opções"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>

                            {/* Conditional rendering of the share popover/dropdown. */}
                            {isShareOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                                    {/* Button inside the popover to copy the item's link. */}
                                    <button
                                        className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 text-sm"
                                        onClick={() => handleCopyLink(item.id)}
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copiar link
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                    {/* Item Title and Description, constrained to two lines for layout consistency. */}
                    <CardTitle className="text-balance line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Metadata: Display of the user who added the item and the formatted date. */}
                    <div className="text-xs text-muted-foreground">
                        Adicionado por {item.addedBy} • {date}
                    </div>

                    {/* Section containing all interaction buttons. */}
                    <div className="flex flex-col gap-2">
                        {/* Conditional rendering for external links */}
                        {(item.url ?? []).length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {(item.url ?? []).map((link, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        asChild     // Render the Button as an anchor tag (<a>).
                                    >
                                        <a href={link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Ver Link {idx + 1}
                                        </a>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Conditional rendering for associated files */}
                        {(item.filePath ?? []).length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {/* Maps over all associated file paths to create download buttons. */}
                                {(item.filePath ?? []).map((fp, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline"
                                        className={`flex-1 bg-transparent`}
                                        // Calls the download handler function on click.
                                        onClick={() => downloadItem(item.id, fp)}
                                    >
                                        <Download className="w-3 h-3 mr-1" />
                                        {/* Displays the cleaned, user-friendly file name. */}
                                        <span className="truncate">{getFileName(fp)}</span>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Edit and Delete Buttons (Typically require ownership/admin rights) */}
                        <div className="flex gap-2">
                            {/* Button to open the Edit Dialog. */}
                            <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
                                <Edit className="w-3 h-3" />
                            </Button>
                            {/* Button to open the Delete Confirmation Dialog. */}
                            <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(true)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- Modals and Dialogs --- */}

            {/* Item Edit Dialog: Passes the current item for editing. */}
            <ItemDialog open={isEditOpen} onOpenChange={setIsEditOpen} item={item} />

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tens a certeza que queres eliminar "{item.title}"?
                            {/* Conditional text if an associated file exists. */}
                            {item.filePath && " O ficheiro associado também será removido."}
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {/* Cancel button closes the dialog. */}
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {/* Action button executes deletion and closes the dialog. */}
                        <AlertDialogAction
                            onClick={() => {
                                deleteItem(item.id)     // Call the delete function from the context.
                                setIsDeleteOpen(false)
                            }}
                            // Style the action button as destructive (red).
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
