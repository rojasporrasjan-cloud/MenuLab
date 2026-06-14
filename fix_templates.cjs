const fs = require('fs');
const path = require('path');
const templatesDir = path.join(__dirname, 'src/features/templates');
const dirs = fs.readdirSync(templatesDir);

for (const dir of dirs) {
  const p = path.join(templatesDir, dir, 'index.tsx');
  if (!fs.existsSync(p)) continue;
  
  let content = fs.readFileSync(p, 'utf8');
  let original = content;
  
  // Revert tc.imgRadius
  content = content.replace(/tc\.imgRadius/g, "'var(--img-radius, 8px)'");
  
  // Revert cardRadius
  content = content.replace(/tc\.cardRadius/g, "'var(--card-radius, 10px)'");
  
  // Revert tc.shadow (there were two variants)
  content = content.replace(/tc\.shadow !== "none" \? tc\.shadow : '.*?'/g, "'var(--card-shadow, 0 4px 12px rgba(0,0,0,0.1))'");
  content = content.replace(/tc\.shadow !== "none" \? tc\.shadow/g, "'var(--card-shadow, 0 4px 12px rgba(0,0,0,0.1))'");
  content = content.replace(/boxShadow:\s*tc\.shadow/g, "boxShadow: 'var(--card-shadow, 0 4px 12px rgba(0,0,0,0.1))'");
  
  // Inject the CSS variables into the root template div
  // The root div is `<div className="..." style={{...}}>` or `<div style={{...}}>` right after `return (`
  // We want to match: `return (\n    <div\s+([\s\S]*?)style={{([\s\S]*?)}}`
  content = content.replace(/return\s*\(\s*<div([\s\S]*?)style=\{\{([\s\S]*?)\}\}/, (match, attrs, styles) => {
    if (styles.includes('--img-radius')) return match;
    return `return (
    <div${attrs}style={{
      '--img-radius': tc.imgRadius,
      '--card-radius': tc.cardRadius,
      '--card-shadow': tc.shadow,
      ${styles}
    }}`;
  });

  if (content !== original) {
    fs.writeFileSync(p, content);
  }
}
console.log('Fixed TS errors using CSS vars');
