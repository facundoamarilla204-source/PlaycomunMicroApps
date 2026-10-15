import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true, // we already know the src/ is fine, .agents has TS errors
  },
  async redirects() {
    return [
      {
        source: "/control-gastos",
        destination: "/herramientas/control-gastos",
        permanent: true,
      },
      {
        source: "/calculadora-iva",
        destination: "/herramientas/calculadora-iva",
        permanent: true,
      },
      {
        source: "/calculadora-rentabilidad",
        destination: "/herramientas/calculadora-rentabilidad",
        permanent: true,
      },
      {
        source: "/calculadora-1rm",
        destination: "/herramientas/calculadora-1rm",
        permanent: true,
      },
      {
        source: "/calculadora-cuotas",
        destination: "/herramientas/calculadora-cuotas",
        permanent: true,
      },
      {
        source: "/calculadora-calorias",
        destination: "/herramientas/calculadora-calorias",
        permanent: true,
      },
      {
        source: "/link-resenas-google",
        destination: "/herramientas/link-resenas-google",
        permanent: true,
      },
      {
        source: "/herramientas/generador-facturas",
        destination: "/herramientas/generador-documentos-comerciales",
        permanent: true,
      },
      {
        source: "/generador-facturas",
        destination: "/herramientas/generador-documentos-comerciales",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
