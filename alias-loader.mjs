import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'

// Minimal ESM resolver mapping the @/ alias to ./src for Node test runs.
const SRC = resolvePath(process.cwd(), 'src')

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2)
    const candidate = resolvePath(SRC, rel)
    if (existsSync(candidate) || existsSync(candidate + '.js') || existsSync(candidate + '.mjs')) {
      return nextResolve(pathToFileURL(candidate + (existsSync(candidate) ? '' : '.js')).href, context)
    }
  }
  return nextResolve(specifier, context)
}
