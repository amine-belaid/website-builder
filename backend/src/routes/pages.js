const router     = require('express').Router();
const auth       = require('../middleware/auth');
const { Page, Section, Site } = require('../models');  
const { v4: uuidv4 } = require('uuid');

// ── Get all pages for a site ──────────────────────────────────────
router.get('/sites/:siteId/pages', auth, async (req, res, next) => {
  try {
    // Make sure the site belongs to the current user
    const site = await Site.findOne({
      where: { id: req.params.siteId, user_id: req.user.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const pages = await Page.findAll({
      where: { site_id: req.params.siteId },
      order: [['order', 'ASC']]
    });

    res.json(pages);
  } catch (err) { next(err); }
}); 

// ── Create a new page for a site ──────────────────────────────────
router.post('/sites/:siteId/pages', auth, async (req, res, next) => {
  try {
    const site = await Site.findOne({
      where: { id: req.params.siteId, user_id: req.user.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    
    const { title, slug } = req.body;
    if (!title) return res.status(400).json({ error: 'Page title required' });

    // Count existing pages to set order
    const count = await Page.count({ where: { site_id: req.params.siteId } });

    const page = await Page.create({
      id:      uuidv4(),
      site_id: req.params.siteId,
      title,
      slug:    slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      order:   count   // appended at the end
    });

    res.status(201).json(page);
  } catch (err) { next(err); }
});

// ── Get all sections for a page (load editor state) ───────────────
router.get('/pages/:pageId/sections', auth, async (req, res, next) => {
  try {
    // Verify page belongs to current user via site ownership
    const page = await Page.findOne({
      where: { id: req.params.pageId },
      include: [{ model: Site, where: { user_id: req.user.id } }]
    });
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const sections = await Section.findAll({
      where: { page_id: req.params.pageId },
      order: [['order', 'ASC']]
    });

    res.json(sections);
  } catch (err) { next(err); }
});

// ── Save all sections for a page (save editor state) ──────────────
router.put('/pages/:pageId/sections', auth, async (req, res, next) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'sections must be an array' });
    }

    // Verify ownership — page must belong to current user's site
    const page = await Page.findOne({
      where: { id: req.params.pageId },
      include: [{ model: Site, where: { user_id: req.user.id } }]
    });
    if (!page) return res.status(403).json({ error: 'Forbidden' });

    // Delete old sections and re-insert in one go
    await Section.destroy({ where: { page_id: req.params.pageId } });

    if (sections.length > 0) {
      await Section.bulkCreate(
        sections.map((s, i) => ({
          id:      s.id || uuidv4(),
          page_id: req.params.pageId,
          type:    s.type,
          props:   s.props || {},
          order:   i
        }))
      );
    }

    res.json({ ok: true, saved: sections.length });
  } catch (err) { next(err); }
});

// ── Delete a page ─────────────────────────────────────────────────
router.delete('/pages/:pageId', auth, async (req, res, next) => {
  try {
    const page = await Page.findOne({
      where: { id: req.params.pageId },
      include: [{ model: Site, where: { user_id: req.user.id } }]
    });
    if (!page) return res.status(403).json({ error: 'Forbidden' });

    await page.destroy();  // CASCADE deletes sections automatically
    res.json({ ok: true });
  } catch (err) { next(err); }
});


router.get('/pages/:pageId', auth, async (req, res, next) => {
  try {
    const page = await Page.findOne({
      where: { id: req.params.pageId },
      include: [{ model: Site, where: { user_id: req.user.id } }]
    });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (err) { next(err); }
});

module.exports = router;