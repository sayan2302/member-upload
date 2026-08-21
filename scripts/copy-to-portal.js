import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const portalRoot = path.resolve('c:/ALL/OFFICE/mayfairmemberportal/Site')

const distJs = path.join(projectRoot, 'dist', 'memberUpload.js')
const distCss = path.join(projectRoot, 'dist', 'css', 'memberUpload.css')

const targetJsDir = path.join(portalRoot, 'js', 'react-dist')
const targetCssDir = path.join(portalRoot, 'css', 'react-dist')

if (!fs.existsSync(portalRoot)) {
  console.warn(`[Copy Script] Target portal directory not found at: ${portalRoot}. Skipping copy.`)
  process.exit(0)
}

fs.mkdirSync(targetJsDir, { recursive: true })
fs.mkdirSync(targetCssDir, { recursive: true })

const targetJs = path.join(targetJsDir, 'memberUpload.js')
const targetCss = path.join(targetCssDir, 'member-upload.css')

if (fs.existsSync(distJs)) {
  fs.copyFileSync(distJs, targetJs)
  console.log(`[Copy Script] Copied ${distJs} -> ${targetJs}`)
} else {
  console.error(`[Copy Script] Source JS not found: ${distJs}`)
}

if (fs.existsSync(distCss)) {
  fs.copyFileSync(distCss, targetCss)
  console.log(`[Copy Script] Copied ${distCss} -> ${targetCss}`)
} else {
  // Check if css is in dist/assets or root
  const assetsDir = path.join(projectRoot, 'dist', 'assets')
  if (fs.existsSync(assetsDir)) {
    const cssFile = fs.readdirSync(assetsDir).find(f => f.endsWith('.css'))
    if (cssFile) {
      fs.copyFileSync(path.join(assetsDir, cssFile), targetCss)
      console.log(`[Copy Script] Copied ${path.join(assetsDir, cssFile)} -> ${targetCss}`)
    }
  }
}

console.log('[Copy Script] Build assets successfully deployed to .NET portal!')
