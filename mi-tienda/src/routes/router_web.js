// routes/web.js
import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
const router = Router();

const publicPath = path.resolve('src/public');

// Ruta raíz
router.get('/', (req, res) => {
  res.render('index')
});

// Ruta de la nueva tienda
router.get('/new-shop', async (req, res) => {
  const filePath = path.resolve('data', 'tienda/items_new.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const inventory = JSON.parse(data).equipment;
  const categorias = Object.keys(inventory);
  res.render('new-shop', { inventory, categorias })
})

// Ruta del mapa
router.get('/mapa', async (req, res) => {
  try {
    const poiPath = path.resolve('data', 'mapa/puntos_interes.json');
    const data = await fs.readFile(poiPath, 'utf-8');
    const pointsOfInterest = JSON.parse(data);
    res.render('mapa', { pointsOfInterest });
  } catch (error) {
    console.error('Error loading map data:', error);
    res.render('mapa');
  }
});

export default router;