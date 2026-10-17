const router = require('express').Router();
const auth = require('../middleware/auth');
const Site = require('../models/Site'); 
const { v4: uuidv4 } = require('uuid');
const Page = require('../models/Page');

const { publishSite } = require('../services/publishService');
// ── Publish a site ───────────────────────────────────────────────
// This endpoint triggers the publishing process for a site. 
// It verifies that the site belongs to the authenticated user,
//  then calls the publishSite function to generate and deploy the site's HTML. 
// Finally, it updates the published_at timestamp in the database and returns the URL 
// of the published site.
router.post('/:id/publish', auth, async (req, res, next) => {
  try {
    // Verify ownership
    const site = await Site.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const url = await publishSite(site);

    // Save published timestamp
    await site.update({ published_at: new Date() });

    res.json({ ok: true, url });

  } catch (err) { next(err); }
});





// ── Get all sites for the authenticated user ───────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const sites = await Site.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Page, order: [['order', 'ASC']] }], 
      order: [['createdAt', 'DESC']]
    });
    res.json(sites);
  } catch (err) { next(err); }
});


// ── Create a new site ─────────────────────────────────────────────
router.post('/', auth, async (req, res, next) => {
  try {
    const { name } = req.body;

    
    if (!name) return res.status(400).json({ error: 'Site name required' });

   
    const existing = await Site.findOne({
      where: { user_id: req.user.id, name }
    });
    if (existing) return res.status(400).json({ error: 'You already have a site with this name' });

   
    const subdomain = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')  // special chars → dash
      .replace(/-+/g, '-')          // collapse dashes
      .replace(/^-|-$/g, '')        // remove leading/trailing dash
      + '-' + uuidv4().slice(0, 6); // e.g. "my-site-a1b2c3"

    
    const site = await Site.create({
      id:       uuidv4(),
      user_id:  req.user.id,
      name,
      subdomain
    });

    
    const page = await Page.create({
      id:      uuidv4(),
      site_id: site.id,
      slug:    'home',
      title:   'Home',
      order:   0
    });

  
    res.status(201).json({
      ...site.toJSON(),
      Pages: [page.toJSON()]
    });

  } catch (err) { next(err); }
});






// ── Get a single site by ID ───────────────────────────────────────
router.get('/:id', auth, async (req, res, next) => {
  try {
    const site = await Site.findOne({ where: { id: req.params.id, user_id: req.user.id },include: [{ model: Page }] });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (err) { next(err); }
});




// ── Update a site by ID ──────────────────────────────────────────
router.put('/:id', auth, async (req, res, next) => {
  try {
    const site = await Site.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const { name } = req.body; 
    await site.update({ name });
    res.json(site);
  } catch (err) { next(err); }
});


// ── Delete a site by ID ──────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const site = await Site.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    await site.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
});   

module.exports = router;