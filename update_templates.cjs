const fs = require('fs');
const path = require('path');
const templatesDir = 'src/features/templates';
const files = fs.readdirSync(templatesDir);

files.forEach(dir => {
  if (dir === 'sections') return;
  const filePath = path.join(templatesDir, dir, 'index.tsx');
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add ScheduleBanner to import from '../sections'
  if (!content.includes('ScheduleBanner') && content.includes('../sections')) {
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+'\.\.\/sections'/, (match, p1) => {
      return `import { ${p1.trim()}, ScheduleBanner } from '../sections'`;
    });
    changed = true;
  }

  // Inject <ScheduleBanner /> below <AnnouncementBar />
  if (!content.includes('<ScheduleBanner branding={tenant.branding} tc={tc} />') && content.includes('<AnnouncementBar branding={tenant.branding} tc={tc} />')) {
    content = content.replace(
      /<AnnouncementBar branding=\{tenant\.branding\} tc=\{tc\} \/>/,
      '<AnnouncementBar branding={tenant.branding} tc={tc} />\n      <ScheduleBanner branding={tenant.branding} tc={tc} />'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${dir}`);
  }
});
