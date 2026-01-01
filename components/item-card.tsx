// "use client"

// import { useState } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Edit, ExternalLink, Trash2 } from "lucide-react"
// import type { Item } from "@/lib/types"
// import { ITEM_TYPES } from "@/lib/types"
// import { useItems } from "@/lib/items-context"
// import { ItemDialog } from "@/components/item-dialog"
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from "@/components/ui/alert-dialog"

// export function ItemCard({ item }: { item: Item }) {
//     const { deleteItem } = useItems()
//     const [isEditOpen, setIsEditOpen] = useState(false)
//     const [isDeleteOpen, setIsDeleteOpen] = useState(false)

//     const typeInfo = ITEM_TYPES.find((t) => t.value === item.type)
//     const date = new Date(item.addedAt).toLocaleDateString("pt-PT", {
//         day: "numeric",
//         month: "short",
//         year: "numeric",
//     })

//     return (
//         <>
//             <Card className="hover:shadow-lg transition-shadow">
//                 <CardHeader>
//                     <div className="flex items-start justify-between gap-2 mb-2">
//                         <Badge variant="secondary" className="text-xs">
//                             {typeInfo?.icon} {typeInfo?.label}
//                         </Badge>
//                         <Badge variant="outline" className="text-xs">
//                             {item.theme}
//                         </Badge>
//                     </div>
//                     <CardTitle className="text-balance line-clamp-2">{item.title}</CardTitle>
//                     <CardDescription className="line-clamp-2">{item.description}</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                     <div className="text-xs text-muted-foreground">
//                         Adicionado por {item.addedBy} • {date}
//                     </div>
//                     <div className="flex gap-2">
//                         {item.url && (
//                             <Button size="sm" variant="outline" className="flex-1 bg-transparent" asChild>
//                                 <a href={item.url} target="_blank" rel="noopener noreferrer">
//                                     <ExternalLink className="w-3 h-3 mr-1" />
//                                     Ver
//                                 </a>
//                             </Button>
//                         )}
//                         <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
//                             <Edit className="w-3 h-3" />
//                         </Button>
//                         <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(true)}>
//                             <Trash2 className="w-3 h-3" />
//                         </Button>
//                     </div>
//                 </CardContent>
//             </Card>

//             <ItemDialog open={isEditOpen} onOpenChange={setIsEditOpen} item={item} />

//             <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
//                 <AlertDialogContent>
//                     <AlertDialogHeader>
//                         <AlertDialogTitle>Eliminar item?</AlertDialogTitle>
//                         <AlertDialogDescription>
//                             Tens a certeza que queres eliminar "{item.title}"? Esta ação não pode ser desfeita.
//                         </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                         <AlertDialogCancel>Cancelar</AlertDialogCancel>
//                         <AlertDialogAction
//                             onClick={() => {
//                                 deleteItem(item.id)
//                                 setIsDeleteOpen(false)
//                             }}
//                             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//                         >
//                             Eliminar
//                         </AlertDialogAction>
//                     </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </>
//     )
// }

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, ExternalLink, Trash2, File, FileText, Download } from "lucide-react"
import type { Item } from "@/lib/types"
import { useItems } from "@/lib/items-context"
import { ItemDialog } from "@/components/item-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ItemCard({ item }: { item: Item }) {
    const { deleteItem } = useItems()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const date = new Date(item.addedAt).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })

    // Função para obter ícone baseado na extensão do arquivo
    const getFileIcon = (filePath: string | null) => {
        if (!filePath) return <File className="w-3 h-3 mr-1" />

        const extension = filePath.split('.').pop()?.toLowerCase()

        if (['pdf'].includes(extension || '')) {
            return <FileText className="w-3 h-3 mr-1" />
        }

        return <File className="w-3 h-3 mr-1" />
    }

    // Função para obter nome do arquivo
    const getFileName = (filePath: string | null) => {
        if (!filePath) return "Ficheiro"

        const parts = filePath.split('/')
        const fileNameWithExt = parts[parts.length - 1]
        // Remove o UUID prefix se existir
        const fileNameParts = fileNameWithExt.split('-')
        const fileName = fileNameParts.length > 1 ? fileNameParts.slice(1).join('-') : fileNameWithExt
        return fileName || "Ficheiro"
    }

    // Formatar tipo para exibição
    const formatType = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    return (
        <>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                            {formatType(item.type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {item.theme}
                        </Badge>
                    </div>
                    <CardTitle className="text-balance line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                        Adicionado por {item.addedBy} • {date}
                    </div>

                    {/* Links para URL e/ou Arquivo */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            {/* Link URL */}
                            {item.url && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 bg-transparent"
                                    asChild
                                >
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Ver Link
                                    </a>
                                </Button>
                            )}

                            {/* Link Arquivo */}
                            {item.filePath && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={`flex-1 bg-transparent ${item.url ? '' : 'col-span-2'}`}
                                    asChild
                                >
                                    <a href={item.filePath} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="w-3 h-3 mr-1" />
                                        Download
                                    </a>
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
                                <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(true)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ItemDialog open={isEditOpen} onOpenChange={setIsEditOpen} item={item} />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tens a certeza que queres eliminar "{item.title}"?
                            {item.filePath && " O ficheiro associado também será removido."}
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                deleteItem(item.id)
                                setIsDeleteOpen(false)
                            }}
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
