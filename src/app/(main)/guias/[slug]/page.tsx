import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";

const guiasDir = path.join(process.cwd(), "content", "guias");

export async function generateStaticParams() {
  const files = fs.readdirSync(guiasDir);
  return files.map((file) => ({
    slug: file.replace(".mdx", ""),
  }));
}

async function getGuide(slug: string) {
  try {
    const filePath = path.join(guiasDir, `${slug}.mdx`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    return { frontmatter: data, content };
  } catch (e) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const guide = await getGuide(resolvedParams.slug);
  
  if (!guide) {
    return { title: "Guía no encontrada" };
  }

  const { title, description } = guide.frontmatter;

  return {
    title: `${title} | Guías PlayComun`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteConfig.url}/guias/${resolvedParams.slug}`,
      images: [
        {
          url: `${siteConfig.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const guide = await getGuide(resolvedParams.slug);

  if (!guide) {
    notFound();
  }

  const { frontmatter, content } = guide;

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    dateModified: new Date(frontmatter.updatedAt).toISOString(),
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.organization?.name || siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/icon.png`,
      },
    },
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">{frontmatter.title}</h1>
          <p className="text-sm text-foreground-muted">
            Actualizado el {new Date(frontmatter.updatedAt).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <div className="prose prose-brand max-w-none prose-headings:font-bold prose-a:text-brand prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={content} />
        </div>

        {frontmatter.relatedTool && (
          <div className="mt-16 pt-8 border-t border-border">
            <div className="bg-brand/5 border border-brand/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Poné en práctica esta guía</h3>
                <p className="text-foreground-muted text-sm">
                  Tenemos una herramienta específica para que no tengas que calcular todo a mano.
                </p>
              </div>
              <Link 
                href={frontmatter.relatedTool}
                className="shrink-0 rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0"
              >
                Ver herramienta
              </Link>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
