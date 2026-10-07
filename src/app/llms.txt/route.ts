import { faqs } from "@/lib/faqs";
import { site } from "@/lib/site";

// Plain-text summary for AI assistants and answer engines (llmstxt.org).
export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.description}

${site.name} is a senior software engineering team founded in ${site.foundingYear}, working with companies worldwide. Every project follows a four-stage process — Discover, Design, Build, Launch — and typically reaches production in about six weeks.

## Services

${site.services.map((s) => `- ${s.name}: ${s.description}`).join("\n")}

## FAQ

${faqs.map((f) => `- ${f.q} ${f.a}`).join("\n")}

## Contact

- Website: ${site.url}
- Email: ${site.email}
- Start a project: ${site.url}/#contact
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
