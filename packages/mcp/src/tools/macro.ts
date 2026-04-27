import type { JintelClient } from '@yojinhq/jintel-client';
import type { GdpType } from '@yojinhq/jintel-client';
import type { ToolDefinition } from './types.js';
import {
  LIMIT_SCHEMA,
  SINCE_SCHEMA,
  SORT_SCHEMA,
  UNTIL_SCHEMA,
  asOptionalEnum,
  asOptionalString,
  asOptionalStringArray,
  asString,
  buildArrayFilter,
  errorMessage,
  fail,
  runTool,
} from './shared.js';

const GDP_TYPES: readonly GdpType[] = ['REAL', 'NOMINAL', 'FORECAST'];

export function buildMacroTools(client: JintelClient): ToolDefinition[] {
  return [
    {
      name: 'jintel_gdp',
      bundle: 'macro' as const,
      description:
        "GDP time series for a country. `type`: REAL (inflation-adjusted, default), NOMINAL (current dollars), or FORECAST (forward estimates). Returns array of `{ date, country, value }`. Use ISO codes ('US') or country names ('United States'). For other macro indicators (unemployment, money supply, yields) use `jintel_macro_series` with FRED-style IDs.",
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description:
              "Country name or ISO code (e.g., 'US', 'United States').",
          },
          type: {
            type: 'string',
            enum: GDP_TYPES,
            description:
              'GDP series type: REAL (inflation-adjusted), NOMINAL (current $), FORECAST (forward).',
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['country'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const country = asString(args.country, 'country');
          const type = asOptionalEnum(args.type, 'type', GDP_TYPES);
          const filter = buildArrayFilter(args);
          return runTool(() => client.gdp(country, type, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_inflation',
      bundle: 'macro' as const,
      description:
        "CPI / inflation time series for a country. Returns array of `{ date, country, value }`. For headline US CPI specifically, `jintel_macro_series` with `seriesId='CPIAUCSL'` is equivalent and lets you batch across multiple inflation series.",
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: "Country name or ISO code (e.g., 'US').",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['country'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const country = asString(args.country, 'country');
          const filter = buildArrayFilter(args);
          return runTool(() => client.inflation(country, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_interest_rates',
      bundle: 'macro' as const,
      description:
        'Policy interest rates time series for a country — Fed Funds (US), ECB rate (EU), BoE rate (UK), etc. Returns array of `{ date, country, value }`. For a specific FRED series like `DGS10` (10-year Treasury) or `T10Y2Y` (yield curve) use `jintel_macro_series` instead.',
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: "Country name or ISO code (e.g., 'US').",
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        required: ['country'],
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const country = asString(args.country, 'country');
          const filter = buildArrayFilter(args);
          return runTool(() => client.interestRates(country, filter));
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },

    {
      name: 'jintel_macro_series',
      bundle: 'macro' as const,
      description:
        "Generic FRED-style US macro time series by series ID — UNRATE (unemployment), CPIAUCSL (headline CPI), GDPC1 (real GDP), DGS10 (10y Treasury), T10Y2Y (yield curve), M2SL (money supply), and many more. Use `seriesId` for one series, `seriesIds` (array) to batch up to ~20. Returns series metadata + observations. Filter observations with `since` / `until` / `limit`. Provide either `seriesId` (single) or `seriesIds` (multiple) — at least one is required.",
      inputSchema: {
        type: 'object',
        properties: {
          seriesId: {
            type: 'string',
            description: "Single macro series ID (e.g., 'UNRATE', 'CPIAUCSL').",
          },
          seriesIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Batch — multiple series IDs in one call.',
          },
          since: SINCE_SCHEMA,
          until: UNTIL_SCHEMA,
          limit: LIMIT_SCHEMA,
          sort: SORT_SCHEMA,
        },
        additionalProperties: false,
      },
      handler: async (args) => {
        try {
          const seriesId = asOptionalString(args.seriesId, 'seriesId');
          const seriesIds = asOptionalStringArray(args.seriesIds, 'seriesIds');
          if (seriesId == null && seriesIds == null) {
            return fail("Argument 'seriesId' or 'seriesIds' must be provided");
          }
          if (seriesId != null && seriesIds != null) {
            return fail("Pass either 'seriesId' or 'seriesIds', not both");
          }
          const filter = buildArrayFilter(args);
          if (seriesIds != null) {
            return runTool(() => client.macroSeriesBatch(seriesIds, filter));
          }
          if (seriesId !== undefined) {
            return runTool(() => client.macroSeries(seriesId, filter));
          }
          return fail("Argument 'seriesId' or 'seriesIds' must be provided");
        } catch (err) {
          return fail(errorMessage(err));
        }
      },
    },
  ];
}
