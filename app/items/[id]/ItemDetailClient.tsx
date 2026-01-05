// app/items/[id]/ItemDetailClient.tsx
"use client"

import { useState } from "react"
import { Copy, Download, ExternalLink } from "lucide-react"
import { Item } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ItemDetailClient({ item }: { item: Item }) {
    const [copied, setCopied] = useState(false)

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/items/${item.id}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const downloadItem = (url: string) => window.open(url, "_blank")

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-1">
                        <Badge>{item.type}</Badge>
                        {(item.theme ?? []).map((t) => <Badge key={t}>{t}</Badge>)}
                    </div>
                    <Button size="icon" onClick={handleCopyLink} title="Copiar link">
                        <Copy />
                    </Button>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {(item.url ?? []).map((url, idx) => (
                    <Button key={idx} size="sm" variant="outline" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink />
                            Link {idx + 1}
                        </a>
                    </Button>
                ))}
                {(item.filePath ?? []).map((fp, idx) => (
                    <Button key={idx} size="sm" variant="outline" onClick={() => downloadItem(fp)}>
                        <Download /> {fp.split("/").pop()}
                    </Button>
                ))}
            </CardContent>
        </Card>
    )
}
