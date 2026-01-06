// components/item-dialog.tsx

"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useItems } from "@/lib/items-context"
import { useAuth } from "@/lib/auth-context"
import type { Item, ItemType, UpdateItemData } from "@/lib/types"
import { ITEM_TYPES } from "@/lib/types"
import { File, X, Upload, Trash2 } from "lucide-react"

// Type definition for the component's properties.
type ItemDialogProps = {
    open: boolean       // Controls whether the dialog modal is currently open.
    onOpenChange: (open: boolean) => void       // Handler to close the dialog, often passed from the parent's useState setter.
    item?: Item     // Optional prop: if provided, the dialog is in 'edit' mode; otherwise, it's in 'add' mode.
}

/**
 * @function ItemDialog
 * @description A modal dialog component used for adding a new Item or editing an existing one.
 * It manages form state, handles multiple file selection, tracks files to be removed, and interacts
 * with the item context for persistence.
 * * @param {ItemDialogProps} props - The component properties.
 * @returns {JSX.Element} The rendered item dialog.
 */
export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
    // Destructure item management functions from the context.
    const { addItem, updateItem } = useItems()

    // Destructure user information from the autenthication context.
    const { user } = useAuth()

    // useRef hook to reference the hidden native file input element for programmatic click.
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State to hold the array of newly selected files, staged for upload.
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    // State to hold the list of files already associated with the item (in edit mode).
    const [existingFiles, setExistingFiles] = useState<{ name: string; path: string }[]>([])

    // State flag (currently unused in the logic, but reserved for overall file removal intent).
    const [removeExistingFiles, setRemoveExistingFiles] = useState(false)

    // State array holding the file paths of existing files marked for removal upon submission.
    const [filesToRemove, setFilesToRemove] = useState<string[]>([])

    // State object to manage all form field values, now including arrays for 'theme' and 'url'.
    const [formData, setFormData] = useState({
        type: "livro",
        title: "",
        description: "",
        theme: [] as string[],      // Array to hold themes (not directly used for input display, see themeInput).
        url: [] as string[],        // Array to hold multiple URLs.
    })

    // State for the theme input, allowing themes to be entered as a comma-separated string.
    const [themeInput, setThemeInput] = useState("")

    // useEffect hook to handle form state initialization and resetting upon opening or item change.
    useEffect(() => {
        // Condition: If an 'item' prop is provided (edit mode).
        if (item) {
            // Populate form fields with existing item data.
            setFormData({
                type: item.type,
                title: item.title,
                description: item.description,
                theme: item.theme ?? [],        // Use existing themes or an empty array.
                url: item.url ?? [],        // Use existing URLs or an empty array.
            })

            // Populate the theme input string from the item's theme array.
            setThemeInput(item.theme?.join(", ") ?? "")

            // Process existing file paths: clean up the path to get a displayable name.
            const files =
                item.filePath?.map((path: string) => {
                    const raw = path.split("/").pop() || ""     // Get the last segment (filename with UUID prefix).
                    // Extract the clean filename by removing the assumed UUID prefix (everything before the first '-').
                    const clean = raw.includes("-") ? raw.split("-").slice(1).join("-") : raw
                    return { name: clean, path }
                }) ?? []

            // Store the processed list of existing files.
            setExistingFiles(files)
        } else {
            // Condition: If no item prop is provided (add mode). Reset all fields.
            setFormData({
                type: "livro",
                title: "",
                description: "",
                theme: [],
                url: [],
            })
            // Reset existing file list.
            setExistingFiles([])
            setThemeInput("")
        }

        // Reset file-related states for new operations.
        setSelectedFiles([])
        setRemoveExistingFiles(false)
        setFilesToRemove([])

        // Reset the value of the native file input element.
        if (fileInputRef.current) fileInputRef.current.value = ""
    }, [item, open])        // Dependencies: Re-run when item (edit target) or open (dialog visibility) changes.

    /**
     * @function handleFileChange
     * @description Handles the selection of new files from the input element (supports multiple).
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the file input.
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const files = Array.from(e.target.files)        // Convert FileList to Array.
        setSelectedFiles((prev) => [...prev, ...files])     // Append new files to the list of staged files.
        setRemoveExistingFiles(false)       // Reset overall file removal flag.
        // Important: Reset the input value to allow the user to select the same file(s) again if needed.
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    /**
     * @function removeNewFile
     * @description Removes a newly selected file (staged for upload) from the selectedFiles state array.
     * @param {number} index - The index of the file to remove.
     */
    const removeNewFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    /**
     * @function removeExistingFile
     * @description Marks an existing file for removal upon submission.
     * It adds the file's path to `filesToRemove` and removes it from the `existingFiles` display list.
     * @param {number} index - The index of the file to remove from the display list.
     */
    const removeExistingFile = (index: number) => {
        const file = existingFiles[index]
        setFilesToRemove((prev) => [...prev, file.path])        // Add file path to the list of paths to delete from storage.
        setExistingFiles((prev) => prev.filter((_, i) => i !== index))      // Remove from the visible list.
    }

    /**
     * @async
     * @function handleSubmit
     * @description Handles form submission, processes themes and URLs, and calls the appropriate
     * context function (addItem or updateItem) with the staged files and removal lists.
     * @param {React.FormEvent} e - The form submission event.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        // 1. Process comma-separated theme input into an array.
        const themesArray = themeInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)

        // 2. Clean up URL array (remove any empty URL fields).
        const cleanedUrls = formData.url.filter((u) => u.trim() !== "")

        // Prepare base data payload for both add/edit.
        const baseData = {
            type: formData.type as ItemType,
            title: formData.title,
            description: formData.description,
            theme: themesArray,     // Use processed themes array.
            addedBy: user.name,
            // Use cleaned URLs array, or undefined if the array is empty.
            url: cleanedUrls.length > 0 ? cleanedUrls : undefined,
        }

        try {
            // Check if in 'edit' mode.
            if (item) {
                // Prepare update payload.
                const updateData: UpdateItemData & { filesToRemove?: string[] } = {
                    type: formData.type as ItemType,
                    title: formData.title,
                    description: formData.description,
                    theme: themesArray,
                    url: cleanedUrls.length > 0 ? cleanedUrls : undefined,
                }

                // If files were marked for removal, attach the list to the update data.
                if (filesToRemove.length > 0) {
                    updateData.filesToRemove = filesToRemove
                }

                // Call updateItem with ID, data, and the array of newly selected files (if any).
                await updateItem(
                    item.id,
                    updateData,
                    selectedFiles.length > 0 ? selectedFiles : undefined
                )
            } else {
                // 'Add' mode: Call addItem with base data and the array of newly selected files (if any).
                await addItem(
                    baseData,
                    selectedFiles.length > 0 ? selectedFiles : undefined
                )
            }

            // Close the dialog upon successful operation.
            onOpenChange(false)
        } catch (err) {
            // Log error for debugging.
            console.error("Erro ao guardar item:", err)
        }
    }

    /**
     * @function formatFileName
     * @description Truncates long filenames for display purposes (e.g., "verylongf...ilename.pdf").
     * @param {string} name - The filename string.
     * @returns {string} The truncated or original filename.
     */
    const formatFileName = (name: string) => {
        if (name.length > 30) return name.substring(0, 15) + "..." + name.substring(name.length - 10)
        return name
    }

    // Start of the JSX rendering for the dialog component.
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Dialog Content: Set max width and allow vertical scrolling for long forms. */}
            <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Atualiza as informações do item." : "Adiciona um novo item à coleção."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Item Type Selection Field */}
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ITEM_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value} className="flex items-center gap-2">
                                        <span>{t.icon}</span>
                                        <span>{t.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title Input Field (Required) */}
                    <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Description Textarea Field (Required) */}
                    <div className="space-y-2">
                        <Label>Descrição *</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            required
                        />
                    </div>

                    {/* Theme Input Field (Required) - Uses a single string input for comma-separated values */}
                    <div className="space-y-2">
                        <Label>Temática *</Label>
                        <Input
                            value={themeInput}
                            onChange={(e) => setThemeInput(e.target.value)}
                            placeholder="Ex: Theme1, Theme2"
                            required
                        />
                    </div>

                    {/* Multiple URLs Input Fields (Optional) */}
                    <div className="space-y-2">
                        <Label>URLs (opcional)</Label>
                        {formData.url.map((link, idx) => (
                            <Input
                                key={idx}
                                type="url"
                                placeholder={`https://exemplo.com/${idx + 1}`}
                                value={link}
                                onChange={(e) => {
                                    const newUrls = [...formData.url]
                                    newUrls[idx] = e.target.value
                                    setFormData({ ...formData, url: newUrls })
                                }}
                                className="mb-1"
                            />
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            // Button to dynamically add a new, empty URL input field.
                            onClick={() => setFormData({ ...formData, url: [...formData.url, ""] })}
                        >
                            Adicionar URL
                        </Button>
                    </div>

                    {/* Display Existing Files (Read-only view with removal button) */}
                    {existingFiles.map((f, idx) => (
                        <div key={idx} className="border rounded-md p-3 flex justify-between">
                            <div className="flex gap-2 items-center">
                                <File className="w-4 h-4" />
                                {/* Link to view the existing file. */}
                                <a href={f.path} target="_blank" className="text-sm underline">
                                    {formatFileName(f.name)}
                                </a>
                            </div>
                            {/* Button to mark the existing file for removal. */}
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeExistingFile(idx)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}

                    {/* Display Newly Selected Files (Staged for upload) */}
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="border rounded-md p-3 flex justify-between">
                            <div className="flex gap-2 items-center">
                                <File className="w-4 h-4" />
                                <span className="text-sm">{formatFileName(file.name)}</span>
                            </div>
                            {/* Button to remove the newly selected file from the staged list. */}
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeNewFile(idx)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}

                    {/* File Upload Dropzone/Button */}
                    <div className="border-2 border-dashed rounded-md p-4 text-center">
                        <Input
                            ref={fileInputRef}
                            type="file"
                            multiple        // Allows selection of multiple files.
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.epub"
                        />
                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Adicionar ficheiros
                        </Button>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        {/* Dynamic submit button text. */}
                        <Button type="submit">{item ? "Guardar" : "Adicionar"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
