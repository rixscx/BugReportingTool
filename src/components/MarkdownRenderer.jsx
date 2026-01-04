import React from 'react'

export const cleanMarkdown = (text) => {
    if (!text) return ''

    // First, find and remove everything from Environment: onwards
    // This handles cases where environment info is embedded in description
    let cleaned = text
        // Remove everything from **Environment:** or Environment: onwards
        .replace(/\*\*Environment:\*\*.*/si, '')
        .replace(/Environment:.*/si, '')
        // Remove everything from **Steps to Reproduce:** onwards  
        .replace(/\*\*Steps to Reproduce:\*\*.*/si, '')
        .replace(/Steps to Reproduce:.*/si, '')
        // Remove horizontal rules and everything after
        .replace(/---+.*/s, '')

    // Now clean markdown formatting
    cleaned = cleaned
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^\s*[-*]\s+/gm, '')
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim()

    return cleaned
}

export const MarkdownRenderer = ({ content, className = '' }) => {
    if (!content) return null

    const lines = content.split('\n')

    const parseLine = (line, lineIndex) => {
        const listMatch = line.match(/^\s*[-*]\s+(.*)/)
        if (listMatch) {
            return (
                <li key={lineIndex} className="ml-4 list-disc marker:text-[#4a4a58]">
                    {parseInline(listMatch[1])}
                </li>
            )
        }

        if (!line.trim()) {
            return <div key={lineIndex} className="h-2.5" />
        }

        return (
            <div key={lineIndex} className="min-h-[1.5em]">
                {parseInline(line)}
            </div>
        )
    }

    const parseInline = (text) => {
        const parts = []
        let lastIndex = 0
        const regex = /(\*\*.*?\*\*|__.*?__|_.*?_|`.*?`|\[.*?\]\(.*?\))/g

        let match
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index))
            }

            const token = match[0]
            if (token.startsWith('**') || token.startsWith('__')) {
                parts.push(<strong key={match.index} className="font-medium text-[#f0f0f5]">{token.slice(2, -2)}</strong>)
            } else if (token.startsWith('_')) {
                parts.push(<em key={match.index} className="italic">{token.slice(1, -1)}</em>)
            } else if (token.startsWith('`')) {
                parts.push(<code key={match.index} className="bg-[rgba(99,102,241,0.1)] px-1.5 py-0.5 rounded-md text-[11px] font-mono text-[#818cf8] border border-[rgba(99,102,241,0.2)]">{token.slice(1, -1)}</code>)
            } else if (token.startsWith('[')) {
                const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/)
                if (linkMatch) {
                    parts.push(<a key={match.index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#818cf8] hover:text-[#a78bfa] hover:underline transition-colors">{linkMatch[1]}</a>)
                } else {
                    parts.push(token)
                }
            }

            lastIndex = regex.lastIndex
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex))
        }

        return parts
    }

    return (
        <div className={`space-y-1.5 text-[#9898a8] ${className}`}>
            {lines.map((line, i) => parseLine(line, i))}
        </div>
    )
}

export default MarkdownRenderer
