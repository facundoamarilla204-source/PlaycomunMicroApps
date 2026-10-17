const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'tools.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Update Tool type
content = content.replace(
  'category: "calculadoras" | "generadores" | "utilidades"',
  'type: "calculadora" | "generador" | "utilidad"\n  category: "precios-costos" | "plata-finanzas" | "gestion-negocio" | "clientes-utilidades" | "salud-fitness"\n  exampleResult?: string'
);

// We define our mappings
const mappings = [
  {
    slug: 'costo-receta',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "precios-costos"',
    example: 'exampleResult: "$800 costo / $2.400 venta"'
  },
  {
    slug: 'control-gastos',
    oldCat: 'category: "utilidades"',
    newType: 'type: "utilidad"',
    newCat: 'category: "plata-finanzas"',
    example: 'exampleResult: "Gastos del mes: $150.000"'
  },
  {
    slug: 'calculadora-precios',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "precios-costos"',
    example: 'exampleResult: "Costo $10k → Venta $15k"'
  },
  {
    slug: 'generador-presupuestos',
    oldCat: 'category: "generadores"',
    newType: 'type: "generador"',
    newCat: 'category: "gestion-negocio"',
    example: 'exampleResult: "PDF generado en 5 seg"'
  },
  {
    slug: 'calculadora-iva',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "precios-costos"',
    example: 'exampleResult: "$10.000 + IVA 21% = $12.100"'
  },
  {
    slug: 'calculadora-rentabilidad',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "precios-costos"',
    example: 'exampleResult: "Margen: 35% | Ganancia: $5k"'
  },
  {
    slug: 'generador-qr',
    oldCat: 'category: "generadores"',
    newType: 'type: "generador"',
    newCat: 'category: "clientes-utilidades"',
    example: 'exampleResult: "1 QR creado"'
  },
  {
    slug: 'calculadora-1rm',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "salud-fitness"',
    example: 'exampleResult: "1RM Estimado: 105kg"'
  },
  {
    slug: 'conversor-unidades',
    oldCat: 'category: "utilidades"',
    newType: 'type: "utilidad"',
    newCat: 'category: "clientes-utilidades"',
    example: 'exampleResult: "1 kg = 2.2 lb"'
  },
  {
    slug: 'calculadora-aguinaldo',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "plata-finanzas"',
    example: 'exampleResult: "Medio SAC: $250.000"'
  },
  {
    slug: 'calculadora-cuotas',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "plata-finanzas"',
    example: 'exampleResult: "3 cuotas de $4.500"'
  },
  {
    slug: 'calculadora-calorias',
    oldCat: 'category: "calculadoras"',
    newType: 'type: "calculadora"',
    newCat: 'category: "salud-fitness"',
    example: 'exampleResult: "2.100 kcal / día"'
  },
  {
    slug: 'link-resenas-google',
    oldCat: 'category: "generadores"',
    newType: 'type: "generador"',
    newCat: 'category: "clientes-utilidades"',
    example: 'exampleResult: "Link directo generado"'
  }
];

mappings.forEach(m => {
  const regex = new RegExp(`slug: "${m.slug}",\\s*name: "([^"]+)",\\s*${m.oldCat},`);
  content = content.replace(regex, `slug: "${m.slug}",\n    name: "$1",\n    ${m.newType},\n    ${m.newCat},\n    ${m.example},`);
});

fs.writeFileSync(filePath, content, 'utf-8');
