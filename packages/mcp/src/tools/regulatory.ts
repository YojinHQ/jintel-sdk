import type { JintelClient } from '@yojinhq/jintel-client';
import type {
  ClinicalTrialFilterOptions,
  FdaEventFilterOptions,
  FdaEventType,
  FilingType,
  FilingsFilterOptions,
  GovernmentContractFilterOptions,
  LitigationFilterOptions,
  RiskSignalFilterOptions,
  RiskSignalType,
  Severity,
} from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  ASC_DESC,
  LIMIT_SCHEMA,
  OFFSET_SCHEMA,
  SINCE_SCHEMA,
  SORT_SCHEMA,
  TICKER_SCHEMA,
  UNTIL_SCHEMA,
  asOptionalBoolean,
  asOptionalEnum,
  asOptionalEnumArray,
  asOptionalNumber,
  asOptionalString,
  asString,
  buildArrayFilter,
  errorMessage,
  fail,
  fetchSubGraph,
  runTool,
} from './shared.js';

const RISK_SIGNAL_TYPES: readonly RiskSignalType[] = [
  'SANCTIONS',
  'LITIGATION',
  'REGULATORY_ACTION',
  'ADVERSE_MEDIA',
  'PEP',
];
const SEVERITIES: readonly Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const FILING_TYPES: readonly FilingType[] = [
  'FILING_10K',
  'FILING_10Q',
  'FILING_8K',
  'ANNUAL_REPORT',
  'OTHER',
];
const FDA_EVENT_TYPES: readonly FdaEventType[] = [
  'DRUG_ADVERSE',
  'DEVICE_ADVERSE',
  'DRUG_RECALL',
];

export function buildRegulatoryTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_sanctions_screen',
      bundle: 'regulatory' as const,
      description:
        "Screen a person or organization NAME (not ticker) against global sanctions lists for KYC, counterparty due-diligence, or regulatory risk. Returns array of matches with `{ listName, matchedName, score, sdnType, programs }`. For sanctions ATTACHED to a known company entity, use `jintel_regulatory` (entity-level) or `jintel_risk_signals` with `types: ['SANCTIONS']` instead.",
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Full legal name of person or entity',
          },
          country: {
            type: 'string',
            description: 'Optional ISO country code or name to refine match',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const name = asString(args.name, 'name');
          const country = asOptionalString(args.country, 'country');
          return runTool(() => client.sanctionsScreen(name, country));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_regulatory',
      bundle: 'regulatory' as const,
      description:
        'Regulatory bundle for an entity in one call — SEC filings + sanctions matches + campaign-finance. Returns `{ id, tickers, data: RegulatoryData }`. Use this when you want regulatory context broadly. For ONLY periodic 10-K/10-Q/8-K filings (with summaries) use `jintel_periodic_filings`. For only sanctions/litigation as risk signals use `jintel_risk_signals`.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          filingTypes: {
            type: 'array',
            items: { type: 'string', enum: FILING_TYPES },
            description: 'Restrict filings to specific form types.',
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const types = asOptionalEnumArray(
            args.filingTypes,
            'filingTypes',
            FILING_TYPES,
          );
          const filingsFilter: FilingsFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            types != null
              ? { since, until, limit, sort, types }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'regulatory', { filingsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_periodic_filings',
      bundle: 'regulatory' as const,
      description:
        'Quarterly / annual SEC filings (10-K, 10-Q, 8-K) for an entity, with summary metadata and direct links to filings on SEC.gov. Returns `{ id, tickers, data: PeriodicFiling[] }` newest first. Use for deep-dive on filing history; for the broader regulatory picture (filings + sanctions + campaign-finance) use `jintel_regulatory`.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const filter = buildArrayFilter(args);
          return runTool(() =>
            fetchSubGraph(
              client,
              ticker,
              'periodicFilings',
              filter ? { filter } : undefined,
            ),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_risk_signals',
      bundle: 'regulatory' as const,
      description:
        'Risk signals attached to an entity — sanctions, litigation, regulatory actions, adverse media, PEP. Filter by `types` and `severities` for triage workflows. Returns `{ id, tickers, data: RiskSignal[] }`. For deep-dive on a specific risk category use the dedicated tool: `jintel_litigation`, `jintel_fda_events`, etc. For a NAME-based sanctions screen (no entity required) use `jintel_sanctions_screen`.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          types: {
            type: 'array',
            items: { type: 'string', enum: RISK_SIGNAL_TYPES },
            description: 'Restrict to specific risk signal types.',
          },
          severities: {
            type: 'array',
            items: { type: 'string', enum: SEVERITIES },
            description: 'Restrict to specific severities.',
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const types = asOptionalEnumArray(
            args.types,
            'types',
            RISK_SIGNAL_TYPES,
          );
          const severities = asOptionalEnumArray(
            args.severities,
            'severities',
            SEVERITIES,
          );
          const riskSignalFilter: RiskSignalFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            types != null ||
            severities != null
              ? { since, until, limit, sort, types, severities }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'risk', { riskSignalFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_litigation',
      bundle: 'regulatory' as const,
      description:
        "Active and historical lawsuits involving an entity — court, nature of suit, dates, parties. Returns `{ id, tickers, data: LitigationCase[] }`. Filter `onlyActive=true` for pending cases only; `natureOfSuit` substring match (e.g. 'PATENT', 'ANTITRUST', 'SECURITIES'); `court` for jurisdiction (e.g. 'N.D. CAL').",
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          onlyActive: {
            type: 'boolean',
            description:
              'Only include cases with no termination date (still open).',
          },
          court: {
            type: 'string',
            description:
              "Case-insensitive substring match against court name (e.g. 'N.D. CAL').",
          },
          natureOfSuit: {
            type: 'string',
            description:
              "Case-insensitive substring match (e.g. 'PATENT', 'ANTITRUST').",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const onlyActive = asOptionalBoolean(args.onlyActive, 'onlyActive');
          const court = asOptionalString(args.court, 'court');
          const natureOfSuit = asOptionalString(
            args.natureOfSuit,
            'natureOfSuit',
          );
          const offset = asOptionalNumber(args.offset, 'offset');
          const litigationFilter: LitigationFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            onlyActive != null ||
            court != null ||
            natureOfSuit != null ||
            offset != null
              ? {
                  since,
                  until,
                  limit,
                  sort,
                  onlyActive,
                  court,
                  natureOfSuit,
                  offset,
                }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'litigation', { litigationFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_fda_events',
      bundle: 'regulatory' as const,
      description:
        "FDA adverse-event reports and recalls referencing an entity. Returns `{ id, tickers, data: FdaEvent[] }`. `types`: DRUG_ADVERSE / DEVICE_ADVERSE / DRUG_RECALL. `severity`: 'CLASS I/II/III' for recalls (CLASS I = highest risk). **Most relevant for pharma / med-device tickers** — other sectors typically return empty.",
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          types: {
            type: 'array',
            items: { type: 'string', enum: FDA_EVENT_TYPES },
            description: 'Restrict to one or more event kinds.',
          },
          severity: {
            type: 'string',
            description:
              "Exact severity match — 'CLASS I' / 'CLASS II' / 'CLASS III' for recalls, or outcome flag for adverse events.",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const types = asOptionalEnumArray(
            args.types,
            'types',
            FDA_EVENT_TYPES,
          );
          const severity = asOptionalString(args.severity, 'severity');
          const offset = asOptionalNumber(args.offset, 'offset');
          const fdaEventsFilter: FdaEventFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            types != null ||
            severity != null ||
            offset != null
              ? { since, until, limit, sort, types, severity, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'fdaEvents', { fdaEventsFilter }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_clinical_trials',
      bundle: 'regulatory' as const,
      description:
        "Clinical trial registrations referencing an entity (sponsor or drug). Returns `{ id, tickers, data: ClinicalTrial[] }` newest first. Filter `phase` (case-insensitive substring, e.g. 'PHASE3') and `status` (e.g. 'RECRUITING', 'COMPLETED'). **Most relevant for biotech / pharma tickers** — other sectors typically return empty.",
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          phase: {
            type: 'string',
            description:
              "Case-insensitive phase match (e.g. 'PHASE3' or 'PHASE').",
          },
          status: {
            type: 'string',
            description: "Exact status match (e.g. 'RECRUITING', 'COMPLETED').",
          },
          offset: OFFSET_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const phase = asOptionalString(args.phase, 'phase');
          const status = asOptionalString(args.status, 'status');
          const offset = asOptionalNumber(args.offset, 'offset');
          const clinicalTrialsFilter: ClinicalTrialFilterOptions | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            phase != null ||
            status != null ||
            offset != null
              ? { since, until, limit, sort, phase, status, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'clinicalTrials', {
              clinicalTrialsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_government_contracts',
      bundle: 'regulatory' as const,
      description:
        'US federal government contracts awarded to an entity — agency, amount, award date, contract description. Returns `{ id, tickers, data: GovernmentContract[] }`. Use `minAmount` to skip small awards. **Most relevant for defense / aerospace / federal-services tickers.**',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: TICKER_SCHEMA,
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
          minAmount: {
            type: 'number',
            description:
              'Only include contracts with amount >= this value (USD).',
          },
          offset: OFFSET_SCHEMA,
        },
        required: ['ticker'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const ticker = asString(args.ticker, 'ticker');
          const since = asOptionalString(args.since, 'since');
          const until = asOptionalString(args.until, 'until');
          const limit = asOptionalNumber(args.limit, 'limit');
          const sort = asOptionalEnum(args.sort, 'sort', ASC_DESC);
          const minAmount = asOptionalNumber(args.minAmount, 'minAmount');
          const offset = asOptionalNumber(args.offset, 'offset');
          const governmentContractsFilter:
            | GovernmentContractFilterOptions
            | undefined =
            since != null ||
            until != null ||
            limit != null ||
            sort != null ||
            minAmount != null ||
            offset != null
              ? { since, until, limit, sort, minAmount, offset }
              : undefined;
          return runTool(() =>
            fetchSubGraph(client, ticker, 'governmentContracts', {
              governmentContractsFilter,
            }),
          );
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_campaign_finance',
      bundle: 'regulatory' as const,
      description:
        'Fetch US FEC campaign-finance committees (PACs, candidate committees) matching a NAME — political-exposure checks, donor research, ESG-adjacent due diligence. Returns array of committees with `{ name, party, totalRaised, cycle, … }`. **US only.** For campaign finance attached to a specific corporate entity, fetch via `jintel_regulatory` instead.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Committee / candidate / organization name',
          },
          cycle: {
            type: 'number',
            description: 'Election cycle year (e.g., 2024). Optional.',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const name = asString(args.name, 'name');
          const cycle = asOptionalNumber(args.cycle, 'cycle');
          return runTool(() => client.campaignFinance(name, cycle));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
