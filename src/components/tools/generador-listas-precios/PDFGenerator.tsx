import React from 'react'
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { PriceList, RubroType } from './types'

const styles = StyleSheet.create({
  // === BASE & GENERAL ===
  page: { 
    padding: 36, 
    fontFamily: 'Helvetica', 
    backgroundColor: '#FFFFFF',
    paddingBottom: 50,
  },
  header: { 
    marginBottom: 24, 
    borderBottomWidth: 2, 
    borderBottomColor: '#E2E8F0', 
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  logoContainer: {
    width: 60,
    height: 60,
    marginLeft: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  title: { 
    fontSize: 22, 
    fontFamily: 'Helvetica-Bold', 
    color: '#0F172A', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 13, 
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 3,
  },
  contactText: {
    fontSize: 10,
    color: '#64748B',
  },
  categoryContainer: { 
    marginTop: 14, 
    marginBottom: 8 
  },
  categoryTitle: { 
    fontSize: 14, 
    fontFamily: 'Helvetica-Bold', 
    color: '#0F172A', 
    borderBottomWidth: 1.5, 
    borderBottomColor: '#0F172A', 
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingVertical: 6, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#E2E8F0',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: { 
    fontSize: 11, 
    color: '#0F172A',
    fontFamily: 'Helvetica-Bold',
  },
  itemDescription: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  itemDetailsBadge: {
    fontSize: 8.5,
    color: '#475569',
    marginTop: 1,
    fontStyle: 'italic',
  },
  itemPrice: { 
    fontSize: 11, 
    fontFamily: 'Helvetica-Bold', 
    color: '#0F172A',
    textAlign: 'right',
    minWidth: 70,
  },

  // === GASTRONOMÍA ===
  gastroPage: { backgroundColor: '#FAFAF9', padding: 40, paddingBottom: 50 },
  gastroHeader: { borderBottomWidth: 1, borderBottomColor: '#D97706', marginBottom: 28 },
  gastroTitle: { color: '#92400E', fontSize: 24, textTransform: 'uppercase', letterSpacing: 1 },
  gastroSubtitle: { color: '#78350F' },
  gastroCategoryContainer: { marginBottom: 18 },
  gastroCategory: { 
    fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#92400E', 
    marginBottom: 10, textTransform: 'uppercase', borderBottomWidth: 1, 
    borderBottomColor: '#D97706', paddingBottom: 3, textAlign: 'center'
  },
  gastroItemRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', 
    width: '100%', paddingVertical: 4, marginBottom: 2
  },
  gastroItemName: { fontSize: 11, color: '#1C1917', fontFamily: 'Helvetica-Bold' },
  gastroItemPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#92400E', minWidth: 65, textAlign: 'right' },
  gastroDots: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#D6D3D1', borderBottomStyle: 'dashed', marginHorizontal: 6, position: 'relative', top: -3 },

  // === INDUMENTARIA ===
  induPage: { padding: 36, backgroundColor: '#FFFFFF', paddingBottom: 50 },
  induHeader: { borderBottomWidth: 2, borderBottomColor: '#000000', marginBottom: 22 },
  induTitle: { color: '#000000', letterSpacing: 2, textTransform: 'uppercase', fontSize: 20 },
  induCategoryContainer: { marginTop: 18, marginBottom: 10 },
  induCategory: { 
    fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', backgroundColor: '#000000',
    paddingVertical: 4, paddingHorizontal: 8, textTransform: 'uppercase', marginBottom: 8
  },
  induItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#CBD5E1' },
  induItemName: { fontSize: 10.5, color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Helvetica-Bold' },
  induItemPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#000000', minWidth: 65, textAlign: 'right' },

  // === MAYORISTA ===
  mayoPage: { padding: 30, paddingBottom: 50 },
  mayoHeader: { backgroundColor: '#F1F5F9', padding: 14, marginBottom: 16, borderBottomWidth: 0, borderRadius: 4 },
  mayoTitle: { color: '#0F172A', fontSize: 20 },
  mayoCategory: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0F172A', backgroundColor: '#E2E8F0', padding: 5, marginTop: 8, marginBottom: 4 },
  mayoItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9' },
  mayoItemRowAlt: { backgroundColor: '#F8FAFC' },
  mayoItemName: { fontSize: 10, color: '#0F172A', fontFamily: 'Helvetica-Bold' },
  mayoItemPrice: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#047857', minWidth: 65, textAlign: 'right' },

  // === PELUQUERIA Y ESTETICA ===
  peluPage: { padding: 36, backgroundColor: '#FFF5F6', paddingBottom: 50 },
  peluHeader: { borderBottomWidth: 1, borderBottomColor: '#FDA4AF', marginBottom: 20, textAlign: 'center' },
  peluTitle: { color: '#9F1239', fontSize: 22, letterSpacing: 1 },
  peluCategory: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#BE185D', textAlign: 'center', marginTop: 16, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  peluItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#FECDD3' },
  peluItemName: { fontSize: 10.5, color: '#881337', fontFamily: 'Helvetica' },
  peluItemPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#9F1239', minWidth: 65, textAlign: 'right' },

  // === PROFESIONALES ===
  profPage: { padding: 36, paddingBottom: 50 },
  profHeader: { borderBottomWidth: 3, borderBottomColor: '#2563EB', marginBottom: 22 },
  profTitle: { color: '#1E3A8A', fontSize: 21, fontFamily: 'Helvetica-Bold' },
  profCategory: { fontSize: 12.5, fontFamily: 'Helvetica-Bold', color: '#2563EB', borderLeftWidth: 3, borderLeftColor: '#2563EB', paddingLeft: 6, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  profItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  profItemName: { fontSize: 10.5, color: '#1E293B', fontFamily: 'Helvetica-Bold' },
  profItemPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2563EB', minWidth: 65, textAlign: 'right' },

  // === FOOTER & PAGINATION ===
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#CBD5E1',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8.5,
    color: '#94A3B8',
  },
})

function formatPriceWithCurrency(price: number, currency: string = 'ARS'): string {
  const formattedNumber = Math.round(price).toLocaleString('es-AR')
  switch (currency.toUpperCase()) {
    case 'USD':
      return `USD $ ${formattedNumber}`
    case 'EUR':
      return `€ ${formattedNumber}`
    case 'CLP':
      return `CLP $ ${formattedNumber}`
    case 'UYU':
      return `$U ${formattedNumber}`
    case 'ARS':
    default:
      return `$ ${formattedNumber}`
  }
}

function getPageStyle(r: RubroType) {
  switch (r) {
    case 'gastronomia': return styles.gastroPage
    case 'indumentaria': return styles.induPage
    case 'mayorista': return styles.mayoPage
    case 'peluqueria': return styles.peluPage
    case 'profesionales': return styles.profPage
    default: return styles.page
  }
}

function getHeaderStyle(r: RubroType) {
  switch (r) {
    case 'gastronomia': return [styles.header, styles.gastroHeader]
    case 'indumentaria': return [styles.header, styles.induHeader]
    case 'mayorista': return [styles.header, styles.mayoHeader]
    case 'peluqueria': return [styles.header, styles.peluHeader]
    case 'profesionales': return [styles.header, styles.profHeader]
    default: return styles.header
  }
}

function getTitleStyle(r: RubroType) {
  switch (r) {
    case 'gastronomia': return [styles.title, styles.gastroTitle]
    case 'indumentaria': return [styles.title, styles.induTitle]
    case 'mayorista': return [styles.title, styles.mayoTitle]
    case 'peluqueria': return [styles.title, styles.peluTitle]
    case 'profesionales': return [styles.title, styles.profTitle]
    default: return styles.title
  }
}

function getCategoryContainerStyle(r: RubroType) {
  switch (r) {
    case 'gastronomia': return styles.gastroCategoryContainer
    case 'indumentaria': return styles.induCategoryContainer
    default: return styles.categoryContainer
  }
}

function getCategoryTitleStyle(r: RubroType) {
  switch (r) {
    case 'gastronomia': return styles.gastroCategory
    case 'indumentaria': return styles.induCategory
    case 'mayorista': return styles.mayoCategory
    case 'peluqueria': return styles.peluCategory
    case 'profesionales': return styles.profCategory
    default: return styles.categoryTitle
  }
}

function getItemRowStyle(r: RubroType, isAltRow: boolean) {
  switch (r) {
    case 'indumentaria': return styles.induItemRow
    case 'mayorista': return isAltRow ? [styles.mayoItemRow, styles.mayoItemRowAlt] : styles.mayoItemRow
    case 'peluqueria': return styles.peluItemRow
    case 'profesionales': return styles.profItemRow
    default: return styles.itemRow
  }
}

function getItemNameStyle(r: RubroType) {
  switch (r) {
    case 'indumentaria': return styles.induItemName
    case 'mayorista': return styles.mayoItemName
    case 'peluqueria': return styles.peluItemName
    case 'profesionales': return styles.profItemName
    default: return styles.itemName
  }
}

function getItemPriceStyle(r: RubroType) {
  switch (r) {
    case 'indumentaria': return styles.induItemPrice
    case 'mayorista': return styles.mayoItemPrice
    case 'peluqueria': return styles.peluItemPrice
    case 'profesionales': return styles.profItemPrice
    default: return styles.itemPrice
  }
}

const PriceListDocument = ({ list }: { list: PriceList }) => {
  const r = list.rubro
  const titleText = list.name?.trim() || 'Lista de Precios'
  const currency = list.currency || 'ARS'

  return (
    <Document>
      <Page size="A4" style={getPageStyle(r)}>
        
        {/* HEADER COMERCIAL */}
        <View style={getHeaderStyle(r)}>
          <View style={styles.headerContent}>
            <Text style={getTitleStyle(r)}>
              {titleText}
            </Text>

            {list.business_name && (
              <Text style={r === 'gastronomia' ? [styles.subtitle, styles.gastroSubtitle] : styles.subtitle}>
                {list.business_name}
              </Text>
            )}

            {list.contact_info && (
              <Text style={styles.contactText}>
                {list.contact_info}
              </Text>
            )}
          </View>

          {list.logo_url && (
            <View style={styles.logoContainer}>
              <Image src={list.logo_url} style={styles.logo} />
            </View>
          )}
        </View>

        {/* LISTA DE CATEGORÍAS Y PRODUCTOS */}
        {list.categories.map(cat => {
          const products = list.products.filter(p => p.category_id === cat.id)
          // Si la categoría no tiene productos, NO se renderiza en el PDF (comportamiento aprobado)
          if (products.length === 0) return null

          return (
            <View key={cat.id} wrap={false} style={getCategoryContainerStyle(r)}>
              <Text style={getCategoryTitleStyle(r)}>
                {cat.name}
              </Text>
              
              <View style={{ width: '100%' }}>
                {products.map((prod, index) => {
                  const isAltRow = index % 2 === 1
                  const detailsBadge = [
                    prod.code ? `Cód: ${prod.code}` : null,
                    prod.variant ? `Talle/Var: ${prod.variant}` : null,
                    prod.unit ? `Unidad: ${prod.unit}` : null,
                    prod.duration ? `Duración: ${prod.duration}` : null,
                  ].filter(Boolean).join(' • ')

                  if (r === 'gastronomia') {
                    return (
                      <View key={prod.id} wrap={false} style={styles.gastroItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.gastroItemName}>{prod.name}</Text>
                          {prod.description ? (
                            <Text style={styles.itemDescription}>{prod.description}</Text>
                          ) : null}
                        </View>
                        <View style={styles.gastroDots} />
                        <Text style={styles.gastroItemPrice}>
                          {formatPriceWithCurrency(prod.price, currency)}
                        </Text>
                      </View>
                    )
                  }

                  return (
                    <View key={prod.id} wrap={false} style={getItemRowStyle(r, isAltRow)}>
                      <View style={styles.itemInfo}>
                        <Text style={getItemNameStyle(r)}>
                          {prod.name}
                        </Text>

                        {prod.description ? (
                          <Text style={styles.itemDescription}>{prod.description}</Text>
                        ) : null}

                        {detailsBadge ? (
                          <Text style={styles.itemDetailsBadge}>{detailsBadge}</Text>
                        ) : null}
                      </View>
                      
                      <Text style={getItemPriceStyle(r)}>
                        {formatPriceWithCurrency(prod.price, currency)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}

        {/* PIE DE PÁGINA CON NUMERACIÓN AUTOMÁTICA */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {list.business_name || 'PlayComun Online'} • {new Date().toLocaleDateString('es-AR')}
          </Text>
          <Text 
            style={styles.footerText} 
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} 
          />
        </View>
      </Page>
    </Document>
  )
}

export const generatePDF = async (list: PriceList, action: 'download' | 'blob' = 'download') => {
  const blob = await pdf(<PriceListDocument list={list} />).toBlob()

  if (action === 'blob') {
    return URL.createObjectURL(blob)
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const cleanName = (list.name?.trim() || 'lista-precios')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
  link.download = `${cleanName}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
