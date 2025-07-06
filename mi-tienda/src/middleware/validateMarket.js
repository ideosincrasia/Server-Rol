// src/middleware/validateMarket.js
import fs from 'fs/promises'
import path from 'path'

export default async function validateMarket(req, res, next) {
  try {
    // cargar mercado
    const marketRaw = await fs.readFile(path.resolve('data/_server','market.json'),'utf8')
    const marketData = JSON.parse(marketRaw)

    // cargar excepciones
    const excRaw = await fs.readFile(path.resolve('data/_server','exceptions.json'),'utf8')
    const { changed = [], ignored = [] } = JSON.parse(excRaw)
    const changedMap = new Map(changed.map(c => [c.name.toLowerCase(), c.lookup]))
    const ignoredSet = new Set(ignored.map(i => i.name.toLowerCase()))

    // cargar categorías
    const catsRaw = await fs.readFile(path.resolve('data/_server','categories.json'),'utf8')
    const categories = JSON.parse(catsRaw)
    const nameToCat = Object.entries(categories)
      .flatMap(([cat, list]) => list.map(n => [n.toLowerCase(), cat]))
      .reduce((m, [n,c]) => m.set(n,c), new Map())

    // cargar items
    const itemsRaw = await fs.readFile(path.resolve('data','items.json'),'utf8')
    const itemsParsed = JSON.parse(itemsRaw)
    const mainItems = Array.isArray(itemsParsed.item) ? itemsParsed.item
      : Array.isArray(itemsParsed.items) ? itemsParsed.items : []

    // cargar baseitems
    const baseRaw = await fs.readFile(path.resolve('data','items-base.json'),'utf8')
    const baseParsed = JSON.parse(baseRaw)
    const baseItems = Array.isArray(baseParsed.baseitem) ? baseParsed.baseitem : []

    // cargar hechizos
    async function loadSpells(file) {
      const raw = await fs.readFile(path.resolve('data','spells',file),'utf8')
      const p = JSON.parse(raw)
      return Array.isArray(p.spell) ? p.spell
        : Array.isArray(p.spells) ? p.spells
        : []
    }
    const [xphb,xge,tce] = await Promise.all([
      loadSpells('spells-xphb.json'),
      loadSpells('spells-xge.json'),
      loadSpells('spells-tce.json')
    ])

    const allItems  = mainItems.concat(baseItems)
    const allSpells = [...xphb, ...xge, ...tce]
    const found     = []
    const missing   = []

    // procesar cada entrada de mercado
    for (const entry of marketData) {
      const nl = entry.name.toLowerCase().trim()

      // ignored
      if (ignoredSet.has(nl)) {
        found.push({
          name: entry.name,
          marketPrice: entry.price,
          category: nameToCat.get(nl) || 'Sin categorizar'
        })
        continue
      }

      // nombre a buscar
      const lookup = changedMap.get(nl) || entry.name
      const ll     = lookup.toLowerCase().trim()
      let variants = []

      // materiales / servicio → hechizos
      if (ll.startsWith('materials for ')) {
        const spell = lookup.slice(14)
        variants = allSpells.filter(s => s.name.toLowerCase() === spell.toLowerCase())
      } else if (ll.startsWith('servicio de ')) {
        const spell = lookup.slice(12)
        variants = allSpells.filter(s => s.name.toLowerCase() === spell.toLowerCase())

      // barding → base item
      } else if (ll.endsWith(' (barding)')) {
        const baseName = lookup.replace(/\s*\(barding\)$/i,'')
        variants = allItems.filter(i => i.name.toLowerCase() === baseName.toLowerCase())

      // item normal
      } else {
        variants = allItems.filter(i => i.name.toLowerCase() === ll)
      }

      if (variants.length) {
        // escoger fuente
        const pick =
          variants.find(v => v.source==='XPHB') ||
          variants.find(v => v.source==='PHB')  ||
          variants.find(v => v.source==='XGE')  ||
          variants.find(v => v.source==='TCE') ||
          variants[0]

        found.push({
          ...pick,
          name: entry.name,
          marketPrice: entry.price,
          category: nameToCat.get(nl) || 'Sin categorizar'
        })
      } else {
        missing.push({
          name: entry.name,
          price: entry.price,
          category: nameToCat.get(nl) || 'Sin categorizar'
        })
      }
    }

    // guardar resultado en disco
    const results = { found, missing }
    await fs.writeFile(
      path.resolve('data/_server','marketResults.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    )

    req.marketResults = results
    next()

  } catch (err) {
    next(err)
  }
}