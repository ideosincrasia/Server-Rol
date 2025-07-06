import express from 'express';
import fs from 'fs/promises';
import apiRoutes from './routes/router_api.js';
import webRoutes from './routes/router_web.js';
import path from 'path';


// Carga los productos desde el archivo JSON
async function loadProducts() {
  const raw = await fs.readFile(path.resolve('data/_server', 'marketResults.json'),'utf-8'); ;

const {found, missing} = JSON.parse(raw);

if (missing.length) {
  console.warn(`Productos faltantes: ${missing.join(', ')}`);
}

return found;
}

async function main() {
  const app = express()
  const PORT = process.env.PORT || 3000

  // configurar vistas
  app.set('views', path.resolve('src/views'))
  app.set('view engine', 'ejs')

  // cargar datos en memoria
  app.locals.products = await loadProducts()

  // rutas
  app.use('/api', apiRoutes)
  app.use(webRoutes)

  // estáticos
  app.use(express.static(path.resolve('public')))

  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`)
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})