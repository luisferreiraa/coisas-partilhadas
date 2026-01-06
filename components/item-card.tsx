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
import { useAuth } from "@/lib/auth-context"

async function downloadItem(itemId: string, fileUrl: string) {
    const res = await fetch(
        `/api/items/${itemId}/download?file=${encodeURIComponent(fileUrl)}`
    )

    if (!res.ok) {
        alert("Erro ao gerar download")
        return
    }

    const { url } = await res.json()
    window.location.href = url
}


/**
 * @function ItemCard
 * @description Displays the details of a single shared item, along with actions for editing,
 * deleting, viewing external links, and downloading associated files.
 * 
 * @param {{ item: Item }} props - The item object to display. 
 * @returns {JSX.Element} The rendered item card component.
 */
export function ItemCard({ item }: { item: ItemWithFavorite }) {
    // Access the delete function from the item context.
    const { deleteItem } = useItems()

    const { toggleFavorite } = useItems()

    // State to control the visibility of the Edit Item dialog.
    const [isEditOpen, setIsEditOpen] = useState(false)
    // State to control the visibility of the Delete confirmation dialog.
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [isShareOpen, setIsShareOpen] = useState(false)

    const { user } = useAuth()

    // Format the item's added date into a localized string for display.
    const date = new Date(item.addedAt).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })

    /**
     * @function getFileIcon
     * @description Determines the appropriate Lucide icon based on the file extension.
     * 
     * @param {string | null} filePath - The path to the file. 
     * @returns {JSX.Element} The corresponding icon component.
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
    * It removes the unique UUID prefix added during the upload process.
    * @param {string | null} filePath - The file path (e.g., /uploads/uuid-original-name.pdf).
    * @returns {string} The cleaned filename or a default string.
    */
    const getFileName = (filePath: string | null) => {
        if (!filePath) return "Ficheiro"

        const parts = filePath.split('/')
        const fileNameWithExt = parts[parts.length - 1]

        const lastHyphenIndex = fileNameWithExt.lastIndexOf('-')

        if (lastHyphenIndex !== -1) {
            return fileNameWithExt.substring(lastHyphenIndex + 1)
        }

        return fileNameWithExt || "Ficheiro"
    }

    /**
     * @function formatType
     * @description Formats the item type string to be displayed with the first letter capitalized.
     * @param {string} type - The raw item type string.
     * @returns {string} The formatted type string.
     */
    const formatType = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    const handleCopyLink = (itemId: string) => {
        const link = `${window.location.origin}/items/${itemId}`
        navigator.clipboard.writeText(link)
            .then(() => alert("Link copiado."))
            .catch(() => alert("Não foi possível copiar o link."))

        setIsShareOpen(false)
    }

    const visibleThemes = item.theme.slice(0, 2)
    const hiddenThemes = item.theme.slice(2)

    return (
        <>
            {/* The main card component with hover shadow effect. */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    {/* Badges for Type and Theme */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap gap-1 min-h-8 items-center">
                            <Badge variant="secondary" className="text-xs">
                                {formatType(item.type)}
                            </Badge>

                            {visibleThemes.map((t) => (
                                <Badge key={t} variant="outline" className="text-xs">
                                    {t}
                                </Badge>
                            ))}

                            {hiddenThemes.length > 0 && (
                                <div className="relative group inline-flex items-center">
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        +{hiddenThemes.length}
                                    </Badge>

                                    <div className="
    absolute z-20 hidden group-hover:block
    top-full mt-1 left-0
    bg-black text-white text-xs
    px-2 py-1 rounded shadow
    whitespace-nowrap
">
                                        {hiddenThemes.join(", ")}
                                    </div>
                                </div>
                            )}
                        </div>


                        <div className="relative flex items-center min-h-8">

                            {/* Favorite button */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleFavorite(item.id)}
                                className="h-8 w-8"
                                title="Favorito"
                            >
                                <Heart
                                    className={`w-4 h-4 ${item.isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : "text-muted-foreground"
                                        }`}
                                />
                            </Button>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setIsShareOpen((prev) => !prev)}
                                title="Mais opções"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>

                            {isShareOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
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
                    {/* Item Title and Description */}
                    <CardTitle className="text-balance line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Metadata: Added By and Date */}
                    <div className="text-xs text-muted-foreground">
                        Adicionado por {item.addedBy} • {date}
                    </div>

                    {/* Action Buttons Section */}
                    <div className="flex flex-col gap-2">
                        {/* Links */}
                        {(item.url ?? []).length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {(item.url ?? []).map((link, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-transparent"
                                        asChild
                                    >
                                        <a href={link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Ver Link {idx + 1}
                                        </a>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Files */}
                        {(item.filePath ?? []).length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {(item.filePath ?? []).map((fp, idx) => (
                                    <Button
                                        key={idx}
                                        size="sm"
                                        variant="outline"
                                        className={`flex-1 bg-transparent`}
                                        onClick={() => downloadItem(item.id, fp)}
                                    >
                                        <Download className="w-3 h-3 mr-1" />
                                        <span className="truncate">{getFileName(fp)}</span>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Edit and Delete Buttons */}
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
