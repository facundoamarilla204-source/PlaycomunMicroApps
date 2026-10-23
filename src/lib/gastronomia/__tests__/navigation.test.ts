import { describe, it, expect } from 'vitest'
import {
  AMASIA_NAV_GROUPS,
  getAllAmasiaNavItems,
  isAmasiaItemActive,
  getActiveAmasiaNavItem,
} from '../navigation'

describe('Amasia Navigation Architecture (SSOT)', () => {
  it('contiene todos los grupos organizados lógicamente', () => {
    expect(AMASIA_NAV_GROUPS.length).toBeGreaterThanOrEqual(5)
    const groupIds = AMASIA_NAV_GROUPS.map((g) => g.id)
    expect(groupIds).toContain('resumen')
    expect(groupIds).toContain('comercial')
    expect(groupIds).toContain('elaboracion')
    expect(groupIds).toContain('planificacion')
    expect(groupIds).toContain('abastecimiento')
    expect(groupIds).toContain('herramientas')
  })

  it('proporciona acceso a todos los módulos operativos sin omisiones', () => {
    const items = getAllAmasiaNavItems()
    const itemIds = items.map((i) => i.id)

    // Los 12 módulos de Amasia existentes
    expect(itemIds).toContain('inicio')
    expect(itemIds).toContain('pedidos')
    expect(itemIds).toContain('calendario')
    expect(itemIds).toContain('clientes')
    expect(itemIds).toContain('recetas')
    expect(itemIds).toContain('ingredientes')
    expect(itemIds).toContain('panaderia')
    expect(itemIds).toContain('produccion')
    expect(itemIds).toContain('inventario')
    expect(itemIds).toContain('compras')
    expect(itemIds).toContain('proveedores')
    expect(itemIds).toContain('costos')

    expect(items.length).toBe(12)
  })

  it('no contiene IDs ni rutas duplicadas', () => {
    const items = getAllAmasiaNavItems()
    const ids = items.map((i) => i.id)
    const hrefs = items.map((i) => i.href)

    const uniqueIds = new Set(ids)
    const uniqueHrefs = new Set(hrefs)

    expect(uniqueIds.size).toBe(ids.length)
    expect(uniqueHrefs.size).toBe(hrefs.length)
  })

  it('identifica correctamente el ítem activo según el pathname', () => {
    const items = getAllAmasiaNavItems()
    const inicioItem = items.find((i) => i.id === 'inicio')!
    const recetasItem = items.find((i) => i.id === 'recetas')!
    const comprasItem = items.find((i) => i.id === 'compras')!
    const inventarioItem = items.find((i) => i.id === 'inventario')!

    // Inicio solo activo en '/cocina-pro' exacto
    expect(isAmasiaItemActive(inicioItem, '/cocina-pro')).toBe(true)
    expect(isAmasiaItemActive(inicioItem, '/cocina-pro/recetas')).toBe(false)

    // Recetas activo en /cocina-pro/recetas y subrutas / recetas/nueva / elaboración
    expect(isAmasiaItemActive(recetasItem, '/cocina-pro/recetas')).toBe(true)
    expect(isAmasiaItemActive(recetasItem, '/cocina-pro/recetas/nueva')).toBe(true)
    expect(isAmasiaItemActive(recetasItem, '/cocina-pro/elaboracion/abc-123')).toBe(true)

    // Compras activo en /cocina-pro/compras y /cocina-pro/compras/nueva
    expect(isAmasiaItemActive(comprasItem, '/cocina-pro/compras')).toBe(true)
    expect(isAmasiaItemActive(comprasItem, '/cocina-pro/compras/nueva')).toBe(true)
    expect(isAmasiaItemActive(comprasItem, '/cocina-pro/inventario')).toBe(false)

    // Inventario activo en /cocina-pro/inventario
    expect(isAmasiaItemActive(inventarioItem, '/cocina-pro/inventario')).toBe(true)
  })

  it('obtiene el ítem activo correcto con getActiveAmasiaNavItem', () => {
    expect(getActiveAmasiaNavItem('/cocina-pro')?.id).toBe('inicio')
    expect(getActiveAmasiaNavItem('/cocina-pro/recetas')?.id).toBe('recetas')
    expect(getActiveAmasiaNavItem('/cocina-pro/recetas/nueva')?.id).toBe('recetas')
    expect(getActiveAmasiaNavItem('/cocina-pro/elaboracion/receta-1')?.id).toBe('recetas')
    expect(getActiveAmasiaNavItem('/cocina-pro/ingredientes')?.id).toBe('ingredientes')
    expect(getActiveAmasiaNavItem('/cocina-pro/panaderia')?.id).toBe('panaderia')
    expect(getActiveAmasiaNavItem('/cocina-pro/produccion')?.id).toBe('produccion')
    expect(getActiveAmasiaNavItem('/cocina-pro/inventario')?.id).toBe('inventario')
    expect(getActiveAmasiaNavItem('/cocina-pro/compras')?.id).toBe('compras')
    expect(getActiveAmasiaNavItem('/cocina-pro/proveedores')?.id).toBe('proveedores')
    expect(getActiveAmasiaNavItem('/herramientas/costo-receta')?.id).toBe('costos')
  })
})
