import { Network, ArrowDown, GitBranch, Terminal, FileJson, Globe, Code2, Layers, Shield, Zap } from 'lucide-react'

export function ArchitectureView() {
  const pipeline = [
    {
      id: 'old',
      label: 'Old Contract',
      sublabel: 'OpenAPI 3.x YAML / JSON',
      icon: FileJson,
      color: 'text-red-400',
      bg: 'bg-red-950/30 border-red-800',
      desc: 'The previous version of the API specification. Parsed from YAML or JSON into an internal AST.',
    },
    {
      id: 'diff',
      label: 'Diff Engine',
      sublabel: 'compareContracts()',
      icon: Code2,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/30 border-indigo-800',
      desc: 'Walks the AST of both specs simultaneously. Detects: endpoint removals, field removals, type changes, required field additions, enum changes, status code removals. Emits a DiffChange[] array.',
    },
    {
      id: 'risk',
      label: 'Risk Engine',
      sublabel: 'calculateRiskScore()',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-950/30 border-amber-800',
      desc: 'Applies configurable severity weights to each DiffChange. Produces a numeric risk score and a categorical risk level: NONE / LOW / MEDIUM / HIGH / CRITICAL.',
    },
    {
      id: 'impact',
      label: 'Impact Engine',
      sublabel: 'generateImpactReports()',
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/30 border-cyan-800',
      desc: 'Maps each breaking change to human-readable consumer impact descriptions. Explains what breaks for API consumers — not just what changed.',
    },
    {
      id: 'governance',
      label: 'Governance Engine',
      sublabel: 'applyGovernance()',
      icon: Shield,
      color: 'text-violet-400',
      bg: 'bg-violet-950/30 border-violet-800',
      desc: 'Evaluates changes against specguard.yml. Supports approvals (with ownership, expiry, and audit trail), suppressions (by rule), and expiration tracking. Optional — only runs when a config file is present.',
    },
    {
      id: 'report',
      label: 'ContractDiffReport',
      sublabel: 'generateReport()',
      icon: FileJson,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30 border-emerald-800',
      desc: 'The canonical, versioned, machine-readable output. Stable schema — safe to store in CI artifacts, parse downstream, and compare across runs. Contains: riskScore, riskLevel, summary, changes, impacts, governance.',
    },
  ]

  const outputs = [
    { label: 'CLI', sublabel: 'Human-readable terminal', icon: Terminal, color: 'text-amber-400', desc: 'ANSI-colored console output for local development and CI logs' },
    { label: 'JSON', sublabel: 'Machine-readable', icon: FileJson, color: 'text-indigo-400', desc: 'Full ContractDiffReport serialized for downstream tooling' },
    { label: 'HTML', sublabel: 'Standalone page', icon: Globe, color: 'text-emerald-400', desc: 'Self-contained dark-themed report page for sharing and archiving' },
    { label: 'PR Comments', sublabel: 'GitHub Markdown', icon: GitBranch, color: 'text-blue-400', desc: 'Governance-aware summary or full report posted to pull requests' },
    { label: 'GitHub Action', sublabel: 'CI/CD integration', icon: GitBranch, color: 'text-violet-400', desc: 'Drop-in action with configurable exit codes, comment mode, and config path' },
    { label: 'WebView', sublabel: 'Future: this Studio', icon: Network, color: 'text-zinc-400', desc: 'SpecGuard Studio evolves into the canonical WebView frontend for the engine' },
  ]

  const designDecisions = [
    {
      title: 'Zero-dependency comparison logic',
      desc: 'The diff engine has no runtime dependencies. All comparison logic is pure TypeScript — no OpenAPI validation libraries, no ajv, no external parsers beyond js-yaml/JSON.parse.',
    },
    {
      title: 'ContractDiffReport as the single source of truth',
      desc: 'Every output format (CLI, JSON, HTML, Markdown, PR comments) is generated from one ContractDiffReport. There is no separate data model per output. This guarantees consistency.',
    },
    {
      title: 'Versioned report schema',
      desc: 'reportVersion is a semantic version that allows consumers to detect schema changes. Downstream tooling can assert on the version before deserializing.',
    },
    {
      title: 'Governance is additive and optional',
      desc: 'The governance layer is applied after diff + risk + impact computation. If no specguard.yml is present, the engine runs without governance and report.governance is undefined.',
    },
    {
      title: 'Engine adapter pattern',
      desc: 'The frontend imports the engine through an adapter (adapter.ts) that abstracts ENGINE_MODE. Swapping to a published npm package requires changing one constant — no component changes.',
    },
    {
      title: 'Runs fully client-side',
      desc: 'The diff engine is bundled into the Vite frontend. No server round-trip is needed. The browser runs compareContracts() synchronously — typically < 5ms for real-world specs.',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-500" />
          Architecture
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          How SpecGuard transforms two OpenAPI contracts into governed, machine-readable reports across every output format
        </p>
      </div>

      {/* Pipeline diagram */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Processing Pipeline</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Visual pipeline */}
          <div className="space-y-1">
            <div className="flex flex-col items-center">
              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3 w-full mb-2">
                {['Old Contract', 'New Contract'].map((label, i) => (
                  <div key={label} className={`rounded-lg border px-4 py-3 text-center ${i === 0 ? 'bg-red-950/20 border-red-800' : 'bg-emerald-950/20 border-emerald-800'}`}>
                    <FileJson className={`w-4 h-4 mx-auto mb-1.5 ${i === 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                    <p className="text-xs font-semibold text-zinc-300">{label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">OpenAPI YAML/JSON</p>
                  </div>
                ))}
              </div>

              {pipeline.slice(1).map((stage) => {
                const Icon = stage.icon
                return (
                  <div key={stage.id} className="flex flex-col items-center w-full">
                    <ArrowDown className="w-4 h-4 text-zinc-600 my-1" />
                    <div className={`w-full rounded-lg border px-4 py-3 flex items-center gap-3 ${stage.bg}`}>
                      <div className="w-8 h-8 rounded-md bg-zinc-900/60 flex items-center justify-center shrink-0">
                        <Icon className={`w-4 h-4 ${stage.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${stage.color}`}>{stage.label}</p>
                        <code className="text-[10px] text-zinc-500 font-mono">{stage.sublabel}</code>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Output fan-out */}
              <ArrowDown className="w-4 h-4 text-zinc-600 my-1" />
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-center">
                <p className="text-xs font-semibold text-zinc-300">Output Renderers</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">CLI · JSON · HTML · Markdown · PR Comments · GitHub Action</p>
              </div>
            </div>
          </div>

          {/* Stage descriptions */}
          <div className="space-y-2">
            {pipeline.map(stage => {
              const Icon = stage.icon
              return (
                <div key={stage.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-3">
                  <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={`w-3.5 h-3.5 ${stage.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{stage.label}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{stage.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Output formats */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Output Formats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {outputs.map(out => {
            const Icon = out.icon
            return (
              <div key={out.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${out.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{out.label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{out.sublabel}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{out.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Design decisions */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Design Decisions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {designDecisions.map(d => (
            <div key={d.title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{d.title}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Technology Stack</h2>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {[
              { layer: 'Engine', tech: 'TypeScript (ESM)', detail: 'Zero runtime deps in comparison logic. Built with tsc, distributed as tarball.' },
              { layer: 'Frontend', tech: 'React 19 + Vite 8', detail: 'Engine bundled client-side. Tailwind CSS 4 for styling. Lucide for icons.' },
              { layer: 'CLI', tech: 'Node.js', detail: 'Thin shell around the engine. Supports all output formats and governance config.' },
              { layer: 'GitHub Action', tech: 'Composite Action', detail: 'Wraps the CLI. Posts PR comments via GitHub API. Configurable failure thresholds.' },
              { layer: 'Spec format', tech: 'OpenAPI 3.x', detail: 'YAML and JSON input. js-yaml for parsing. Custom AST walker for diffing.' },
              { layer: 'Governance config', tech: 'YAML (specguard.yml)', detail: 'Approval entries with ownership, expiry, and audit fields. Suppression rules by rule name.' },
            ].map(row => (
              <div key={row.layer} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 px-5 py-3.5">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 sm:w-28 shrink-0">{row.layer}</span>
                <code className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 sm:w-40 shrink-0">{row.tech}</code>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data flow */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Data Flow</h2>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-xs font-mono text-zinc-400">engine/src — call sequence</p>
          </div>
          <pre className="p-5 text-[11px] font-mono leading-loose text-zinc-300 overflow-auto">
{`const diffResult   = compareContracts(oldSpec, newSpec)
//    └─ DiffChange[] with path, method, severity, breaking

const report       = generateReport(diffResult, governanceConfig?)
//    ├─ calculateRiskScore(changes)  → riskScore, riskLevel
//    ├─ generateImpactReports(changes) → ImpactReport[]
//    ├─ applyGovernance(changes, config) → GovernanceSummary
//    └─ ContractDiffReport (versioned, stable)

// Render to any format — all from the same report:
toConsoleReport(report)   // ANSI terminal output
toJSONReport(report)      // Serialized ContractDiffReport
toMarkdownReport(report)  // Docs / GitHub wiki
toHTML(report)            // Standalone HTML page
generatePRComment(report) // GitHub PR Markdown comment
determineExitCode(report) // 0 | 1 | 2 | 3 | 4`}
          </pre>
        </div>
      </section>
    </div>
  )
}
