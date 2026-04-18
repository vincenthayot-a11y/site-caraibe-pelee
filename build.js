const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const CONTENT_DIR = path.join(__dirname, 'content/blog');
const OUTPUT_DIR = path.join(__dirname, 'blog');
const BLOG_INDEX = path.join(__dirname, 'blog.html');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Logo SVG
const LOGO_SVG = `<svg width="58" height="58" viewBox="0 0 100 100" style="flex-shrink:0;">
<circle cx="50" cy="50" r="48" fill="#1a3040" stroke="#f0a500" stroke-width="1.5"/>
<circle cx="50" cy="38" r="14" fill="#f0a500" opacity="0.9"/>
<circle cx="50" cy="38" r="10" fill="#f7c948"/>
<circle cx="50" cy="38" r="6" fill="#ffe066"/>
<path d="M25 68 L42 40 Q46 34 50 38 L55 44 Q57 42 59 44 L75 65" fill="#5d7a3a"/>
<path d="M30 68 L44 46 Q47 40 50 44 L60 58" fill="#3d5a25" opacity="0.7"/>
<path d="M15 70 Q30 62 45 70 Q60 78 75 70 Q85 64 95 70" fill="none" stroke="#48cae4" stroke-width="2.5" stroke-linecap="round"/>
<path d="M10 76 Q25 68 40 76 Q55 84 70 76 Q85 68 100 76" fill="none" stroke="#48cae4" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
<path d="M28 28 Q31 25 34 27" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
<path d="M66 30 Q69 27 72 29" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
</svg>`;

const NAV = `<nav>
  <a href="../index.html" style="display:flex;align-items:center;gap:14px;text-decoration:none;">
    ${LOGO_SVG}
    <span style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#fff;line-height:1.2;">Entre la Caraïbe<br><span style="color:#fcd34d;font-style:italic;font-size:1.1rem;">et la Pelée</span></span>
  </a>
  <ul class="nav-links">
    <li><a href="../index.html#logements">Nos logements</a></li>
    <li><a href="../blog.html">Explorer le Nord</a></li>
    <li><a href="../index.html#avis">Avis</a></li>
    <li><a href="../index.html#contact" class="nav-cta">Contact</a></li>
  </ul>
  <div class="nav-burger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
</nav>`;

const FOOTER = `<footer>
  <div class="footer-inner">
    <span class="footer-copy">© 2025 Entre la Caraïbe et la Pelée · <a href="../index.html">Accueil</a> · <a href="../blog.html">Explorer le Nord</a> · <a href="../index.html#contact">Contact</a></span>
    <span class="footer-copy">12 hébergements · Le Carbet · Morne-Rouge · Saint-Pierre · Martinique</span>
  </div>
</footer>`;

const CSS = `
:root {
  --deep: #1a3040; --ocean: #0097a7; --lagon: #48cae4;
  --forest: #5d7a3a; --gold: #f0a500; --gold-light: #fcd34d;
  --coral: #d4763a; --sand: #f5ede0; --white: #ffffff;
  --text-dark: #1a2530; --text-mid: #3a5565; --text-light: #7a95a5;
  --shadow: 0 8px 40px rgba(26,48,64,0.15); --radius: 18px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Nunito',sans-serif;background:var(--sand);color:var(--text-dark);overflow-x:hidden;line-height:1.6}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:10px 48px;background:rgba(26,48,64,0.97);backdrop-filter:blur(12px);box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{color:rgba(255,255,255,0.88);text-decoration:none;font-weight:600;font-size:0.9rem;transition:color 0.2s}
.nav-links a:hover{color:var(--gold-light)}
.nav-cta{background:var(--gold)!important;color:var(--deep)!important;padding:9px 22px;border-radius:50px;font-weight:700!important}
.nav-burger{display:none;flex-direction:column;gap:5px;cursor:pointer}
.nav-burger span{width:24px;height:2px;background:#fff;border-radius:2px}
footer{background:var(--deep);color:rgba(255,255,255,0.7);padding:40px 48px 24px}
.footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
.footer-inner a{color:var(--gold-light);text-decoration:none}
.footer-copy{font-size:0.8rem}
.article-hero{position:relative;min-height:420px;display:flex;align-items:flex-end;padding:120px 48px 60px;background-size:cover;background-position:center;color:#fff}
.article-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(26,48,64,0.75) 0%,rgba(26,48,64,0.88) 100%)}
.article-hero>*{position:relative;z-index:1}
.article-hero h1{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);line-height:1.2;margin-bottom:14px}
.article-hero .lede{color:rgba(255,255,255,0.9);font-size:1.1rem;max-width:700px;font-style:italic}
.meta-bar{background:white;box-shadow:var(--shadow);padding:18px 28px;border-radius:var(--radius);display:flex;flex-wrap:wrap;gap:20px;max-width:800px;margin:-36px auto 0;position:relative;z-index:5;font-size:0.88rem;color:var(--text-mid)}
.meta-bar strong{color:var(--text-dark)}
.article-content{max-width:800px;margin:48px auto;padding:0 48px}
.article-content h2{font-family:'Playfair Display',serif;font-size:1.6rem;color:var(--deep);margin:36px 0 16px;line-height:1.3}
.article-content h3{font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--deep);margin:28px 0 12px}
.article-content p{color:var(--text-mid);line-height:1.85;margin-bottom:18px;font-size:1rem}
.article-content ul,.article-content ol{margin:16px 0 18px 24px;color:var(--text-mid)}
.article-content li{margin-bottom:8px;line-height:1.7}
.article-content strong{color:var(--text-dark)}
.article-content img{width:100%;border-radius:12px;margin:24px 0}
.article-content blockquote{border-left:4px solid var(--gold);padding:16px 24px;margin:24px 0;background:rgba(240,165,0,0.06);border-radius:0 12px 12px 0;font-style:italic;color:var(--text-mid)}
.article-cta{max-width:800px;margin:0 auto 48px;padding:0 48px}
.article-cta-box{background:var(--deep);border-radius:var(--radius);padding:36px;text-align:center;color:#fff}
.article-cta-box h3{font-family:'Playfair Display',serif;font-size:1.3rem;margin-bottom:10px}
.article-cta-box p{color:rgba(255,255,255,0.7);margin-bottom:20px;font-size:0.95rem}
.article-cta-box a{display:inline-block;background:linear-gradient(135deg,var(--ocean),var(--gold));color:#fff;padding:12px 32px;border-radius:50px;font-weight:700;text-decoration:none;transition:transform 0.2s}
.article-cta-box a:hover{transform:translateY(-2px)}
@media(max-width:900px){nav{padding:14px 24px}.nav-links{display:none}.nav-burger{display:flex}.article-hero{padding:100px 24px 48px;min-height:340px}.article-content{padding:0 24px}.article-cta{padding:0 24px}footer{padding:30px 24px}}
`;

const MENU_JS = `<script>
function toggleMenu(){var l=document.querySelector('.nav-links');if(l.style.display==='flex'){l.style.display='none'}else{l.style.display='flex';l.style.flexDirection='column';l.style.position='fixed';l.style.top='80px';l.style.left='0';l.style.right='0';l.style.background='rgba(26,48,64,0.97)';l.style.padding='20px 24px';l.style.gap='16px';l.style.zIndex='99'}}
</script>`;

// ════ Read all markdown posts ════
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && f !== '.gitkeep');
const posts = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
  const { data, content } = matter(raw);
  const slug = path.basename(file, '.md');
  const htmlContent = marked(content);
  
  posts.push({ ...data, slug, htmlContent, content });
}

// Sort by date desc
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

console.log(`📝 ${posts.length} articles trouvés`);

// ════ Generate individual article pages ════
for (const post of posts) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${post.title} — Explorer le Nord · Entre la Caraïbe et la Pelée</title>
<meta name="description" content="${(post.summary || '').replace(/"/g, '&quot;')}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<style>${CSS}</style>
</head>
<body>
${NAV}
<div class="article-hero" style="background-image:url('${post.image || ''}');">
  <div style="max-width:800px;">
    <div style="display:inline-block;background:rgba(0,151,167,0.25);border:1px solid rgba(0,151,167,0.5);color:var(--lagon);font-size:0.78rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 18px;border-radius:50px;margin-bottom:18px;">${post.category || ''}</div>
    <h1>${post.title}</h1>
    <p class="lede">${post.summary || ''}</p>
  </div>
</div>
<div class="meta-bar">
  <span>📅 <strong>${post.date || ''}</strong></span>
  <span>🏷 <strong>${post.category || ''}</strong></span>
  <span>⏱ <strong>${post.reading_time || 5} min</strong> de lecture</span>
</div>
<div class="article-content">
${post.htmlContent}
</div>
<div class="article-cta">
  <div class="article-cta-box">
    <h3>Envie de découvrir le Nord ?</h3>
    <p>Nos bungalows sont le point de départ idéal pour explorer la Martinique authentique.</p>
    <a href="../index.html#logements">Voir nos logements →</a>
  </div>
</div>
${FOOTER}
${MENU_JS}
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, `${post.slug}.html`), html);
  console.log(`  ✅ blog/${post.slug}.html`);
}

// ════ Generate blog index page ════
const NAV_INDEX = NAV.replace(/\.\.\//g, '');

const FOOTER_INDEX = FOOTER.replace(/\.\.\//g, '');

const categoryColors = {
  'Randonnée': { bg: '#e0f0e4', color: '#2d6e3f' },
  'Plage': { bg: '#ddf0fa', color: '#0077a8' },
  'Culture & Patrimoine': { bg: '#f0e6d6', color: '#8b5e3c' },
  'Rhum & Gastronomie': { bg: '#fce8d8', color: '#b85c2a' },
  'Activités nautiques': { bg: '#d8f0f5', color: '#0097a7' },
  'Villages & Nature': { bg: '#e5f0da', color: '#4a7a3a' },
};

const postCards = posts.map(p => {
  const cc = categoryColors[p.category] || { bg: '#e8f0f5', color: '#3a5565' };
  return `<a href="blog/${p.slug}.html" class="blog-card">
  <img src="${p.image || ''}" alt="${p.title}" loading="lazy"/>
  <div class="blog-card-body">
    <span class="blog-cat" style="background:${cc.bg};color:${cc.color};">${p.category || ''}</span>
    <h3>${p.title}</h3>
    <p>${p.summary || ''}</p>
    <span class="blog-meta">⏱ ${p.reading_time || 5} min · ${p.date || ''}</span>
  </div>
</a>`;
}).join('\n');

const blogIndexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Explorer le Nord – Activités & Découvertes en Martinique · Entre la Caraïbe et la Pelée</title>
<meta name="description" content="Activités incontournables dans le nord de la Martinique : randonnées, plages, rhumeries, plongée, villages authentiques et patrimoine volcanique."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<style>
${CSS}
.blog-hero{text-align:center;padding:120px 48px 60px;background:var(--deep);color:#fff}
.blog-hero h1{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);margin-bottom:14px}
.blog-hero h1 em{color:var(--gold-light);font-style:italic}
.blog-hero p{color:rgba(255,255,255,0.7);max-width:600px;margin:0 auto;font-size:1.05rem}
.blog-grid{max-width:1100px;margin:48px auto;padding:0 48px;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:28px}
.blog-card{background:var(--white);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);text-decoration:none;color:inherit;transition:transform 0.3s}
.blog-card:hover{transform:translateY(-5px)}
.blog-card img{width:100%;height:200px;object-fit:cover}
.blog-card-body{padding:20px 22px}
.blog-cat{display:inline-block;font-size:0.72rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:50px;margin-bottom:10px}
.blog-card-body h3{font-family:'Playfair Display',serif;font-size:1.15rem;color:var(--deep);margin-bottom:8px;line-height:1.35}
.blog-card-body p{font-size:0.88rem;color:var(--text-mid);line-height:1.6;margin-bottom:12px}
.blog-meta{font-size:0.78rem;color:var(--text-light)}
@media(max-width:900px){.blog-grid{padding:0 24px;grid-template-columns:1fr}.blog-hero{padding:100px 24px 48px}}
</style>
</head>
<body>
${NAV_INDEX}
<div class="blog-hero">
  <span style="display:inline-block;font-size:0.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold-light);background:rgba(240,165,0,0.15);padding:5px 14px;border-radius:50px;margin-bottom:14px;">Explorer le Nord</span>
  <h1>La Martinique du Nord <em>à vivre</em></h1>
  <p>Randonnées, plages secrètes, distilleries, patrimoine volcanique — nos incontournables pour découvrir le nord depuis nos bungalows.</p>
</div>
<div class="blog-grid">
${postCards}
</div>
${FOOTER_INDEX}
<script>
function toggleMenu(){var l=document.querySelector('.nav-links');if(l.style.display==='flex'){l.style.display='none'}else{l.style.display='flex';l.style.flexDirection='column';l.style.position='fixed';l.style.top='80px';l.style.left='0';l.style.right='0';l.style.background='rgba(26,48,64,0.97)';l.style.padding='20px 24px';l.style.gap='16px';l.style.zIndex='99'}}
</script>
</body>
</html>`;

fs.writeFileSync(BLOG_INDEX, blogIndexHtml);
console.log(`  ✅ blog.html (index avec ${posts.length} articles)`);

console.log(`\n🎉 Build terminé : ${posts.length} articles + index`);
