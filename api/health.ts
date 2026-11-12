import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Health check endpoint for serverless deployment.
 * Supports both standard Node.js/Express serverless handlers (req, res)
 * and Web Standard Request/Response handlers.
 */
export async function handleHealth(req?: IncomingMessage | Request, res?: ServerResponse) {
  const ltaKeyConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_API_KEY ||
    process.env.DATAMALL_KEY
  );

  const payload = {
    status: 'ok',
    service: 'ParkSG LTA Carpark Availability API',
    timestamp: new Date().toISOString(),
    ltaKeyConfigured,
    endpoints: {
      health: '/api/health',
      carparkAvailability: '/api/carparkavailablity',
    },
    version: '1.0.0',
  };

  // Node.js / Express serverless environment
  if (res && typeof (res as any).status === 'function') {
    return (res as any).status(200).json(payload);
  } else if (res && typeof res.writeHead === 'function') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(payload));
    return;
  }

  // Web Standard Response (Vercel Edge / Cloudflare Workers / Fetch standard)
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}

// Default export for Vercel / Node serverless function
export default handleHealth;

// Web Standard GET export
export async function GET(request: Request) {
  return handleHealth(request);
}
