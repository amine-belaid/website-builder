const { v4: uuidv4 } = require('uuid');
const Site = require('../models/Site');
const Page = require('../models/Page');
//It allows an authenticated user to list their sites and create a new one.
exports.list = async (req, res, next) => {
  try {
    const sites = await Site.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(sites);
  } catch (err) { next(err); }
};
//create site
//name : name of site 
exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Site name required' });

    const subdomain = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') + '-' + uuidv4().slice(0,6);

    const site = await Site.create({
      user_id: req.user.id, name, subdomain
    });

    // Auto-create a default home page
    await Page.create({
      site_id: site.id, slug: 'home', title: 'Home', order: 0
    });

    res.status(201).json(site);
  } catch (err) { next(err); }
};
//delete site
exports.delete = async (req, res, next) => {
  try {
    const site = await Site.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    await site.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
};