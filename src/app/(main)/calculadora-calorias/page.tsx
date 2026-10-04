import { tools } from '@/data/tools';
import { notFound } from 'next/navigation';
import { ToolPageLayout } from '@/components/layout/ToolPageLayout';
import { CalculadoraCalorias } from '@/components/tools/CalculadoraCalorias';
import { CalculadoraCaloriasContent } from '@/components/tools/content/CalculadoraCaloriasContent';
import type { Metadata } from 'next';

const tool = tools.find((t) => t.slug === 'calculadora-calorias');

export const metadata: Metadata = {
  title: tool?.seo?.title,
  description: tool?.seo?.description,
};

export default function CalculadoraCaloriasPage() {
  if (!tool) return notFound();

  return (
    <ToolPageLayout tool={tool}>
      <CalculadoraCalorias />
      
      <div className="mt-16 sm:mt-24 max-w-3xl mx-auto">
        <CalculadoraCaloriasContent />
      </div>
    </ToolPageLayout>
  );
}
