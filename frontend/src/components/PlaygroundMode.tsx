import { useState, useRef } from 'react'
import { Upload, RotateCcw, Zap, FileText } from 'lucide-react'
import { runDiff } from '../engine/adapter'
import type { RunDiffResult } from '../engine/adapter'

const EXAMPLE_OLD = `openapi: "3.0.0"
info:
  title: My API
  version: "1.0.0"
paths:
  /users:
    get:
      summary: List users
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [id, email]
                properties:
                  id:
                    type: string
                  email:
                    type: string
                  name:
                    type: string`

const EXAMPLE_NEW = `openapi: "3.0.0"
info:
  title: My API
  version: "2.0.0"
paths:
  /users:
    get:
      summary: List users
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [id]
                properties:
                  id:
                    type: integer
                  name:
                    type: string
                  username:
                    type: string`

interface Props {
  onResult: (result: RunDiffResult, oldText: string, newText: string) => void
  onClear: () => void
}

export function PlaygroundMode({ onResult, onClear }: Props) {
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const oldFileRef = useRef<HTMLInputElement>(null)
  const newFileRef = useRef<HTMLInputElement>(null)

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  async function handleFileUpload(side: 'old' | 'new', file: File) {
    try {
      const text = await readFile(file)
      if (side === 'old') setOldText(text)
      else setNewText(text)
    } catch {
      setError('Failed to read file')
    }
  }

  function handleAnalyze() {
    if (!oldText.trim() || !newText.trim()) {
      setError('Both contract fields are required before running analysis.')
      return
    }
    setIsRunning(true)
    setError(null)
    requestAnimationFrame(() => {
      try {
        const result = runDiff({ oldContract: oldText, newContract: newText })
        onResult(result, oldText, newText)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setIsRunning(false)
      }
    })
  }

  function handleReset() {
    setOldText('')
    setNewText('')
    setError(null)
    onClear()
  }

  function handleLoadExample() {
    setOldText(EXAMPLE_OLD)
    setNewText(EXAMPLE_NEW)
    setError(null)
    onClear()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContractArea
          label="OLD CONTRACT"
          labelClass="text-red-500 dark:text-red-400"
          placeholder="Paste your old OpenAPI YAML or JSON spec here…"
          value={oldText}
          onChange={setOldText}
          fileRef={oldFileRef}
          onFileUpload={(f) => handleFileUpload('old', f)}
        />
        <ContractArea
          label="NEW CONTRACT"
          labelClass="text-emerald-500 dark:text-emerald-400"
          placeholder="Paste your new OpenAPI YAML or JSON spec here…"
          value={newText}
          onChange={setNewText}
          fileRef={newFileRef}
          onFileUpload={(f) => handleFileUpload('new', f)}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-5 py-4 text-sm text-red-600 dark:text-red-300">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleAnalyze}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Analyze Contracts
            </>
          )}
        </button>

        <button
          onClick={handleLoadExample}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Load Example
        </button>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  )
}

interface ContractAreaProps {
  label: string
  labelClass: string
  placeholder: string
  value: string
  onChange: (val: string) => void
  fileRef: React.RefObject<HTMLInputElement | null>
  onFileUpload: (file: File) => void
}

function ContractArea({ label, labelClass, placeholder, value, onChange, fileRef, onFileUpload }: ContractAreaProps) {
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) onFileUpload(file)
  }

  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
        <span className={`text-[10px] font-bold tracking-wider ${labelClass}`}>{label}</span>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          title="Upload .yaml, .yml, or .json file"
        >
          <Upload className="w-3 h-3" />
          Upload file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".yaml,.yml,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileUpload(file)
          }}
        />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 w-full p-4 text-xs font-mono bg-transparent text-zinc-800 dark:text-zinc-300 placeholder-zinc-300 dark:placeholder-zinc-600 resize-none focus:outline-none leading-relaxed"
        rows={20}
        spellCheck={false}
      />
    </div>
  )
}
