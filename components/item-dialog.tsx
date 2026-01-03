// components/item-dialog.tsx

"use client"        // This directive marks the component as a Client Component, enabling React hooks and client-side interactions.

import type React from "react"      // Explicitly import React types, though often implied in modern React.
import { useEffect, useState, useRef } from "react"     // Import essential React hooks: useEffect for side effects, useState for state management, and useRef for accessing DOM elements.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"        // UI components for the modal dialog structure.
import { Button } from "@/components/ui/button"     // Reusable button component.
import { Input } from "@/components/ui/input"       // Reusable text component.
import { Label } from "@/components/ui/label"       // Label component for form fields.
import { Textarea } from "@/components/ui/textarea"     // Textarea component for multi-line input (description).
// Select components for dropdown menus (used for item type selection).
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useItems } from "@/lib/items-context"      // Custom hook to access item management functions (addItem, updateItem).
import { useAuth } from "@/lib/auth-context"        // Custom hook to access authentication context (user data).
import type { Item, ItemType, UpdateItemData } from "@/lib/types"       // Type definitions for Item, ItemType, and UpdateItemData.
import { ITEM_TYPES } from "@/lib/types"        // Array constant defining available item types for the Select menu.
import { File, X, Upload, Trash2, ExternalLink } from "lucide-react"        // Icons for file handling, status, and actions.

// Type definition for the component's properties.
type ItemDialogProps = {
    open: boolean       // Controls whether the dialog modal is currently open.
    onOpenChange: (open: boolean) => void       // Handler to close the dialog, often passed from the parent's useState setter.
    item?: Item     // Optional prop: if provided, the dialog is in 'edit' mode; otherwise, it's in 'add' mode.
}

/**
 * @function ItemDialog
 * @description A modal dialog component used for adding a new Item or editing an existing one.
 * It manages form state, file selection, file removal logic, and interaction with the item context.
 * 
 * @param {ItemDialogProps} props - The component properties.
 * @returns {JSX.Element} The rendered item dialog.
 */
export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
    // Destructure item management functions from the context.
    const { addItem, updateItem } = useItems()
    // Destructure user information from the autenthication context.
    const { user } = useAuth()

    // useRef hook to reference the hidden native file input element for programmatic click.
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State to hold the currently selected file or object for upload.
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    // State flag indicating whether the existing associated file (if in edit mode) should be removed.
    const [removeExistingFile, setRemoveExistingFile] = useState(false)

    // State object to manage all form filed values. Initialized with default values.
    const [formData, setFormData] = useState({
        type: "livro",      // Default item type.
        title: "",
        description: "",
        theme: "",
        url: "",
    })

    // useEffect hook to handle form state initialization and resetting.
    useEffect(() => {
        // Condition: If an 'item' prop is provided (edit mode)
        if (item) {
            setFormData({
                type: item.type,
                title: item.title,
                description: item.description,
                theme: item.theme,
                url: item.url || "",        // Use existing URL or an empty string.
            })
            // Reset file states when opening the dialog for editing an existing item.
            setSelectedFile(null)
            setRemoveExistingFile(false)
        } else {
            // Condition: If no item prop is provided (add mode)
            setFormData({
                type: "livro",      // Reset to default type
                title: "",
                description: "",
                theme: "",
                url: "",
            })
            // Reset file states for a new item.
            setSelectedFile(null)
            setRemoveExistingFile(false)
        }
        // Re-run the effect whenever item (to switch between edit targets) or open (to reset on dialog open) changes.
    }, [item, open])

    /**
     * 
     * @param e 
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        setSelectedFile(file)
        setRemoveExistingFile(false)
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
        if (item?.filePath) {
            setRemoveExistingFile(true)
        }
    }

    const handleRestoreFile = () => {
        setRemoveExistingFile(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        const itemData = {
            type: formData.type as ItemType,
            title: formData.title,
            description: formData.description,
            theme: formData.theme,
            addedBy: user.name,
            url: formData.url || undefined,
        }

        try {
            if (item) {
                const updateData: UpdateItemData = {
                    type: formData.type as ItemType,
                    title: formData.title,
                    description: formData.description,
                    theme: formData.theme,
                    url: formData.url || undefined,
                }

                if (removeExistingFile) {
                    updateData.removeFile = "true"
                }

                await updateItem(item.id, updateData, selectedFile || undefined)
            } else {
                await addItem(itemData, selectedFile || undefined)
            }

            onOpenChange(false)
        } catch (error) {
            console.error("Erro ao salvar item:", error)
        }
    }

    const formatFileName = (name: string) => {
        if (name.length > 30) {
            return name.substring(0, 15) + "..." + name.substring(name.length - 10)
        }
        return name
    }

    const getFileInfo = (filePath: string | null) => {
        if (!filePath) return null

        const parts = filePath.split('/')
        const fileNameWithExt = parts[parts.length - 1]
        const fileNameParts = fileNameWithExt.split('-')
        const fileName = fileNameParts.length > 1 ? fileNameParts.slice(1).join('-') : fileNameWithExt

        return {
            name: fileName,
            path: filePath
        }
    }

    const fileInfo = item?.filePath ? getFileInfo(item.filePath) : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
                    <DialogDescription>
                        {item
                            ? "Atualiza as informações do item."
                            : "Adiciona um novo item à coleção."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Selecione um tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {ITEM_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.icon && <span className="mr-2">{type.icon}</span>}
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            placeholder="Nome do item"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição *</Label>
                        <Textarea
                            id="description"
                            placeholder="Breve descrição do item"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="theme">Temática *</Label>
                        <Input
                            id="theme"
                            placeholder="Ex: Tecnologia, Romance, Aventura..."
                            value={formData.theme}
                            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">URL (opcional)</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://exemplo.com"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">Ficheiro (opcional)</Label>

                        {item?.filePath && !removeExistingFile && !selectedFile && (
                            <div className="border rounded-md p-3 bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <File className="h-4 w-4" />
                                        <div>
                                            <p className="text-sm font-medium">{formatFileName(fileInfo?.name || "")}</p>
                                            <a
                                                href={item.filePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Ver ficheiro
                                            </a>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveFile}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {item?.filePath && removeExistingFile && (
                            <div className="border rounded-md p-3 bg-destructive/10 border-destructive/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <X className="h-4 w-4 text-destructive" />
                                        <p className="text-sm text-destructive">Arquivo será removido</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRestoreFile}
                                    >
                                        Restaurar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {selectedFile && (
                            <div className="border rounded-md p-3 bg-primary/5 border-primary/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <File className="h-4 w-4" />
                                        <div>
                                            <p className="text-sm font-medium">{formatFileName(selectedFile.name)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveFile}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {(!item?.filePath || removeExistingFile) && !selectedFile && (
                            <div className="border-2 border-dashed rounded-md p-4 text-center">
                                <Input
                                    ref={fileInputRef}
                                    id="file"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Selecionar arquivo
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    PDF, DOC, TXT, JPG, PNG (max. 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">{item ? "Guardar" : "Adicionar"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}