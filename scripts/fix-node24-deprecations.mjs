import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sharedPackageJsonPath = resolve(
  process.cwd(),
  'node_modules',
  '@vue',
  'shared',
  'package.json',
)

if (!existsSync(sharedPackageJsonPath)) {
  process.exit(0)
}

const sharedPackageJson = JSON.parse(readFileSync(sharedPackageJsonPath, 'utf8'))

if (sharedPackageJson.exports?.['./*'] === './*') {
  delete sharedPackageJson.exports['./*']
  writeFileSync(sharedPackageJsonPath, `${JSON.stringify(sharedPackageJson, null, 2)}\n`)
}
