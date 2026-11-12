import type { IncomingMessage, ServerResponse } from 'http';

const LTA_CARPARK_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaRawCarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng", e.g. "1.2935 103.8572"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // C = Car, H = Heavy Vehicle, Y = Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA' | string;
}

export interface LtaApiResponse {
  'odata.metadata'?: string;
  value: LtaRawCarparkItem[];
}

/**
 * Retrieves the LTA AccountKey from environment variables or request headers.
 * Does not hardcode any key.
 */
function getLtaAccountKey(req?: IncomingMessage | Request): string | null {
  const envKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_API_KEY ||
    process.env.DATAMALL_KEY;

  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  // Fallback: check custom request headers (useful for client testing before server env is populated)
  if (req) {
    if ('headers' in req) {
      if (typeof (req.headers as any)?.get === 'function') {
        // Web Standard Request
        const headerVal =
          (req.headers as Headers).get('accountkey') ||
          (req.headers as Headers).get('x-account-key') ||
          (req.headers as Headers).get('lta-account-key');
        if (headerVal) return headerVal.trim();
      } else {
        // Node.js IncomingMessage
        const nodeHeaders = (req as IncomingMessage).headers;
        const headerVal =
          (nodeHeaders['accountkey'] as string) ||
          (nodeHeaders['x-account-key'] as string) ||
          (nodeHeaders['lta-account-key'] as string);
        if (headerVal) return headerVal.trim();
      }
    }
  }

  return null;
}

/**
 * Extracts URL search params whether in Node or Web standard request
 */
function getSearchParams(req?: IncomingMessage | Request): URLSearchParams {
  if (!req) return new URLSearchParams();
  if ('url' in req && typeof req.url === 'string') {
    const fullUrl = req.url.startsWith('http') ? req.url : `http://localhost${req.url}`;
    try {
      return new URL(fullUrl).searchParams;
    } catch {
      return new URLSearchParams();
    }
  }
  return new URLSearchParams();
}

/**
 * Fetches a single batch from LTA DataMall with the given skip offset
 */
async function fetchLtaBatch(accountKey: string, skip: number = 0): Promise<LtaRawCarparkItem[]> {
  const url = skip > 0 ? `${LTA_CARPARK_ENDPOINT}?$skip=${skip}` : LTA_CARPARK_ENDPOINT;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      AccountKey: accountKey,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LTA API returned HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const json = (await response.json()) as LtaApiResponse;
  return json.value || [];
}

/**
 * Helper to respond in Node.js serverless environment
 */
function sendNodeResponse(res: ServerResponse, status: number, body: object) {
  if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
    (res as any).status(status).json(body);
    return;
  }
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, AccountKey, x-account-key, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(JSON.stringify(body));
}

/**
 * Universal Serverless Handler for Singapore Carpark Availability
 */
export async function handleCarparkAvailability(
  req?: IncomingMessage | Request,
  res?: ServerResponse
) {
  // Handle CORS preflight OPTIONS
  const isOptions =
    (req && 'method' in req && req.method === 'OPTIONS') ||
    (req && typeof (req as any).method === 'string' && (req as any).method === 'OPTIONS');

  if (isOptions) {
    if (res) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, AccountKey, x-account-key, Authorization',
      });
      res.end();
      return;
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, AccountKey, x-account-key, Authorization',
      },
    });
  }

  const accountKey = getLtaAccountKey(req);

  // Return informative configuration message if key is missing
  if (!accountKey) {
    const notConfiguredPayload = {
      status: 'unconfigured',
      message:
        'LTA AccountKey is not yet configured. Please set the LTA_ACCOUNT_KEY environment variable.',
      configured: false,
      endpoint: LTA_CARPARK_ENDPOINT,
      instructions: [
        '1. Obtain a free LTA DataMall API key from https://datamall.lta.gov.sg',
        '2. Set LTA_ACCOUNT_KEY="your-account-key" in your .env or server environment',
        '3. Query /api/carparkavailablity to stream live Singapore carpark lots',
      ],
      timestamp: new Date().toISOString(),
    };

    if (res) {
      sendNodeResponse(res, 200, notConfiguredPayload);
      return;
    }

    return new Response(JSON.stringify(notConfiguredPayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // AccountKey is available: fetch live data from LTA DataMall
  try {
    const params = getSearchParams(req);
    const skipParam = params.get('skip') || params.get('$skip');
    const singleBatch = params.get('single') === 'true';

    let allLots: LtaRawCarparkItem[] = [];

    if (skipParam !== null) {
      // User requested specific pagination offset
      const skipNum = parseInt(skipParam, 10) || 0;
      allLots = await fetchLtaBatch(accountKey, skipNum);
    } else if (singleBatch) {
      // Only first 500
      allLots = await fetchLtaBatch(accountKey, 0);
    } else {
      // Fetch all pages (LTA v2 batches in chunks of 500 records)
      let currentSkip = 0;
      let hasMore = true;
      const MAX_PAGES = 10; // Safety guard: up to 5,000 carparks
      let page = 0;

      while (hasMore && page < MAX_PAGES) {
        const batch = await fetchLtaBatch(accountKey, currentSkip);
        if (batch.length === 0) {
          hasMore = false;
        } else {
          allLots = allLots.concat(batch);
          if (batch.length < 500) {
            hasMore = false;
          } else {
            currentSkip += 500;
            page += 1;
          }
        }
      }
    }

    const payload = {
      status: 'success',
      total: allLots.length,
      timestamp: new Date().toISOString(),
      source: 'LTA DataMall CarParkAvailabilityv2',
      value: allLots,
    };

    if (res) {
      sendNodeResponse(res, 200, payload);
      return;
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30, s-maxage=30', // cache for 30s as LTA updates ~1min
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error querying LTA DataMall';
    const errorPayload = {
      status: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };

    if (res) {
      sendNodeResponse(res, 502, errorPayload);
      return;
    }

    return new Response(JSON.stringify(errorPayload), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Default export for Vercel / Node serverless function
export default handleCarparkAvailability;

// Web Standard GET export
export async function GET(request: Request) {
  return handleCarparkAvailability(request);
}

// Web Standard OPTIONS export for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, AccountKey, x-account-key, Authorization',
    },
  });
}
