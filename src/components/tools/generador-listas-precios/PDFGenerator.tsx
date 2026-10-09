import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { PriceList } from './types'

const styles = StyleSheet.create({
  // === BASE & GENERAL ===
  page: { 
    padding: 40, 
    fontFamily: 'Helvetica', 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    marginBottom: 30, 
    borderBottomWidth: 2, 
    borderBottomColor: '#E5E7EB', 
    paddingBottom: 15,
    alignItems: 'center'
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'Helvetica-Bold', 
    color: '#000000', 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#4B5563' 
  },
  categoryContainer: { marginTop: 20, marginBottom: 10 },
  categoryTitle: { 
    fontSize: 16, 
    fontFamily: 'Helvetica-Bold', 
    color: '#111827', 
    borderBottomWidth: 2, 
    borderBottomColor: '#111827', 
    paddingBottom: 4,
    marginBottom: 10
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  itemName: { 
    fontSize: 12, 
    color: '#000000',
    fontFamily: 'Helvetica'
  },
  itemPrice: { 
    fontSize: 12, 
    fontFamily: 'Helvetica-Bold', 
    color: '#000000' 
  },

  // === GASTRONOMÍA ===
  gastroPage: { backgroundColor: '#FAFAF9', padding: 50 },
  gastroHeader: { borderBottomWidth: 0, marginBottom: 40 },
  gastroTitle: { color: '#92400E', fontSize: 28, textTransform: 'uppercase', letterSpacing: 2 },
  gastroCategoryContainer: { marginBottom: 25, alignItems: 'center' },
  gastroCategory: { 
    fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#92400E', 
    marginBottom: 15, textTransform: 'uppercase', borderBottomWidth: 1, 
    borderBottomColor: '#D97706', paddingBottom: 4, width: '100%', textAlign: 'center'
  },
  gastroItemRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', 
    width: '100%', paddingVertical: 4, marginBottom: 4
  },
  gastroItemName: { fontSize: 12, color: '#1C1917', fontFamily: 'Helvetica-Bold', flex: 1 },
  gastroItemPrice: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#92400E' },
  gastroDots: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#D6D3D1', borderBottomStyle: 'dashed', marginHorizontal: 8, position: 'relative', top: -4 },

  // === INDUMENTARIA ===
  induPage: { padding: 40, backgroundColor: '#FFFFFF' },
  induHeader: { borderBottomWidth: 1, borderBottomColor: '#000000', alignItems: 'flex-start' },
  induTitle: { color: '#000000', letterSpacing: 4, textTransform: 'uppercase', fontSize: 22 },
  induCategoryContainer: { marginTop: 30, marginBottom: 15 },
  induCategory: { 
    fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', backgroundColor: '#000000',
    paddingVertical: 6, paddingHorizontal: 10, textTransform: 'uppercase', marginBottom: 10
  },
  induItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  induItemName: { fontSize: 11, color: '#000000', letterSpacing: 1, textTransform: 'uppercase' },
  induItemPrice: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#000000' },

  // === MAYORISTA ===
  mayoPage: { padding: 30 },
  mayoHeader: { backgroundColor: '#F3F4F6', padding: 20, marginBottom: 20, alignItems: 'flex-start', borderBottomWidth: 0 },
  mayoTitle: { color: '#1F2937', fontSize: 26 },
  mayoCategory: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1F2937', backgroundColor: '#E5E7EB', padding: 6, marginTop: 10 },
  mayoItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  mayoItemRowAlt: { backgroundColor: '#F9FAFB' },
  mayoItemName: { fontSize: 11, color: '#111827', fontFamily: 'Helvetica-Bold' },
  mayoItemPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#047857' }, // Verde para precios

  // === PELUQUERIA Y ESTETICA ===
  peluPage: { padding: 40, backgroundColor: '#FFF1F2' }, // Rosa muy suave
  peluHeader: { borderBottomWidth: 1, borderBottomColor: '#FDA4AF', alignItems: 'center' },
  peluTitle: { color: '#9F1239', fontSize: 26, fontFamily: 'Helvetica', letterSpacing: 1 },
  peluCategory: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#BE185D', textAlign: 'center', marginTop: 25, marginBottom: 15, letterSpacing: 1 },
  peluItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FECDD3' },
  peluItemName: { fontSize: 12, color: '#881337', fontStyle: 'italic' },
  peluItemPrice: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#9F1239' },

  // === PROFESIONALES ===
  profPage: { padding: 45 },
  profHeader: { borderBottomWidth: 4, borderBottomColor: '#1D4ED8', alignItems: 'flex-start', paddingBottom: 20 },
  profTitle: { color: '#1E3A8A', fontSize: 24, fontFamily: 'Helvetica-Bold' },
  profCategory: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1D4ED8', borderLeftWidth: 4, borderLeftColor: '#1D4ED8', paddingLeft: 8, marginTop: 20, marginBottom: 10 },
  profItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  profItemName: { fontSize: 12, color: '#1F2937' },
  profItemPrice: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1D4ED8' },
})

const PriceListDocument = ({ list }: { list: PriceList }) => {
  const r = list.rubro
  const hasValidName = list.name && list.name !== 'Nueva Lista'
  const showHeader = hasValidName || list.business_name

  return (
    <Document>
      <Page size="A4" style={[
        styles.page,
        r === 'gastronomia' && styles.gastroPage,
        r === 'indumentaria' && styles.induPage,
        r === 'mayorista' && styles.mayoPage,
        r === 'peluqueria' && styles.peluPage,
        r === 'profesionales' && styles.profPage,
      ]}>
        
        {showHeader && (
          <View style={[
            styles.header, 
            r === 'gastronomia' && styles.gastroHeader,
            r === 'indumentaria' && styles.induHeader,
            r === 'mayorista' && styles.mayoHeader,
            r === 'peluqueria' && styles.peluHeader,
            r === 'profesionales' && styles.profHeader,
          ]}>
            {hasValidName && (
              <Text style={[
                styles.title, 
                r === 'gastronomia' && styles.gastroTitle,
                r === 'indumentaria' && styles.induTitle,
                r === 'mayorista' && styles.mayoTitle,
                r === 'peluqueria' && styles.peluTitle,
                r === 'profesionales' && styles.profTitle,
              ]}>
                {list.name}
              </Text>
            )}
            {list.business_name && (
              <Text style={[styles.subtitle]}>
                {list.business_name}
              </Text>
            )}
          </View>
        )}

        {list.categories.map(cat => {
          const products = list.products.filter(p => p.category_id === cat.id)
          if (products.length === 0) return null

          return (
            <View key={cat.id} style={
              r === 'gastronomia' ? styles.gastroCategoryContainer : 
              r === 'indumentaria' ? styles.induCategoryContainer : 
              styles.categoryContainer
            }>
              <Text style={
                r === 'gastronomia' ? styles.gastroCategory : 
                r === 'indumentaria' ? styles.induCategory : 
                r === 'mayorista' ? styles.mayoCategory : 
                r === 'peluqueria' ? styles.peluCategory : 
                r === 'profesionales' ? styles.profCategory : 
                styles.categoryTitle
              }>
                {cat.name}
              </Text>
              
              <View style={{ width: '100%' }}>
                {products.map((prod, index) => {
                  const isAltRow = index % 2 === 1
                  return (
                    <View key={prod.id} style={[
                      r === 'gastronomia' ? styles.gastroItemRow :
                      r === 'indumentaria' ? styles.induItemRow :
                      r === 'mayorista' ? [styles.mayoItemRow, isAltRow && styles.mayoItemRowAlt] :
                      r === 'peluqueria' ? styles.peluItemRow :
                      r === 'profesionales' ? styles.profItemRow :
                      styles.itemRow
                    ]}>
                      <Text style={
                        r === 'gastronomia' ? styles.gastroItemName :
                        r === 'indumentaria' ? styles.induItemName :
                        r === 'mayorista' ? styles.mayoItemName :
                        r === 'peluqueria' ? styles.peluItemName :
                        r === 'profesionales' ? styles.profItemName :
                        styles.itemName
                      }>
                        {prod.name}
                      </Text>
                      
                      {r === 'gastronomia' && <View style={styles.gastroDots} />}
                      
                      <Text style={
                        r === 'gastronomia' ? styles.gastroItemPrice :
                        r === 'indumentaria' ? styles.induItemPrice :
                        r === 'mayorista' ? styles.mayoItemPrice :
                        r === 'peluqueria' ? styles.peluItemPrice :
                        r === 'profesionales' ? styles.profItemPrice :
                        styles.itemPrice
                      }>
                        ${prod.price.toLocaleString('es-AR')}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}
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
  link.download = `${list.name !== 'Nueva Lista' && list.name ? list.name : 'lista-precios'}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
