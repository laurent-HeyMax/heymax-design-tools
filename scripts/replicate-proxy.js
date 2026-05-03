/**
 * Cloudflare Worker — Replicate CORS proxy for Heymax Design Tools.
 *
 * Why: Neither api.replicate.com (the API) nor replicate.delivery (the image
 * CDN) returns CORS headers, so a browser-based plugin (like a Figma plugin
 * iframe) cannot call them directly. This worker forwards requests to both
 * hosts, adds CORS headers, and returns the response back to the plugin.
 *
 * Routing:
 *   /v1/…           → https://api.replicate.com/v1/…   (predictions, polls)
 *   /delivery/…     → https://replicate.delivery/…     (output image bytes)
 *
 * Deploy (free, ~3 minutes):
 *   1. https://dash.cloudflare.com → Workers & Pages → Create → Hello World
 *   2. Replace the default code with this file's contents and click Deploy
 *   3. Copy the public URL (e.g. https://my-worker.YOUR-USERNAME.workers.dev)
 *   4. In the plugin: Settings → Replicate CORS proxy → paste the URL
 *
 * Security: the user's Replicate API key is forwarded as-is in the
 * Authorization header. This worker is YOURS and only your plugin uses it,
 * but treat the URL like a secret — anyone who has it can use it as a proxy
 * to Replicate (using their own API key in the Authorization header).
 */

const API_HOST = 'https://api.replicate.com';
const DELIVERY_HOST = 'https://replicate.delivery';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const incoming = new URL(request.url);
    let target;
    if (incoming.pathname.startsWith('/delivery/')) {
      target = DELIVERY_HOST + incoming.pathname.slice('/delivery'.length) + incoming.search;
    } else {
      target = API_HOST + incoming.pathname + incoming.search;
    }

    // Strip headers that would confuse upstream or leak the worker host.
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'follow',
      // Required when forwarding a streamable body in Workers.
      // @ts-ignore - non-standard but recognised by Cloudflare runtime
      duplex: 'half',
    });

    const respHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders())) respHeaders.set(k, v);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  },
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, prefer, accept',
    'access-control-expose-headers': 'content-type, content-length, content-disposition',
    'access-control-max-age': '86400',
  };
}
