import { Router } from 'express';
import validateMarket from '../middleware/validateMarket.js';
import path from 'path';

const router = Router();

// Endpoint para obtener la URL de la imagen del mapa (usado por mapa.js)
router.get('/img-meta', (req, res) => {
  const map = req.query.map || 'public';
  res.json({ ok: true, src: `/api/map-image/${map}` });
});

// Servir imágenes del mapa desde la carpeta privada
router.get('/map-image/:type', (req, res) => {
  const { type } = req.params;
  const filename = `world_${type}.png`; // Asume nombres como map_public.jpg
  res.sendFile(path.resolve('src', 'private', filename));
});

// POST /api/purchase → recibe { items: [...] } y procesa la “compra”
router.post('/purchase', (req, res) => {
  const { items } = req.body;
  res.json({ success: true, purchased: items });
});

export default router;