import * as core from '@actions/core'
import * as github from '@actions/github'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { load as yamlLoad } from 'js-yaml'
import {
  parseContract,
  compareContracts,
  generateReport,
  determineExitCode,
  generatePRComment,
  validateConfig,
  toMarkdownReport,
  toConsoleReport,
  toJSONReport,
  ExitCode,
} from '@api-contract-diff/engine'
import type { SpecGuardConfig, ContractDiffReport } from '@api-contract-diff/engine'

// ─── Types ─────────────────────────────────────────────────────────────────────

type CommentMode = 'off' | 'summary' | 'full'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInput(name: string, required = false): string {
  return core.getInput(name, { required })
}

function getBoolInput(name: string, defaultVal = false): boolean {
  const raw = getInput(name)
  if (!raw) return defaultVal
  return raw === 'true' || raw === '1'
}

async function postOrUpdatePRComment(token: string, body: string): Promise<void> {
  const octokit   = github.getOctokit(token)
  const { context } = github
  const pr = context.payload.pull_request
  if (!pr) {
    core.debug('Not a pull_request event — skipping PR comment')
    return
  }

  const { owner, repo } = context.repo
  const issue_number    = pr.number as number
  const marker          = '<!-- api-contract-diff-report -->'

  const { data: comments } = await octokit.rest.issues.listComments({
    owner, repo, issue_number, per_page: 100,
  })

  const existing = comments.find(c => c.body?.includes(marker))
  if (existing) {
    await octokit.rest.issues.updateComment({
      owner, repo, comment_id: existing.id, body,
    })
    core.info(`Updated existing PR comment #${existing.id}`)
  } else {
    const { data } = await octokit.rest.issues.createComment({
      owner, repo, issue_number, body,
    })
    core.info(`Posted new PR comment #${data.id}`)
  }
}

async function writeJobSummary(report: ContractDiffReport): Promise<void> {
  const g = report.governance
  const rows: string[][] = [
    ['Total Changes', String(report.summary.total)],
    ['Breaking',      String(report.summary.breaking)],
    ['Non-Breaking',  String(report.summary.nonBreaking)],
    ['Risk Score',    `${report.riskScore} (${report.riskLevel})`],
    ['HIGH / MEDIUM / LOW', `${report.summary.bySeverity.HIGH} / ${report.summary.bySeverity.MEDIUM} / ${report.summary.bySeverity.LOW}`],
  ]
  if (g) {
    rows.push(['Approved Changes',    String(g.approved)])
    rows.push(['Expired Approvals',   String(g.expired)])
    rows.push(['Unapproved Breaking', String(g.unapprovedBreaking)])
    rows.push(['Suppressed',          String(g.suppressed)])
  }

  await core.summary
    .addHeading(`API Contract Diff — ${report.riskLevel} Risk`, 2)
    .addRaw(`**${report.metadata.oldTitle}** \`v${report.metadata.oldVersion}\` → \`v${report.metadata.newVersion}\`\n\n`)
    .addTable([
      [{ data: 'Metric', header: true }, { data: 'Value', header: true }],
      ...rows,
    ])
    .write()
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  try {
    // ── Read inputs ────────────────────────────────────────────────────────────
    const oldSpecPath  = getInput('old-spec',   true)
    const newSpecPath  = getInput('new-spec',   true)
    const configPath   = getInput('config-path')
    const failOnHigh   = getBoolInput('fail-on-high')
    const failOnMedium = getBoolInput('fail-on-medium')
    const commentMode  = (getInput('comment-mode') || 'full') as CommentMode
    const reportFormat = (getInput('report-format') || 'json')
    const reportPath   = getInput('report-path') || 'api-contract-diff-report.json'
    const token        = getInput('token')

    core.info(`API Contract Diff`)
    core.info(`  Old spec : ${oldSpecPath}`)
    core.info(`  New spec : ${newSpecPath}`)
    core.info(`  Config   : ${configPath || '(auto-detect ./specguard.yml)'}`)

    // ── Load spec files ────────────────────────────────────────────────────────
    let oldRaw: string
    let newRaw: string
    try {
      oldRaw = readFileSync(oldSpecPath, 'utf-8')
      newRaw = readFileSync(newSpecPath, 'utf-8')
    } catch (err) {
      core.setFailed(`Cannot read spec file: ${(err as Error).message}`)
      process.exit(ExitCode.INVALID_CONTRACT)
    }

    let oldSpec, newSpec
    try {
      oldSpec = parseContract(oldRaw)
      newSpec = parseContract(newRaw)
    } catch (err) {
      core.setFailed(`Failed to parse spec: ${(err as Error).message}`)
      process.exit(ExitCode.INVALID_CONTRACT)
    }

    // ── Load governance config ─────────────────────────────────────────────────
    let govConfig: SpecGuardConfig | undefined
    const resolvedConfig = configPath || 'specguard.yml'
    if (existsSync(resolvedConfig)) {
      try {
        const raw    = readFileSync(resolvedConfig, 'utf-8')
        const parsed = yamlLoad(raw)
        govConfig    = validateConfig(parsed)
        core.info(`Loaded governance config: ${resolvedConfig}`)
      } catch (err) {
        core.warning(`Failed to load governance config (${resolvedConfig}): ${(err as Error).message}`)
      }
    } else {
      core.debug(`No governance config found at ${resolvedConfig} — running without governance`)
    }

    // ── Generate report ────────────────────────────────────────────────────────
    const diffResult = compareContracts(oldSpec, newSpec)
    const report     = generateReport(
      diffResult,
      govConfig,
      govConfig ? resolve(resolvedConfig) : undefined,
    )
    const exitCode   = determineExitCode(report, { failOnHigh, failOnMedium })

    // ── Set outputs ────────────────────────────────────────────────────────────
    core.setOutput('risk-score',     String(report.riskScore))
    core.setOutput('risk-level',     report.riskLevel)
    core.setOutput('breaking-count', String(report.summary.breaking))
    core.setOutput('approved-count', String(report.governance?.approved   ?? 0))
    core.setOutput('expired-count',  String(report.governance?.expired    ?? 0))
    core.setOutput('unapproved-count', String(report.governance?.unapprovedBreaking ?? 0))

    // ── Write report file ──────────────────────────────────────────────────────
    let reportContent: string
    switch (reportFormat) {
      case 'markdown': reportContent = toMarkdownReport(report); break
      case 'console':  reportContent = toConsoleReport(report);  break
      default:         reportContent = toJSONReport(report);     break
    }
    writeFileSync(reportPath, reportContent, 'utf-8')
    core.setOutput('report-path', resolve(reportPath))
    core.info(`Report written to: ${reportPath}`)

    // ── Post PR comment ────────────────────────────────────────────────────────
    if (commentMode !== 'off') {
      const isPR = github.context.eventName === 'pull_request' ||
                   github.context.eventName === 'pull_request_target'
      if (isPR && token) {
        try {
          const comment = generatePRComment(report, commentMode)
          if (comment) {
            await postOrUpdatePRComment(token, comment)
          }
        } catch (err) {
          core.warning(`Failed to post PR comment: ${(err as Error).message}`)
        }
      } else if (!isPR) {
        core.debug('Not a pull_request event — skipping PR comment')
      } else if (!token) {
        core.warning('No token provided — cannot post PR comment')
      }
    }

    // ── Job summary ────────────────────────────────────────────────────────────
    await writeJobSummary(report)

    // ── Log final result ───────────────────────────────────────────────────────
    const g = report.governance
    core.info(`\nResults:`)
    core.info(`  Total changes   : ${report.summary.total}`)
    core.info(`  Breaking        : ${report.summary.breaking}`)
    core.info(`  Non-breaking    : ${report.summary.nonBreaking}`)
    core.info(`  Risk score      : ${report.riskScore} (${report.riskLevel})`)
    if (g) {
      core.info(`  Approved        : ${g.approved}`)
      core.info(`  Expired         : ${g.expired}`)
      core.info(`  Suppressed      : ${g.suppressed}`)
      core.info(`  Unapproved      : ${g.unapprovedBreaking}`)
    }

    // ── Exit ───────────────────────────────────────────────────────────────────
    if (exitCode !== ExitCode.OK) {
      core.setFailed(
        `API Contract Diff detected ${report.summary.breaking} breaking change(s) ` +
        `[${report.riskLevel}]. ` +
        (g && g.unapprovedBreaking > 0
          ? `${g.unapprovedBreaking} unapproved breaking change(s) require governance entries in specguard.yml.`
          : '')
      )
    }

  } catch (err) {
    core.setFailed(`Unexpected error: ${(err as Error).message}`)
    if (process.env.RUNNER_DEBUG === '1') {
      core.error((err as Error).stack ?? '')
    }
    process.exit(ExitCode.INTERNAL_ERROR)
  }
}

run()
