const PALETTES = [
  ['#0f2b46', '#2b6cb0'],
  ['#134e4a', '#2c7a7b'],
  ['#3b2f63', '#6b46c1'],
  ['#4a2c1f', '#b7791f'],
  ['#1f3a3d', '#319795'],
  ['#42203c', '#9b2c6f'],
]

const encode = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

function houseSvg(accent, wash) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${wash}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <g fill="none" stroke="rgba(255,255,255,.30)" stroke-width="3">
    <path d="M240 300 L400 165 L560 300"/>
    <path d="M285 275 V420 H515 V275"/>
    <rect x="350" y="330" width="100" height="90" fill="rgba(255,255,255,.14)"/>
    <rect x="315" y="300" width="42" height="42" fill="rgba(255,255,255,.14)"/>
    <rect x="443" y="300" width="42" height="42" fill="rgba(255,255,255,.14)"/>
  </g>
  <rect y="420" width="800" height="80" fill="rgba(0,0,0,.16)"/>
</svg>`
}

export function placeholderFor(seed = 0) {
  const [accent, wash] = PALETTES[Math.abs(seed) % PALETTES.length]
  return encode(houseSvg(accent, wash))
}

export const FALLBACK_IMAGE = encode(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#e2e8f0"/>
  <g fill="none" stroke="#94a3b8" stroke-width="4">
    <path d="M300 280 L400 195 L500 280"/>
    <path d="M330 265 V370 H470 V265"/>
  </g>
  <text x="400" y="425" font-family="system-ui,sans-serif" font-size="26" fill="#64748b" text-anchor="middle">Image unavailable</text>
</svg>`,
)