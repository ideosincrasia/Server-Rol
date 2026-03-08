import express from 'express';
import apiRoutes from './routes/router_api.js';
import webRoutes from './routes/router_web.js';
import path from 'path';

async function main() {
  const app = express()
  const PORT = process.env.PORT || 3000

  // configurar vistas
  app.set('views', path.resolve('src/views'))
  app.set('view engine', 'ejs')

  // rutas
  app.use('/api', apiRoutes)
  app.use(webRoutes)

  // estáticos
  app.use(express.static(path.resolve('src/public')))

  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`)
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})