import { Monitor, X } from 'lucide-react'
import { useState } from 'react'
import type { WebViewMeta } from '../context/StudioContext'

interface Props {
  meta: WebViewMeta
}

export function WebViewBanner({ meta }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Monitor className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-indigo-300">Local WebView</span>
        </div>
        <div className="h-3 w-px bg-indigo-800/60 hidden sm:block" />
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-indigo-400/80 font-mono">
          <span>{meta.oldPath} → {meta.newPath}</span>
          {meta.configPath && (
            <>
              <span className="text-indigo-700">·</span>
              <span>governance: {meta.configPath}</span>
            </>
          )}
          <span className="text-indigo-700">·</span>
          <span>engine v{meta.engineVersion}</span>
          <span className="text-indigo-700">·</span>
          <span className={`font-semibold ${
            meta.riskLevel === 'HIGH' || meta.riskLevel === 'CRITICAL'
              ? 'text-red-400'
              : meta.riskLevel === 'MEDIUM'
              ? 'text-amber-400'
              : meta.riskLevel === 'LOW'
              ? 'text-blue-400'
              : 'text-emerald-400'
          }`}>{meta.riskLevel}</span>
          <span className="text-indigo-700">·</span>
          <span>{meta.breakingCount} breaking</span>
          <span className="text-indigo-700">·</span>
          <span>{meta.reportGeneratedAt.slice(0, 19).replace('T', ' ')} UTC</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto shrink-0 text-indigo-600 hover:text-indigo-400 transition-colors"
          aria-label="Dismiss WebView banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
