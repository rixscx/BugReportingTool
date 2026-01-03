import React from 'react'

/**
 * Validates if the input string contains valid Markdown patterns.
 * Currently supports:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `text`
 * - Links: [text](url)
 * - Lists: - item or * item
 */
export const cleanMarkdown = (text) => {
    if (!text) return ''
    // Strip common markdown symbols for plain text preview
    return text
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
        .replace(/(\*|_)(.*?)\1/g, '$2')     // Italic
        .replace(/`([^`]+)`/g, '$1')         // Inline Code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/^\s*[-*]\s+/gm, '')        // List bullets
}

export const MarkdownRenderer = ({ content, className = '' }) => {
    if (!content) return null

    // Split by line to handle block elements (like lists) roughly
    const lines = content.split('\n')

    const parseLine = (line, lineIndex) => {
        // 1. Handle Lists (lines starting with - or *)
        // NOTE: This is a simple parser. It doesn't handle nested lists perfectly.
        const listMatch = line.match(/^\s*[-*]\s+(.*)/)
        if (listMatch) {
            return (
                <li key={lineIndex} className="ml-4 list-disc marker:text-slate-400">
                    {parseInline(listMatch[1])}
                </li>
            )
        }

        // 2. Handle Headers implies new lines
        // (If needed, not commonly requested but good to have)

        // Default: Paragraph/Div line
        // If empty line, render a break
        if (!line.trim()) {
            return <div key={lineIndex} className="h-2" />
        }

        return (
            <div key={lineIndex} className="min-h-[1.5em]">
                {parseInline(line)}
            </div>
        )
    }

    // Parse inline elements: Bold, Italic, Code, Link
    const parseInline = (text) => {
        const parts = []
        let lastIndex = 0

        // Regex for tokens: 
        // **bold** | __bold__ | *italic* | `code` | [link](url)
        // We'll execute a simple state loop or split
        // For specific requirement "**text**", we focus there.
        // Let's use split with capturing group for bold/italic/code

        // Tokenizer regex
        const regex = /(\*\*.*?\*\*|__.*?__|_.*?_|`.*?`|\[.*?\]\(.*?\))/g

        let match
        while ((match = regex.exec(text)) !== null) {
            // Push text before match
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index))
            }

            const token = match[0]
            if (token.startsWith('**') || token.startsWith('__')) {
                parts.push(<strong key={match.index} className="font-semibold text-slate-800">{token.slice(2, -2)}</strong>)
            } else if (token.startsWith('_')) { // Italic ( _text_ ) avoiding conflict with __
                // Simple check if it's _text_ and not __text__
                // But regex above handles greedy match order? 
                // Actually `__` is matched first in alternation if placed first?
                // Let's rely on simple parsing.
                parts.push(<em key={match.index} className="italic">{token.slice(1, -1)}</em>)
            } else if (token.startsWith('`')) {
                parts.push(<code key={match.index} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">{token.slice(1, -1)}</code>)
            } else if (token.startsWith('[')) {
                const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/)
                if (linkMatch) {
                    parts.push(<a key={match.index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{linkMatch[1]}</a>)
                } else {
                    parts.push(token)
                }
            }

            lastIndex = regex.lastIndex
        }

        // Push remaining text
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex))
        }

        return parts
    }

    return (
        <div className={`space-y-1 ${className}`}>
            {lines.map((line, i) => parseLine(line, i))}
        </div>
    )
}

export default MarkdownRenderer
