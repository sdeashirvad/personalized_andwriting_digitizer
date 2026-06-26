import { BRAND } from './tokens'

export function LabFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div className="space-y-2 max-w-sm">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {BRAND.product} by {BRAND.labs}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Open-source API contract intelligence. Built by{' '}
              <a href={BRAND.personalUrl} className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noreferrer">
                {BRAND.personalName}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <a href={BRAND.labsUrl} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" target="_blank" rel="noreferrer">
              {BRAND.labs}
            </a>
            <a href={BRAND.githubUrl} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={BRAND.npmUrl} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" target="_blank" rel="noreferrer">
              npm v{BRAND.npmVersion}
            </a>
            <a href="/studio" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Studio
            </a>
          </div>
        </div>
        <p className="mt-8 text-[10px] text-zinc-400 dark:text-zinc-600">
          MIT License · OpenAPI 3.0 contract diff engine
        </p>
      </div>
    </footer>
  )
}
