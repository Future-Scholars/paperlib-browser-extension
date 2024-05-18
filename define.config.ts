import fs from 'fs'
import { spawnSync } from 'child_process'
import packageJson from './package.json'

// Get the current git commit hash.
const gitCommit = spawnSync('git', ['rev-parse', '--short', 'HEAD'])
  .stdout.toString()
  .trim()

const jsn = (value: string) => JSON.stringify(value)

// Don't forget to add your added variables to vite-env.d.ts also!

// These variables are available in your Vue components and will be replaced by their values at build time.
// These will be compiled into your app. Don't store secrets here!

export const defineViteConfig = {
  __VERSION__: jsn(packageJson.version),
  __DISPLAY_NAME__: jsn(packageJson.displayName),
  __GIT_COMMIT__: jsn(gitCommit),
  __GITHUB_URL__: jsn(packageJson.repository.url),
}
