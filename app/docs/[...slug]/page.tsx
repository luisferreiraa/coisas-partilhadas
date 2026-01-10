// app/docs/[...slug]/page.tsx

import fs from "fs"
import path from "path"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { redirect } from "next/navigation"

import DocMenu, { DocItem } from "../DocMenu"
import SidebarToggle from "../SidebarToggle"
import { getUserFromRequest } from "@/lib/auth-server"

function buildDocTree(basePath: string, currentPath = ""): DocItem[] {
    const items: DocItem[] = []
    const fullPath = path.join(basePath, currentPath)
    if (!fs.existsSync(fullPath)) return items

    const entries = fs.readdirSync(fullPath, { withFileTypes: true })
    entries.sort((a, b) =>
        a.isDirectory() && !b.isDirectory()
            ? -1
            : !a.isDirectory() && b.isDirectory()
                ? 1
                : a.name.localeCompare(b.name)
    )

    for (const entry of entries) {
        const relPath = path.join(currentPath, entry.name)
        if (entry.isDirectory()) {
            items.push({
                name: entry.name,
                path: relPath,
                type: "folder",
                children: buildDocTree(basePath, relPath),
            })
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
            items.push({
                name: entry.name.replace(/\.md$/, ""),
                path: relPath.replace(/\.md$/, ""),
                type: "file",
            })
        }
    }

    return items
}

interface DocPageProps {
    params: Promise<{ slug?: string[] }>
}

export default async function DocPage({ params }: DocPageProps) {
    const resolvedParams = await params
    const slugPath = resolvedParams.slug?.join("/") || "index"

    let user = null

    try {
        user = await getUserFromRequest()
    } catch {
        redirect("/")
    }

    if (!user) redirect("/")

    const docsBasePath = path.join(process.cwd(), "public/docs")
    const docTree = buildDocTree(docsBasePath)

    let filePath = path.join(docsBasePath, `${slugPath}.md`)

    if (!fs.existsSync(filePath)) {
        // Se o slug for uma pasta, tenta carregar index.md
        const indexPath = path.join(docsBasePath, slugPath, "index.md")
        if (fs.existsSync(indexPath)) {
            filePath = indexPath
        }
    }

    const fileContent = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, "utf-8")
        : "# Documento não encontrado"

    return (
        <SidebarToggle sidebar={<DocMenu tree={docTree} currentPath={slugPath} />}>
            <div className="docs-container">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {fileContent}
                </ReactMarkdown>
            </div>
        </SidebarToggle>
    )
}