const router     = require('express').Router();
const multer     = require('multer');
const cloudinary = require('../config/cloudinary');
const auth       = require('../middleware/auth');
const Asset      = require('../models/Asset');

// Store file in memory (not disk) before uploading to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(), // save it in RAM via buffer 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, and GIF allowed'));
  }
});
//upload.single('file') : Intercepte un fichier unique envoyé dans le champ FormData nommé file.
//2 middlewares : auth (vérifie l'authentification) et upload.single('file') (gère le téléchargement du fichier)


router.post('/upload', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // Upload buffer to Cloudinary


    
    //result : contient les informations sur le fichier téléchargé, y compris l'URL sécurisée (secure_url) du fichier sur Cloudinary.
    //stream : est un flux d'écriture qui permet de télécharger le fichier en mémoire (req.file.buffer) vers Cloudinary.
    //promise : transformer le tampon mémoire (req.file.buffer) de Multer en flux entrant.
    const result = await new Promise((resolve, reject) => { 
      const stream = cloudinary.uploader.upload_stream(
        { folder: `website-builder/${req.user.id}`, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    // Save reference in DB
    const asset = await Asset.create({
      user_id:  req.user.id,
      url:      result.secure_url,
      filename: req.file.originalname,
      size_bytes: req.file.size
    });

    res.status(201).json({ url: result.secure_url, assetId: asset.id });

  } catch (err) { next(err); }
});

// GET /assets — list all uploads for current user
router.get('/', auth, async (req, res, next) => {
  try {
    const assets = await Asset.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(assets);
  } catch (err) { next(err); }
});

// DELETE /assets/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const asset = await Asset.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await asset.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;