import { handlePick } from '../src/pick/handler.js'

/** POST /api/pick — see src/pick/handler.ts. Vercel answers other methods with 405 itself.
 *  The .js extension is deliberate: Vercel keeps the import as written and Node ESM needs it. */
export function POST(request: Request): Promise<Response> {
  return handlePick(request, process.env, fetch)
}
