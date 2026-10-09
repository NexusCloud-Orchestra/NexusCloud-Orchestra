import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { Cloud, CircuitBoard, FolderOpen, Gauge, LayoutDashboard, Activity, Settings2, UploadCloud, Link2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../../state/query"
import { formatBytes, fileExtension } from "../../lib/format"
import { ProviderMark } from "../ui/provider-mark"
import type { FileRecord } from "../../types/api"

interface Command {
  id: string
  label: string
  section: "Navigate" | "Actions" | "Files"
  hint?: string
  icon: typeof FolderOpen
  run: () => void
}

/**
 * Palette scope is honest: page navigation plus a client-side filter over the
 * already-loaded file list. The backend exposes no global search endpoint.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setCursor(0)
    }
  }, [open])

  const filesDataUpdatedAt = queryClient.getQueryState(queryKeys.files)?.dataUpdatedAt ?? 0
  const files = useMemo<FileRecord[]>(
    () => queryClient.getQueryData<FileRecord[]>(queryKeys.files) ?? [],
    // filesDataUpdatedAt changes exactly when the cached list changes.
    [queryClient, filesDataUpdatedAt], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const commands = useMemo<Command[]>(() => {
    const navigation: Command[] = [
      { id: "nav-overview", label: "Go to Overview", section: "Navigate", icon: LayoutDashboard, run: () => navigate("/app") },
      { id: "nav-files", label: "Go to Files", section: "Navigate", icon: FolderOpen, run: () => navigate("/app/files") },
      { id: "nav-clouds", label: "Go to Clouds", section: "Navigate", icon: Cloud, run: () => navigate("/app/clouds") },
      { id: "nav-router", label: "Go to Router", section: "Navigate", icon: CircuitBoard, run: () => navigate("/app/router") },
      { id: "nav-quota", label: "Go to Quota", section: "Navigate", icon: Gauge, run: () => navigate("/app/quota") },
      { id: "nav-activity", label: "Go to Activity", section: "Navigate", icon: Activity, run: () => navigate("/app/activity") },
      { id: "nav-settings", label: "Go to Settings", section: "Navigate", icon: Settings2, run: () => navigate("/app/settings") },
    ]
    const actions: Command[] = [
      {
        id: "action-upload",
        label: "Upload files",
        section: "Actions",
        icon: UploadCloud,
        run: () => {
          navigate("/app/files")
          window.setTimeout(() => window.dispatchEvent(new CustomEvent("nc:open-upload")), 60)
        },
      },
      {
        id: "action-connect",
        label: "Connect a cloud",
        section: "Actions",
        icon: Link2,
        run: () => navigate("/app/clouds?connect=1"),
      },
    ]
    const fileCommands: Command[] = files.slice(0, 40).map((file) => ({
      id: `file-${file.id}`,
      label: file.original_name,
      section: "Files" as const,
      hint: `${fileExtension(file.original_name)} · ${formatBytes(file.size_bytes)}`,
      icon: FolderOpen,
      run: () => navigate(`/app/files?file=${file.id}`),
    }))
    const all = [...actions, ...fileCommands, ...navigation]
    if (!query.trim()) return all
    const needle = query.trim().toLowerCase()
    return all.filter((command) => command.label.toLowerCase().includes(needle))
  }, [files, navigate, query])

  useEffect(() => {
    setCursor((current) => Math.min(current, Math.max(0, commands.length - 1)))
  }, [commands.length])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setCursor((current) => (current + 1) % Math.max(1, commands.length))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setCursor((current) => (current - 1 + Math.max(1, commands.length)) % Math.max(1, commands.length))
      } else if (event.key === "Enter") {
        event.preventDefault()
        const command = commands[cursor]
        if (command) {
          command.run()
          onClose()
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, commands, cursor, onClose])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" })
  }, [cursor])

  if (!open) return null

  let lastSection = ""

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
      <div className="animate-fade-in absolute inset-0 bg-night/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="animate-scale-in relative w-full max-w-lg overflow-hidden rounded-md border border-line bg-surface shadow-pop"
      >
        <div className="border-b border-line px-3.5 py-2.5">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files or jump to a page…"
            aria-label="Command palette query"
            className="w-full bg-transparent text-md text-ink outline-none placeholder:text-ink-3"
          />
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1.5" role="listbox" aria-label="Commands">
          {commands.length === 0 ? (
            <p className="px-4 py-6 text-center text-base text-ink-3">No matches</p>
          ) : (
            commands.map((command, index) => {
              const header = command.section !== lastSection ? command.section : null
              lastSection = command.section
              const active = index === cursor
              const Icon = command.icon
              return (
                <div key={command.id}>
                  {header ? <p className="label-caps px-4 pb-1 pt-2.5">{header}</p> : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    onMouseMove={() => setCursor(index)}
                    onClick={() => {
                      command.run()
                      onClose()
                    }}
                    className={`flex w-full items-center gap-2.5 px-4 py-1.5 text-left text-base transition-colors duration-fast ${
                      active ? "bg-accent-wash text-ink" : "text-ink-2"
                    }`}
                  >
                    <Icon size={13} strokeWidth={1.8} className="shrink-0 text-ink-3" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{command.label}</span>
                    {command.id.startsWith("file-") && files.find((f) => `file-${f.id}` === command.id) ? (
                      <ProviderMark provider={files.find((f) => `file-${f.id}` === command.id)!.provider} size={10} />
                    ) : null}
                    {command.hint ? <span className="shrink-0 font-mono text-2xs text-ink-3 tnum">{command.hint}</span> : null}
                  </button>
                </div>
              )
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-2xs uppercase tracking-kicker text-ink-3">
          <span>Navigate · Files on this device list</span>
          <span>↑↓ move · ↵ select · esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
