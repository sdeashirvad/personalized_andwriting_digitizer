import { useState, useMemo } from 'react'
import { useStudio } from '../context/useStudio'
import { determineExitCode } from '../engine/adapter'
import { Terminal, Copy, CheckCheck, Download } from 'lucide-react'

export function CLIBuilder() {
  const { result } = useStudio()
  const [jsonOutput, setJsonOutput] = useState(false)
  const [outputFile, setOutputFile] = useState('')
  const [failOnHigh, setFailOnHigh] = useState(true)
  const [failOnMedium, setFailOnMedium] = useState(false)
  const [configPath, setConfigPath] = useState('')
  const [oldPath, setOldPath] = useState('api/v1/openapi.yaml')
  const [newPath, setNewPath] = useState('api/v2/openapi.yaml')
  const [copied, setCopied] = useState(false)

  const command = useMemo(() => {
    const parts = ['npx specguard', oldPath, newPath]
    if (jsonOutput) parts.push('--json')
    if (outputFile) parts.push(`--output ${outputFile}`)
    if (failOnHigh) parts.push('--fail-on-high')
    if (failOnMedium) parts.push('--fail-on-medium')
    if (configPath) parts.push(`--config ${configPath}`)
    return parts.join(' ')
  }, [oldPath, newPath, jsonOutput, outputFile, failOnHigh, failOnMedium, configPath])

  const exitCode = useMemo(() => {
    if (!result) return null
    return determineExitCode(result.report, { failOnHigh, failOnMedium })
  }, [result, failOnHigh, failOnMedium])

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownloadCommand() {
    const script = `#!/bin/sh\n${command}\n`
    const blob = new Blob([script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'run-specguard.sh'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const examples = [
    { label: 'Basic diff', cmd: 'npx specguard old.yaml new.yaml', desc: 'Compare two specs and print a human-readable report' },
    { label: 'JSON output', cmd: 'npx specguard old.yaml new.yaml --json', desc: 'Emit a machine-readable ContractDiffReport to stdout' },
    { label: 'Save report', cmd: 'npx specguard old.yaml new.yaml --json --output report.json', desc: 'Save the JSON report to a file for CI artifacts' },
    { label: 'Fail on HIGH', cmd: 'npx specguard old.yaml new.yaml --fail-on-high', desc: 'Exit 2 when HIGH/CRITICAL breaking changes are present' },
    { label: 'With governance', cmd: 'npx specguard old.yaml new.yaml --config specguard.yml', desc: 'Apply approval and suppression rules from specguard.yml' },
    { label: 'Full CI pipeline', cmd: 'npx specguard old.yaml new.yaml --json --output report.json --fail-on-high --config specguard.yml', desc: 'Generate JSON report, apply governance, fail on high severity' },
  ]

  const flags = [
    { flag: '--json', type: 'boolean', desc: 'Output machine-readable ContractDiffReport JSON instead of human-readable text' },
    { flag: '--output <path>', type: 'string', desc: 'Save JSON report to file. If omitted, JSON goes to stdout' },
    { flag: '--fail-on-high', type: 'boolean', desc: 'Exit 2 when any HIGH or CRITICAL breaking change is present' },
    { flag: '--fail-on-medium', type: 'boolean', desc: 'Exit 1 when any MEDIUM breaking change is present (overrides --fail-on-high threshold)' },
    { flag: '--config <path>', type: 'string', desc: 'Path to specguard.yml governance config (defaults to ./specguard.yml if present)' },
  ]

  const EXIT_CODES = [
    { code: 0, label: 'OK', color: 'text-emerald-500 dark:text-emerald-400', desc: 'No breaking changes detected' },
    { code: 1, label: 'MEDIUM_BREAKING', color: 'text-amber-500 dark:text-amber-400', desc: 'Breaking changes with max severity MEDIUM or LOW' },
    { code: 2, label: 'HIGH_BREAKING', color: 'text-red-500 dark:text-red-400', desc: 'Breaking changes with severity HIGH or CRITICAL' },
    { code: 3, label: 'INVALID_CONTRACT', color: 'text-orange-500 dark:text-orange-400', desc: 'One or more contracts failed to parse' },
    { code: 4, label: 'INTERNAL_ERROR', color: 'text-violet-500 dark:text-violet-400', desc: 'Unexpected internal engine error' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-500" />
          CLI Builder
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Build <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">npx specguard</code> commands — configure flags and copy the result into your terminal or CI pipeline
        </p>
      </div>

      {/* Live exit code banner from current report */}
      {result && exitCode !== null && (
        <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${
          exitCode === 0
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
            : exitCode === 1
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
            : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
        }`}>
          <div className="space-y-0.5">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Live exit code for current report</p>
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-black font-mono ${EXIT_CODES.find(e => e.code === exitCode)?.color ?? 'text-zinc-500'}`}>{exitCode}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{EXIT_CODES.find(e => e.code === exitCode)?.desc}</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {result.report.riskLevel} risk · {result.report.summary.breaking} breaking · score {result.report.riskScore}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Builder panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">File Paths</p>
            </div>
            <div className="p-5 space-y-4">
              <TextInput label="old-contract" value={oldPath} onChange={setOldPath} placeholder="api/v1/openapi.yaml" hint="Path to the previous spec" />
              <TextInput label="new-contract" value={newPath} onChange={setNewPath} placeholder="api/v2/openapi.yaml" hint="Path to the updated spec" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Flags</p>
            </div>
            <div className="p-5 space-y-4">
              <FlagToggle label="--json" description="Output as JSON" checked={jsonOutput} onChange={setJsonOutput} />
              <FlagToggle label="--fail-on-high" description="Exit non-zero on HIGH/CRITICAL" checked={failOnHigh} onChange={setFailOnHigh} />
              <FlagToggle label="--fail-on-medium" description="Exit non-zero on MEDIUM" checked={failOnMedium} onChange={setFailOnMedium} />
              <TextInput label="--output" value={outputFile} onChange={setOutputFile} placeholder="report.json" hint="Save JSON report to file" />
              <TextInput label="--config" value={configPath} onChange={setConfigPath} placeholder="specguard.yml" hint="Governance config path" />
            </div>
          </div>
        </div>

        {/* Command output + examples */}
        <div className="lg:col-span-2 space-y-4">
          {/* Generated command */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
              <span className="text-xs font-mono text-zinc-400">Generated command</span>
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadCommand} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  .sh
                </button>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="p-5 overflow-x-auto">
              <div className="flex items-start gap-2">
                <span className="text-zinc-600 font-mono text-sm mt-0.5 select-none shrink-0">$</span>
                <pre className="text-sm font-mono text-emerald-400 dark:text-emerald-300 whitespace-pre-wrap break-all leading-relaxed">{command}</pre>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Common Examples</p>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {examples.map(ex => <ExampleRow key={ex.label} example={ex} />)}
            </div>
          </div>

          {/* Flags reference */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Flag Reference</p>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {flags.map(f => (
                <div key={f.flag} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-5 py-3">
                  <code className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 sm:w-48 shrink-0">{f.flag}</code>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wide">{f.type}</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exit codes */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Exit Codes</p>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {EXIT_CODES.map(e => (
                <div key={e.code} className={`flex items-center gap-4 px-5 py-2.5 transition-colors ${exitCode === e.code ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}>
                  <code className={`text-lg font-black font-mono w-6 shrink-0 ${e.color}`}>{e.code}</code>
                  <code className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 w-40 shrink-0 hidden sm:block">{e.label}</code>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex-1">{e.desc}</p>
                  {exitCode === e.code && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">← current</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExampleRow({ example }: { example: { label: string; cmd: string; desc: string } }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(example.cmd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="px-5 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{example.label}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0">
          {copied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <code className="block text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-lg whitespace-nowrap">{example.cmd}</code>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{example.desc}</p>
    </div>
  )
}

function FlagToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-8 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} style={{ height: '18px' }}>
          <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </div>
      <div>
        <code className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">{label}</code>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>
      </div>
    </label>
  )
}

function TextInput({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; hint: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{hint}</p>
    </div>
  )
}
