//Son rôle est de prendre les données brutes stockées en base de données 
// et de les transformer dynamiquement en un code HTML
const { Page, Section } = require('../models');


/* ── HTML renderers ───────────────────────────────────────── */
const renderers = {
  navbar: (p) => `
    <nav style="display:flex;justify-content:space-between;align-items:center;
      padding:14px 40px;border-bottom:1px solid #eee;
      font-family:system-ui,sans-serif;background:#fff">
      <strong style="font-size:18px">${p.logo || 'My Site'}</strong>
      <div>${(p.links || []).map(l =>
        `<a href="#" style="margin-left:20px;text-decoration:none;color:#555;font-size:14px">${l}</a>`
      ).join('')}</div>
    </nav>`,

  hero: (p) => `
    <section style="background:${p.bg || '#fff'};padding:100px 40px;
      text-align:center;font-family:system-ui,sans-serif">
      <h1 style="font-size:48px;font-weight:700;margin-bottom:16px">${p.title || ''}</h1>
      <p style="font-size:20px;color:#666;margin-bottom:28px">${p.subtitle || ''}</p>
      ${p.btnText
        ? `<a href="#" style="display:inline-block;padding:14px 32px;background:#b5285a;
            color:#fff;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600">
            ${p.btnText}</a>`
        : ''}
    </section>`,

  text: (p) => `
    <section style="max-width:720px;margin:0 auto;padding:72px 40px;
      font-family:system-ui,sans-serif">
      <p style="font-size:18px;line-height:1.8;color:#444">${p.content || ''}</p>
    </section>`,

  image: (p) => p.url
    ? `<section style="padding:48px 40px;background:#f8f8f8;text-align:center">
        <img src="${p.url}" alt="${p.alt || ''}"
          style="max-width:100%;border-radius:12px">
       </section>`
    : '',

  features: (p) => `
    <section style="padding:80px 40px;font-family:system-ui,sans-serif">
      <h2 style="text-align:center;font-size:32px;font-weight:700;margin-bottom:48px">
        ${p.title || 'Features'}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
        gap:24px;max-width:900px;margin:0 auto">
        ${(p.items || []).map(item =>
          `<div style="background:#f8f8f8;border:1px solid #eee;border-radius:12px;padding:24px">
            <strong>${item}</strong>
           </div>`
        ).join('')}
      </div>
    </section>`,

  footer: (p) => `
    <footer style="text-align:center;padding:28px 40px;
      border-top:1px solid #eee;font-family:system-ui,sans-serif;
      font-size:13px;color:#aaa">
      ${p.text || '© 2025'}
    </footer>`,
};

/* ── build full HTML from DB ──────────────────────────────── */
const buildHTML = async (siteId, siteName) => {
  const pages = await Page.findAll({
    where: { site_id: siteId },
    include: [{ model: Section, order: [['order', 'ASC']] }],
    order: [['order', 'ASC']],
  });

  const body = pages
    .flatMap(pg => pg.Sections.map(s => renderers[s.type]?.(s.props) ?? ''))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, sans-serif; }
  </style>
</head>
<body>${body}</body>
</html>`;
};
//vercel is a cloud platform designed for frontend developers that enables you to host and deploy modern websites and web applications
/* ── deploy to Vercel ─────────────────────────────────────── */
const deployToVercel = async (html, subdomain) => {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN is missing from .env');

  const projectName = `builder-${subdomain}`
    .slice(0, 52)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  // Step 1 — create deployment
  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:  projectName,
      files: [{
        file:     'index.html',
        data:     html,
        encoding: 'utf-8',
      }],
      projectSettings: { framework: null },
      target: 'production',
    }),
  });

  const deployData = await deployRes.json();
  if (!deployRes.ok) {
    throw new Error(deployData?.error?.message || `Vercel error ${deployRes.status}`);
  }

  const deploymentId = deployData.id;
  console.log('Deployment ID:', deploymentId);
  console.log('Preview URL:', deployData.url);

  // Step 2 — poll until deployment is READY and alias is assigned
  let productionUrl = null;
  let attempts = 0;
  const maxAttempts = 20;  // wait max 40 seconds

  while (!productionUrl && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000));  // wait 2 seconds
    attempts++;

    const statusRes = await fetch(
      `https://api.vercel.com/v13/deployments/${deploymentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statusData = await statusRes.json();

    console.log(`Attempt ${attempts}: state=${statusData.readyState}, aliases=${statusData.alias?.length}`);

    if (statusData.readyState === 'READY' && statusData.alias?.length > 0) {
      // find the .vercel.app alias (not custom domain)
      const vercelAlias = statusData.alias.find(a => a.includes('.vercel.app'));
      productionUrl = `https://${vercelAlias || statusData.alias[0]}`;
    }
  }

  // fallback to preview URL if polling timed out
  if (!productionUrl) {
    console.log('Alias not ready yet — using preview URL');
    productionUrl = `https://${deployData.url}`;
  }

  console.log('Final production URL:', productionUrl);
  return productionUrl;
};

/* ── exported function ────────────────────────────────────── */
exports.publishSite = async (site) => {
  const html = await buildHTML(site.id, site.name);
  const url  = await deployToVercel(html, site.subdomain, site.name);
  return url;
};

//CDN : Content Delivery Network -> est un reseau mondiale de serveurs interconnectés conçus pour distribuer du contenu web .
//AWS cloudFront : service that delivers content through a global network of data centers, caching content closer to users for improved performance and reduced latency.
//                 (fourni par amazon web services)