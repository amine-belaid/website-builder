const Section = require('../models/Section');
const Page    = require('../models/Page');
const Site    = require('../models/Site');

// GET /pages/:id/sections — load editor state
//Récupère toutes les sections associées à l'identifiant de la page transmis dans l'URL (req.params.id).
exports.getSections = async (req, res, next) => {
  try {
    const sections = await Section.findAll({
      where: { page_id: req.params.id },  
      order: [['order', 'ASC']]
    });
    res.json(sections); //cast to json
  } catch (err) { next(err); }
};

// PUT /pages/:id/sections — save editor state
//Elle sauvegarde les blocs édités
exports.saveSections = async (req, res, next) => {
  try {
    const { sections } = req.body; // array from the frontend editor

    // Verify this page belongs to the current user
    const page = await Page.findByPk(req.params.id, {
      include: [{ model: Site, where: { user_id: req.user.id } }]
    });
    if (!page) return res.status(403).json({ error: 'Forbidden' });

    // Delete old sections and insert new ones automically
    await Section.destroy({ where: { page_id: req.params.id } });

    if (sections && sections.length > 0) {
      //Pour chaque section reçue du front-end, elle attribue un ID (existant ou nouveau via uuidv4()).
      await Section.bulkCreate(
        sections.map((s, i) => ({
          id:      s.id || uuidv4(),
          page_id: req.params.id,
          type:    s.type,
          props:   s.props || {},
          order:   i
        }))
      );
    }

    res.json({ ok: true, saved: sections?.length || 0 });
  } catch (err) { next(err); }
};