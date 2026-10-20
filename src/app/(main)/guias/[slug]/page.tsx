import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { buildMetadata } from "@/lib/metadata";

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
    return buildMetadata({ title: "Guía no encontrada", noindex: true });
  }

  const { title, description } = guide.frontmatter;
  const isProvisional = guide.content.includes("contenido provisional") || guide.content.length < 500;

  return buildMetadata({
    title,
    description,
    path: `/guias/${resolvedParams.slug}`,
    noindex: isProvisional,
  });
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const guide = await getGuide(resolvedParams.slug);

  if (!guide) {
    notFound();
  }

  const { frontmatter, content } = guide;
  const guideUrl = `${siteConfig.url}/guias/${resolvedParams.slug}`;

  const graphItems: any[] = [
    {
      "@type": "Article",
      headline: frontmatter.title,
      description: frontmatter.description,
      datePublished: new Date(frontmatter.updatedAt).toISOString(),
      dateModified: new Date(frontmatter.updatedAt).toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": guideUrl,
      },
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
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: siteConfig.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Herramientas",
          item: `${siteConfig.url}/herramientas`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: frontmatter.title,
          item: guideUrl,
        },
      ],
    },
  ];

  if (Array.isArray(frontmatter.faqs) && frontmatter.faqs.length > 0) {
    graphItems.push({
      "@type": "FAQPage",
      mainEntity: frontmatter.faqs.map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": graphItems,
  };

  const mdxComponents = {
    a: ({ href, children, ...props }: any) => {
      if (href && href.startsWith("/")) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <Breadcrumbs
          items={[
            { label: "Herramientas", href: "/herramientas" },
            { label: frontmatter.title },
          ]}
        />

        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
            {frontmatter.title}
          </h1>
          <p className="text-sm text-foreground-muted">
            Actualizado el{" "}
            {new Date(frontmatter.updatedAt).toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <div className="prose prose-brand max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground-muted prose-p:leading-relaxed prose-a:text-brand prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-table:border prose-table:border-border prose-th:bg-surface-subtle prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-border">
          <MDXRemote source={content} components={mdxComponents} />
        </div>

        {frontmatter.relatedTool && (
          <div className="mt-16 pt-8 border-t border-slate-200">
            <div className="bg-purple-50/60 border border-purple-200/70 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {frontmatter.relatedToolTitle || "Poné en práctica esta guía"}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {frontmatter.relatedToolDescription ||
                    "Tenemos una herramienta específica para que no tengas que calcular todo a mano."}
                </p>
              </div>
              <Link
                href={frontmatter.relatedTool}
                className="shrink-0 w-full sm:w-auto rounded-xl bg-brand px-6 py-3 min-h-[44px] font-semibold text-white shadow-xs transition-all hover:bg-brand-hover active:bg-brand-active text-center flex items-center justify-center text-sm"
              >
                {frontmatter.relatedToolButton || "Ver herramienta"}
              </Link>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
