# upforward

Landing page for Upforward, built with Next.js (App Router), Tailwind CSS v4, and shadcn/ui.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

- `src/app/page.tsx` — composes the landing page sections
- `src/components/landing/` — header, hero, services, process, work, FAQ, CTA, footer
- `src/components/ui/` — shadcn/ui components
- `src/app/globals.css` — black & white theme tokens (`.dark`, applied on `<html>`)
