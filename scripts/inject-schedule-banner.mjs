import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATES_DIR = path.join(__dirname, '../src/features/templates')

function injectScheduleBanner() {
  const folders = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'sections')
    .map(dirent => dirent.name)

  let modifiedCount = 0

  for (const folder of folders) {
    const indexPath = path.join(TEMPLATES_DIR, folder, 'index.tsx')
    if (!fs.existsSync(indexPath)) continue

    let content = fs.readFileSync(indexPath, 'utf-8')
    let modified = false

    // 1. Ensure ScheduleBanner is imported from '../sections'
    const sectionsImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/sections['"]/
    const match = content.match(sectionsImportRegex)
    
    if (match) {
      const importsStr = match[1]
      if (!importsStr.includes('ScheduleBanner')) {
        const newImportsStr = importsStr.trim() + ', ScheduleBanner'
        content = content.replace(sectionsImportRegex, `import { ${newImportsStr} } from '../sections'`)
        modified = true
      }
    }

    // 2. Inject <ScheduleBanner branding={tenant.branding} tc={tc} />
    // It should go right after <AnnouncementBar branding={tenant.branding} tc={tc} />
    const announcementBarRegex = /<AnnouncementBar[^>]*\/>/
    if (announcementBarRegex.test(content) && !content.includes('<ScheduleBanner')) {
      content = content.replace(announcementBarRegex, (match) => {
        return `${match}\n      <ScheduleBanner branding={tenant.branding} tc={tc} />`
      })
      modified = true
    }

    if (modified) {
      fs.writeFileSync(indexPath, content, 'utf-8')
      console.log(`Updated ${folder}/index.tsx`)
      modifiedCount++
    }
  }

  console.log(`Finished. Modified ${modifiedCount} files.`)
}

injectScheduleBanner()
