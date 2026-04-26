const express = require('express');
const router = express.Router();
const { db } = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for gallery uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/gallery');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Get all photos
router.get('/', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM gallery ORDER BY uploaded_at DESC').all();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a photo
router.post('/', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    const id = uuidv4();
    const title = req.body.title || '';
    const imagePath = `/uploads/gallery/${req.file.filename}`;
    
    db.prepare(`
      INSERT INTO gallery (id, title, image_path)
      VALUES (?, ?, ?)
    `).run(id, title, imagePath);
    
    const photo = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update photo title
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    db.prepare('UPDATE gallery SET title = ? WHERE id = ?').run(title || '', id);
    
    const photo = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a photo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const photo = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }
    
    // Delete file
    const filePath = path.join(__dirname, '..', photo.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
