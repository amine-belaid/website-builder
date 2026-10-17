const User    = require('./User');
const Site    = require('./Site');
const Page    = require('./Page');
const Section = require('./Section');
const Asset   = require('./Asset');

// ── Associations ─────────────────────────────────────────────────

// User → Sites
User.hasMany(Site,    { foreignKey: 'user_id', onDelete: 'CASCADE' });
Site.belongsTo(User,  { foreignKey: 'user_id' });

// Site → Pages
Site.hasMany(Page,    { foreignKey: 'site_id', onDelete: 'CASCADE' });
Page.belongsTo(Site,  { foreignKey: 'site_id' });

// Page → Sections  ← THIS is what publishService needs
Page.hasMany(Section,    { foreignKey: 'page_id', onDelete: 'CASCADE' });
Section.belongsTo(Page,  { foreignKey: 'page_id' });

// User → Assets
User.hasMany(Asset,   { foreignKey: 'user_id', onDelete: 'CASCADE' });
Asset.belongsTo(User, { foreignKey: 'user_id' });

// ── Export everything from one place ─────────────────────────────
module.exports = { User, Site, Page, Section, Asset };

//onDelete : cascade : deleting a site deletes all of things 