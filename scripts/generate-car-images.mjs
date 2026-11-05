// Generates stylised car illustrations into public/images/cars/.
// These are original, license-free placeholders. To use real photos, upload your own
// via Admin -> Vehicles (Supabase Storage) or replace the files in public/images/cars/.
import { writeFileSync, mkdirSync } from "node:fs";
const out = "public/images/cars";
mkdirSync(out, { recursive: true });

const bodies = {
  sedan: "M95 300 C100 262 150 248 230 236 C290 188 360 170 460 170 C560 170 640 188 690 236 C770 244 820 262 828 300 L828 322 L95 322 Z",
  suv: "M90 300 C96 258 140 240 210 232 C250 168 330 150 470 150 C620 150 700 168 740 232 C810 242 836 262 840 300 L840 326 L90 326 Z",
  coupe: "M90 304 C100 270 170 258 260 244 C330 196 410 176 500 176 C600 176 680 206 720 244 C790 254 830 272 836 304 L836 322 L90 322 Z",
  van: "M90 300 C96 250 120 226 180 220 L260 150 C300 140 420 140 600 140 C700 140 760 160 780 224 C830 240 840 270 842 300 L842 328 L90 328 Z",
};
const cars = [
  ["aurelia-gt", "coupe", "#C9A96E", "#8a6d38"],
  ["meridian-s", "sedan", "#1d2b4a", "#0b1222"],
  ["vanguard-x", "suv", "#3a3f4a", "#15181f"],
  ["solstice-r", "coupe", "#9b1c2c", "#4a0b14"],
  ["nordic-e", "sedan", "#dfe3ea", "#9aa3b3"],
  ["terra-4x4", "suv", "#2f4a3a", "#122219"],
  ["capri-spider", "coupe", "#e0b04a", "#8a5f10"],
  ["atlas-van", "van", "#cfd5df", "#7d8798"],
  ["lumen-ev", "sedan", "#2a6f97", "#0f3047"],
  ["regent-l", "sedan", "#101827", "#000000"],
  ["horizon-suv", "suv", "#7a5c3a", "#33240f"],
  ["pulse-hatch", "sedan", "#c8553d", "#6b2415"],
];
for (const [slug, type, c1, c2] of cars) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 520" role="img" aria-label="${slug}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ecf2"/><stop offset="1" stop-color="#cfd5e0"/></linearGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#101827" stop-opacity=".35"/><stop offset="1" stop-color="#101827" stop-opacity="0"/></radialGradient>
</defs>
<rect width="920" height="520" fill="url(#bg)"/>
<rect y="372" width="920" height="148" fill="#dde1ea"/>
<ellipse cx="460" cy="352" rx="390" ry="26" fill="url(#sh)"/>
<path d="${bodies[type]}" fill="url(#body)"/>
<path d="M270 244 C330 200 400 188 470 188 L470 244 Z" fill="#101827" opacity=".78"/>
<path d="M486 188 C560 188 630 204 676 244 L486 244 Z" fill="#101827" opacity=".78"/>
<rect x="95" y="296" width="733" height="4" fill="#ffffff" opacity=".25"/>
<rect x="800" y="276" width="28" height="12" rx="4" fill="#fff7d6"/>
<rect x="95" y="276" width="22" height="12" rx="4" fill="#c4332f"/>
<g><circle cx="250" cy="322" r="52" fill="#0b0f18"/><circle cx="250" cy="322" r="30" fill="#aab2c0"/><circle cx="250" cy="322" r="10" fill="#0b0f18"/>
<circle cx="680" cy="322" r="52" fill="#0b0f18"/><circle cx="680" cy="322" r="30" fill="#aab2c0"/><circle cx="680" cy="322" r="10" fill="#0b0f18"/></g>
</svg>`;
  writeFileSync(`${out}/${slug}.svg`, svg);
  // second/third gallery frames: same car, different framing
  writeFileSync(`${out}/${slug}-2.svg`, svg.replace('viewBox="0 0 920 520"', 'viewBox="120 90 700 400"'));
  writeFileSync(`${out}/${slug}-3.svg`, svg.replace('viewBox="0 0 920 520"', 'viewBox="40 150 520 300"'));
}
// hero backdrop
writeFileSync("public/images/hero.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101827"/><stop offset="1" stop-color="#1c2a47"/></linearGradient>
<linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A96E" stop-opacity=".0"/><stop offset="1" stop-color="#C9A96E" stop-opacity=".18"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#g)"/><rect y="640" width="1600" height="260" fill="url(#r)"/>
<g stroke="#C9A96E" stroke-opacity=".12" fill="none"><path d="M-50 760 C400 700 900 720 1700 640"/><path d="M-50 800 C400 740 900 770 1700 700"/><path d="M-50 840 C400 790 900 820 1700 760"/></g>
<g transform="translate(560 330) scale(1.15)"><path d="${bodies.coupe}" fill="#C9A96E" opacity=".92"/>
<path d="M270 244 C330 200 400 188 470 188 L470 244 Z" fill="#101827" opacity=".85"/><path d="M486 188 C560 188 630 204 676 244 L486 244 Z" fill="#101827" opacity=".85"/>
<circle cx="250" cy="322" r="52" fill="#070a11"/><circle cx="250" cy="322" r="28" fill="#aab2c0"/><circle cx="680" cy="322" r="52" fill="#070a11"/><circle cx="680" cy="322" r="28" fill="#aab2c0"/></g></svg>`);
console.log("Generated", cars.length * 3, "car images + hero.svg");
