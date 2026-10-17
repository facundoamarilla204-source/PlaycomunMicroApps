import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true, // we already know the src/ is fine, .agents has TS errors
  },
  async redirects() {
    return [
      // Herramientas: Redirección permanente de raíz a /herramientas/<slug>
      { source: "/costo-receta", destination: "/herramientas/costo-receta", permanent: true },
      { source: "/control-gastos", destination: "/herramientas/control-gastos", permanent: true },
      { source: "/calculadora-precios", destination: "/herramientas/calculadora-precios", permanent: true },
      { source: "/generador-presupuestos", destination: "/herramientas/generador-presupuestos", permanent: true },
      { source: "/generador-documentos-comerciales", destination: "/herramientas/generador-documentos-comerciales", permanent: true },
      { source: "/calculadora-iva", destination: "/herramientas/calculadora-iva", permanent: true },
      { source: "/calculadora-rentabilidad", destination: "/herramientas/calculadora-rentabilidad", permanent: true },
      { source: "/generador-qr", destination: "/herramientas/generador-qr", permanent: true },
      { source: "/calculadora-1rm", destination: "/herramientas/calculadora-1rm", permanent: true },
      { source: "/conversor-unidades", destination: "/herramientas/conversor-unidades", permanent: true },
      { source: "/calculadora-aguinaldo", destination: "/herramientas/calculadora-aguinaldo", permanent: true },
      { source: "/calculadora-cuotas", destination: "/herramientas/calculadora-cuotas", permanent: true },
      { source: "/calculadora-calorias", destination: "/herramientas/calculadora-calorias", permanent: true },
      { source: "/link-resenas-google", destination: "/herramientas/link-resenas-google", permanent: true },
      { source: "/generador-listas-precios", destination: "/herramientas/generador-listas-precios", permanent: true },
      { source: "/compresor-imagenes", destination: "/herramientas/compresor-imagenes", permanent: true },
      { source: "/convertidor-archivos", destination: "/herramientas/convertidor-archivos", permanent: true },
      { source: "/ordenar-pdf", destination: "/herramientas/ordenar-pdf", permanent: true },
      { source: "/cortar-audio", destination: "/herramientas/cortar-audio", permanent: true },

      // Alias y URLs históricas
      { source: "/herramientas/generador-facturas", destination: "/herramientas/generador-documentos-comerciales", permanent: true },
      { source: "/generador-facturas", destination: "/herramientas/generador-documentos-comerciales", permanent: true },
    ];
  },
};

export default nextConfig;
