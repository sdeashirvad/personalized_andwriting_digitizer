import { Shield, CheckCircle2, AlertTriangle, EyeOff, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { ContractDiffReport, DiffChange, GovernanceSummary } from '@api-contract-diff/engine'

interface GovernancePanelProps {
  report: ContractDiffReport
}

export function GovernancePanel({ report }: GovernancePanelProps) {
  const [open, setOpen] = useState(true)

  const g = report.governance
  if (!g) return null

  const approved   = report.changes.filter(c => c.governanceStatus === 'APPROVED')
  const expired    = report.changes.filter(c => c.governanceStatus === 'EXPIRED')
  const suppressed = report.changes.filter(c => c.governanceStatus === 'SUPPRESSED')
  const unapproved = report.changes.filter(c => c.governanceStatus === 'UNAPPROVED')

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Governance Status
          </span>
          {g.configPath && (
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              {g.configPath}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SummaryPills g={g} />
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800">
            <StatCell
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              label="Approved"
              value={g.approved}
              color="emerald"
            />
            <StatCell
              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              label="Expired"
              value={g.expired}
              color="amber"
            />
            <StatCell
              icon={<EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
              label="Suppressed"
              value={g.suppressed}
              color="zinc"
            />
            <StatCell
              icon={<XCircle className="w-3.5 h-3.5 text-red-500" />}
              label="Unapproved Breaking"
              value={g.unapprovedBreaking}
              color={g.unapprovedBreaking > 0 ? 'red' : 'emerald'}
            />
          </div>

          {/* Detail sections */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">

            {/* APPROVED */}
            {approved.length > 0 && (
              <ChangeSection
                title="Approved Changes"
                count={approved.length}
                accent="emerald"
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              >
                {approved.map((ch, i) => (
                  <ApprovedChangeRow key={i} change={ch} />
                ))}
              </ChangeSection>
            )}

            {/* EXPIRED */}
            {expired.length > 0 && (
              <ChangeSection
                title="Expired Approvals"
                count={expired.length}
                accent="amber"
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              >
                {expired.map((ch, i) => (
                  <ExpiredChangeRow key={i} change={ch} />
                ))}
              </ChangeSection>
            )}

            {/* UNAPPROVED */}
            {unapproved.length > 0 && (
              <ChangeSection
                title="Unapproved Breaking Changes"
                count={unapproved.length}
                accent="red"
                icon={<XCircle className="w-3.5 h-3.5 text-red-500" />}
              >
                {unapproved.map((ch, i) => (
                  <UnapprovedChangeRow key={i} change={ch} />
                ))}
              </ChangeSection>
            )}

            {/* SUPPRESSED */}
            {suppressed.length > 0 && (
              <ChangeSection
                title="Suppressed Findings"
                count={suppressed.length}
                accent="zinc"
                icon={<EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
                dimmed
              >
                {suppressed.map((ch, i) => (
                  <SuppressedChangeRow key={i} change={ch} />
                ))}
              </ChangeSection>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Summary pills ────────────────────────────────────────────────────────────

function SummaryPills({ g }: { g: GovernanceSummary }) {
  return (
    <div className="flex items-center gap-1.5">
      {g.approved > 0 && (
        <Pill color="emerald" label={`${g.approved} approved`} />
      )}
      {g.expired > 0 && (
        <Pill color="amber" label={`${g.expired} expired`} />
      )}
      {g.unapprovedBreaking > 0 && (
        <Pill color="red" label={`${g.unapprovedBreaking} unapproved`} />
      )}
      {g.suppressed > 0 && (
        <Pill color="zinc" label={`${g.suppressed} suppressed`} />
      )}
      {g.unapprovedBreaking === 0 && g.approved > 0 && g.expired === 0 && (
        <Pill color="emerald" label="all governed" />
      )}
    </div>
  )
}

function Pill({ color, label }: { color: string; label: string }) {
  const classes: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    red:     'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    zinc:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  }
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${classes[color] ?? classes.zinc}`}>
      {label}
    </span>
  )
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  const valueColors: Record<string, string> = {
    emerald: 'text-emerald-500 dark:text-emerald-400',
    amber:   'text-amber-500 dark:text-amber-400',
    red:     'text-red-500 dark:text-red-400',
    zinc:    'text-zinc-500 dark:text-zinc-400',
  }
  return (
    <div className="flex flex-col gap-1 px-5 py-4 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${valueColors[color] ?? valueColors.zinc}`}>
        {value}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function ChangeSection({ title, count, accent, icon, children, dimmed = false }: {
  title: string
  count: number
  accent: string
  icon: React.ReactNode
  children: React.ReactNode
  dimmed?: boolean
}) {
  const [open, setOpen] = useState(true)
  const accentText: Record<string, string> = {
    emerald: 'text-emerald-500 dark:text-emerald-400',
    amber:   'text-amber-500 dark:text-amber-400',
    red:     'text-red-500 dark:text-red-400',
    zinc:    'text-zinc-400 dark:text-zinc-500',
  }
  return (
    <div className={dimmed ? 'opacity-60' : ''}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left"
      >
        {icon}
        <span className={`text-xs font-semibold ${accentText[accent] ?? accentText.zinc}`}>
          {title}
        </span>
        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
          {count}
        </span>
        <span className="ml-auto">
          {open
            ? <ChevronDown className="w-3 h-3 text-zinc-400" />
            : <ChevronRight className="w-3 h-3 text-zinc-400" />
          }
        </span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

// ─── Row variants ─────────────────────────────────────────────────────────────

function ApprovedChangeRow({ change }: { change: DiffChange }) {
  const m = change.governanceMetadata
  return (
    <div className="px-5 py-3 flex flex-col gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          APPROVED
        </span>
        <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {change.method ? <span className="font-bold">{change.method.toUpperCase()} </span> : null}
          {change.path}
        </code>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{change.description}</span>
      </div>
      {m && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 pl-1">
          <span><span className="text-zinc-400 dark:text-zinc-600">Owner:</span> {m.owner}</span>
          <span><span className="text-zinc-400 dark:text-zinc-600">Approved by:</span> {m.approvedBy}</span>
          <span className="sm:col-span-2"><span className="text-zinc-400 dark:text-zinc-600">Reason:</span> {m.reason}</span>
          {m.expires && (
            <span><span className="text-zinc-400 dark:text-zinc-600">Expires:</span> {m.expires}</span>
          )}
          {m.createdAt && (
            <span><span className="text-zinc-400 dark:text-zinc-600">Created:</span> {m.createdAt}</span>
          )}
        </div>
      )}
    </div>
  )
}

function ExpiredChangeRow({ change }: { change: DiffChange }) {
  const m = change.governanceMetadata
  return (
    <div className="px-5 py-3 flex flex-col gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          EXPIRED
        </span>
        <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {change.method ? <span className="font-bold">{change.method.toUpperCase()} </span> : null}
          {change.path}
        </code>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{change.description}</span>
      </div>
      {m && (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-1 space-y-0.5">
          {m.owner && <span className="block"><span className="text-zinc-400 dark:text-zinc-600">Owner:</span> {m.owner}</span>}
          {m.reason && <span className="block"><span className="text-zinc-400 dark:text-zinc-600">Reason:</span> {m.reason}</span>}
          {m.expires && (
            <span className="block text-amber-500 dark:text-amber-400 font-medium">
              ⚠ Approval expired: {m.expires} — renew or remove from specguard.yml
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function UnapprovedChangeRow({ change }: { change: DiffChange }) {
  return (
    <div className="px-5 py-3 flex flex-col gap-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          UNAPPROVED
        </span>
        <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {change.method ? <span className="font-bold">{change.method.toUpperCase()} </span> : null}
          {change.path}
        </code>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{change.description}</span>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pl-1">
        Add an <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">approvedChanges</code> entry to <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">specguard.yml</code> to track this decision.
      </p>
    </div>
  )
}

function SuppressedChangeRow({ change }: { change: DiffChange }) {
  return (
    <div className="px-5 py-2.5 flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        SUPPRESSED
      </span>
      <code className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
        {change.method ? <span className="font-bold">{change.method.toUpperCase()} </span> : null}
        {change.path}
      </code>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">{change.description}</span>
    </div>
  )
}
