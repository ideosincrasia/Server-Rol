// routes/web.js
import { Router } from 'express';
import path from 'path';
const router = Router();

const publicPath = path.resolve('src/public');

// Ruta raíz
router.get('/', (req, res) => {
  res.render('index')
});

// Ruta para la tienda
router.get('/shop', (req, res) => {
  const productos  = req.app.locals.products || []
  const categorias = [...new Set(productos.map(p => p.category))].sort()
  res.render('shop', { productos, categorias })
})

// Ruta para la página de carro
router.get('/cart', (req, res) => {
  const productos = req.app.locals.products || []
  res.render('cart', { productos })
})


export default router;