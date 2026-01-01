// "use client"

// import type React from "react"
// import { useEffect, useState } from "react"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useItems } from "@/lib/items-context"
// import { useAuth } from "@/lib/auth-context"
// import type { Item, ItemType } from "@/lib/types"
// import { ITEM_TYPES } from "@/lib/types"

// type ItemDialogProps = {
//     open: boolean
//     onOpenChange: (open: boolean) => void
//     item?: Item
// }

// export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
//     const { addItem, updateItem } = useItems()
//     const { user } = useAuth()
//     const [formData, setFormData] = useState({
//         type: "livro" as ItemType,
//         title: "",
//         description: "",
//         theme: "",
//         url: "",
//     })

//     useEffect(() => {
//         if (item) {
//             setFormData({
//                 type: item.type,
//                 title: item.title,
//                 description: item.description,
//                 theme: item.theme,
//                 url: item.url || "",
//             })
//         } else {
//             setFormData({
//                 type: "livro",
//                 title: "",
//                 description: "",
//                 theme: "",
//                 url: "",
//             })
//         }
//     }, [item, open])

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault()
//         if (!user) return

//         if (item) {
//             updateItem(item.id, formData)
//         } else {
//             addItem({
//                 ...formData,
//                 addedBy: user.name,
//             })
//         }

//         onOpenChange(false)
//     }

//     return (
//         <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogContent className="sm:max-w-125">
//                 <DialogHeader>
//                     <DialogTitle>{item ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
//                     <DialogDescription>
//                         {item
//                             ? "Atualiza as informações do item."
//                             : "Adiciona um novo livro, filme, app, website, local ou evento."}
//                     </DialogDescription>
//                 </DialogHeader>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     <div className="space-y-2">
//                         <Label htmlFor="type">Tipo</Label>
//                         <Select
//                             value={formData.type}
//                             onValueChange={(value) => setFormData({ ...formData, type: value as ItemType })}
//                         >
//                             <SelectTrigger id="type">
//                                 <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {ITEM_TYPES.map((type) => (
//                                     <SelectItem key={type.value} value={type.value}>
//                                         {type.icon} {type.label}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="title">Título</Label>
//                         <Input
//                             id="title"
//                             placeholder="Nome do item"
//                             value={formData.title}
//                             onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                             required
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="description">Descrição</Label>
//                         <Textarea
//                             id="description"
//                             placeholder="Breve descrição do item"
//                             value={formData.description}
//                             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                             required
//                             rows={3}
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="theme">Temática</Label>
//                         <Input
//                             id="theme"
//                             placeholder="Ex: Tecnologia, Romance, Aventura..."
//                             value={formData.theme}
//                             onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
//                             required
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="url">URL (opcional)</Label>
//                         <Input
//                             id="url"
//                             type="url"
//                             placeholder="https://exemplo.com"
//                             value={formData.url}
//                             onChange={(e) => setFormData({ ...formData, url: e.target.value })}
//                         />
//                     </div>

//                     <div className="flex gap-2 justify-end pt-4">
//                         <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//                             Cancelar
//                         </Button>
//                         <Button type="submit">{item ? "Guardar" : "Adicionar"}</Button>
//                     </div>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     )
// }

"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useItems } from "@/lib/items-context"
import { useAuth } from "@/lib/auth-context"
import type { Item, ItemType, UpdateItemData } from "@/lib/types"
import { ITEM_TYPES } from "@/lib/types"
import { File, X, Upload, Trash2, ExternalLink } from "lucide-react"

type ItemDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    item?: Item
}

export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
    const { addItem, updateItem } = useItems()
    const { user } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [removeExistingFile, setRemoveExistingFile] = useState(false)
    const [formData, setFormData] = useState({
        type: "livro",
        title: "",
        description: "",
        theme: "",
        url: "",
    })

    useEffect(() => {
        if (item) {
            setFormData({
                type: item.type,
                title: item.title,
                description: item.description,
                theme: item.theme,
                url: item.url || "",
            })
            setSelectedFile(null)
            setRemoveExistingFile(false)
        } else {
            setFormData({
                type: "livro",
                title: "",
                description: "",
                theme: "",
                url: "",
            })
            setSelectedFile(null)
            setRemoveExistingFile(false)
        }
    }, [item, open])

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
        // Se estiver editando e existe arquivo, marcar para remover
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
            type: formData.type as ItemType, // Conversão explícita
            title: formData.title,
            description: formData.description,
            theme: formData.theme,
            addedBy: user.name,
            url: formData.url || undefined,
        }

        try {
            if (item) {
                const updateData: UpdateItemData = {
                    type: formData.type as ItemType, // Conversão explícita
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

                    {/* Seção de Upload de Arquivo */}
                    <div className="space-y-2">
                        <Label htmlFor="file">Ficheiro (opcional)</Label>

                        {/* Arquivo existente */}
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
                                                Ver arquivo
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

                        {/* Arquivo removido */}
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

                        {/* Novo arquivo selecionado */}
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

                        {/* Botão de upload */}
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