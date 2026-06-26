import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowRight, Terminal, GitBranch, Monitor, AlertTriangle, CheckCircle2, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { LabMark } from '../../brand/LabMark'
import { LabFooter } from '../../brand/LabFooter'
import { BRAND } from '../../brand/tokens'
import { NpmInstallStrip } from '../../components/landing/NpmInstallStrip'

function LandingNav() {
  const [dark, setDark] = useState(() => localStorage.getItem('acd_theme') !== 'light')

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('acd_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <LabMark showLabs size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={BRAND.npmUrl}
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:border-red-300 dark:hover:border-red-800 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            npm v{BRAND.npmVersion}
          </a>
          <a
            href={BRAND.labsUrl}
            className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            {BRAND.labs}
          </a>
          <Link
            to="/studio"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Open Studio
          </Link>
          <button
            onClick={() => setDark(d => !d)}
            className="w-8 h-8 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </nav>
  )
}

export function LandingPage() {
  useEffect(() => {
    const theme = localStorage.getItem('acd_theme')
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/30 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">
            {BRAND.labs} · API Contract Intelligence ·{' '}
            <a href={BRAND.npmUrl} className="hover:underline" target="_blank" rel="noreferrer">
              npm v{BRAND.npmVersion}
            </a>
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl leading-[1.1]">
            Catch API breaking changes before production
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            SpecSentinel compares two OpenAPI specs and tells you what breaks clients, what is safe to ship, and how risky the change is — in seconds, in CI, or in your PR.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/studio"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/25"
            >
              Try SpecSentinel Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={BRAND.npmUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 font-mono text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              {BRAND.npmInstall}
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6">The problem</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: AlertTriangle, title: 'Silent client breakage', desc: 'Removing a field or endpoint breaks mobile apps and partners without a compile error.' },
              { icon: Shield, title: 'CI blind spots', desc: 'Unit tests pass while contract drift ships to production unnoticed.' },
              { icon: GitBranch, title: 'Review fatigue', desc: 'Manual OpenAPI diffs are slow, inconsistent, and easy to miss in large PRs.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
                <Icon className="w-5 h-5 text-amber-500 mb-3" />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight mb-2">How it works</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-10 max-w-xl">Three steps from spec change to ship/no-ship decision.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Compare specs', desc: 'Point SpecSentinel at your old and new OpenAPI YAML or JSON files.' },
            { step: '02', title: 'Get a risk report', desc: 'Every change is classified breaking or safe, with severity and consumer impact.' },
            { step: '03', title: 'Gate CI & PRs', desc: 'Fail builds on HIGH breaking changes. Post structured PR comments automatically.' },
          ].map(({ step, title, desc }) => (
            <div key={step}>
              <span className="text-3xl font-bold text-indigo-200 dark:text-indigo-900">{step}</span>
              <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes / proof strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-indigo-50/30 dark:from-zinc-900 dark:to-indigo-950/20 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">HIGH</span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Risk score 61</span>
            <span className="text-xs text-zinc-500">· 3 breaking · 2 non-breaking</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
              <span className="shrink-0 font-bold">BREAKING</span>
              <span>DELETE /products/&#123;id&#125; — endpoint removed</span>
            </div>
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
              <span className="shrink-0 font-bold">BREAKING</span>
              <span>POST /users — required field email removed</span>
            </div>
            <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="shrink-0 font-bold">SAFE</span>
              <span>GET /inventory — endpoint added</span>
            </div>
          </div>
          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
            Sample output from SpecSentinel&apos;s breaking-removal scenario. Open Studio to explore live.
          </p>
        </div>
      </section>

      <NpmInstallStrip />

      {/* Integrations */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Ship it your way</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Terminal, title: 'CLI', desc: 'npm install -g specsentinel — JSON, Markdown, or console output from any terminal.', href: BRAND.npmUrl },
              { icon: GitBranch, title: 'GitHub Action', desc: 'Gate PRs, post comments, and apply governance rules from specguard.yml.', href: BRAND.githubUrl },
              { icon: Monitor, title: '--webview', desc: 'Open a local report-only Studio view from any CLI run.', href: BRAND.npmUrl },
            ].map(({ icon: Icon, title, desc, href }) => (
              <a key={title} href={href} target="_blank" rel="noreferrer" className="flex gap-4 group">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Labs credit */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <CheckCircle2 className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Built by {BRAND.labs}</h2>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          SpecSentinel is part of the SdeAshirvad Labs product ecosystem — engineering tools for observable, deterministic systems.
          Created by{' '}
          <a href={BRAND.personalUrl} className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
            {BRAND.personalName}
          </a>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href={BRAND.labsUrl} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
            Explore {BRAND.labs} →
          </a>
          <Link to="/studio" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Open SpecSentinel Studio →
          </Link>
        </div>
      </section>

      <LabFooter />
    </div>
  )
}
