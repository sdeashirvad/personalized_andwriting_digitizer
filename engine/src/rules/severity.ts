import type { ChangeType, Severity } from '../models/types.js'

export interface RuleDescriptor {
  severity: Severity
  breaking: boolean
  label: string
}

export const RULE_MAP: Record<ChangeType, RuleDescriptor> = {
  'endpoint-removed':      { severity: 'HIGH',   breaking: true,  label: 'Endpoint Removed' },
  'endpoint-added':        { severity: 'INFO',   breaking: false, label: 'Endpoint Added' },
  'method-removed':        { severity: 'HIGH',   breaking: true,  label: 'Method Removed' },
  'method-added':          { severity: 'INFO',   breaking: false, label: 'Method Added' },
  'request-field-removed': { severity: 'MEDIUM', breaking: true,  label: 'Request Field Removed' },
  'request-field-added':   { severity: 'LOW',    breaking: false, label: 'Request Field Added' },
  'response-field-removed':{ severity: 'HIGH',   breaking: true,  label: 'Response Field Removed' },
  'response-field-added':  { severity: 'LOW',    breaking: false, label: 'Response Field Added' },
  'field-type-changed':    { severity: 'HIGH',   breaking: true,  label: 'Field Type Changed' },
  'field-required-changed':{ severity: 'HIGH',   breaking: true,  label: 'Required Changed' },
  'enum-value-removed':    { severity: 'HIGH',   breaking: true,  label: 'Enum Value Removed' },
  'enum-value-added':      { severity: 'LOW',    breaking: false, label: 'Enum Value Added' },
  'status-code-removed':   { severity: 'HIGH',   breaking: true,  label: 'Status Code Removed' },
  'status-code-added':     { severity: 'INFO',   breaking: false, label: 'Status Code Added' },
}
