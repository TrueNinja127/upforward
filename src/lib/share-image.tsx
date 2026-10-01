import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { LOGO_H, LOGO_PATHS, LOGO_W } from "@/components/landing/logo-path";
import { site } from "@/lib/site";

/*
 * Link-preview thumbnail (Open Graph / Twitter), rendered at build time.
 * Black canvas, UF mark with contour echoes on the right, headline on the left.
 * Inter (OFL) is bundled from assets/fonts because SF Pro can't be embedded.
 */

export const shareImageSize = { width: 1200, height: 630 };
export const shareImageAlt = `${site.name} — ${site.tagline} Senior software engineering team for web, mobile and AI products.`;

const fontDir = join(process.cwd(), "assets/fonts");

function Mark({ width, fill = "white" }: { width: number; fill?: string }) {
  return (
    <svg width={width} height={(width * LOGO_H) / LOGO_W} viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}>
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} fill={fill} />
      ))}
    </svg>
  );
}

function Echoes({ width }: { width: number }) {
  const cx = LOGO_W / 2;
  const cy = LOGO_H / 2;
  const scales = [1, 1.45, 1.95, 2.55];
  const span = 2.7;
  const vbW = LOGO_W * span;
  const vbH = LOGO_H * span;
  return (
    <svg
      width={width}
      height={(width * vbH) / vbW}
      viewBox={`${cx - vbW / 2} ${cy - vbH / 2} ${vbW} ${vbH}`}
    >
      {scales.map((s, i) => (
        <g key={s} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
          {LOGO_PATHS.map((d, j) =>
            i === 0 ? (
              <path key={j} d={d} fill="white" />
            ) : (
              <path
                key={j}
                d={d}
                fill="none"
                stroke="white"
                strokeOpacity={0.22 - i * 0.05}
                strokeWidth={1.6 / s}
              />
            )
          )}
        </g>
      ))}
    </svg>
  );
}

export async function renderShareImage() {
  const [regular, semibold] = await Promise.all([
    readFile(join(fontDir, "inter-latin-400-normal.woff")),
    readFile(join(fontDir, "inter-latin-600-normal.woff")),
  ]);
  const host = new URL(site.url).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#000000",
          color: "white",
          fontFamily: "Inter",
          overflow: "hidden",
        }}
      >
        {/* Mark + echoes, bleeding off the right edge */}
        <div style={{ position: "absolute", right: -330, top: 70, display: "flex" }}>
          <Echoes width={1240} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: 760,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Mark width={72} />
            <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>{site.name}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 104, fontWeight: 600, letterSpacing: -4, lineHeight: 1 }}>
              {site.tagline}
            </span>
            <span
              style={{
                marginTop: 28,
                fontSize: 30,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.62)",
                maxWidth: 600,
              }}
            >
              Senior software engineering team for web, mobile and AI products.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                display: "flex",
                padding: "12px 26px",
                borderRadius: 999,
                background: "white",
                color: "black",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {host}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 24px",
                borderRadius: 999,
                background: "#0c0c0c",
                fontSize: 24,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "white" }} />
              Available for new projects
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...shareImageSize,
      fonts: [
        { name: "Inter", data: regular, style: "normal", weight: 400 },
        { name: "Inter", data: semibold, style: "normal", weight: 600 },
      ],
    }
  );
}
