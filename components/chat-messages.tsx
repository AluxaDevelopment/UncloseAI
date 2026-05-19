'use client'

import { useState, useRef, useEffect } from 'react'
import { Message } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'

interface ChatMessagesProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-[22px] font-semibold text-foreground tracking-tight mb-1.5">
            What can I help with?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start a new conversation below.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[65%] bg-card border border-border rounded-lg px-4 py-3">
              <div className="text-sm text-foreground leading-relaxed">
                <MessageContent content={streamingContent} />
              </div>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[65%] rounded-lg px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-foreground border border-border'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="space-y-3">
            <MessageContent content={message.content} />
            <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const language = lines[0]?.trim() || ''
          const code = lines.slice(language ? 1 : 0).join('\n')
          return (
            <div key={index} className="relative group/code">
              <div className="rounded-lg overflow-hidden border border-border bg-secondary">
                {language && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {language}
                    </span>
                    <CopyButton text={code} label="Copy" />
                  </div>
                )}
                <pre className="p-4 overflow-x-auto">
                  <code className="text-xs font-mono text-foreground/80 leading-relaxed">
                    {code}
                  </code>
                </pre>
              </div>
            </div>
          )
        }
        return (
          <span key={index} className="whitespace-pre-wrap break-words">
            {part}
          </span>
        )
      })}
    </div>
  )
}

function CopyButton({
  text,
  label,
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          {label && <span>Copied</span>}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  )
}
