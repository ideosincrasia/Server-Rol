// Carga los productos desde el archivo JSON
async function loadProducts() {
  const raw = await fs.readFile(path.resolve('data/_server', 'marketResults.json'),'utf-8'); ;

const {found, missing} = JSON.parse(raw);

if (missing.length) {
  console.warn(`Productos faltantes: ${missing.join(', ')}`);
}

return found;
}

