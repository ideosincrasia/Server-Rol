import { Router } from 'express';
import validateMarket from '../middleware/validateMarket.js';

const router = Router();

// GET /api/items → antes de responder, validamos y obtenemos coincidencias
router.get('/items', validateMarket, (req, res) => {
  res.json(req.marketResults);
});

// POST /api/purchase → recibe { items: [...] } y procesa la “compra”
router.post('/purchase', (req, res) => {
  const { items } = req.body;
  res.json({ success: true, purchased: items });
});

export default router;