export const site = {
  name: "Kiln",
  tagline: "A live shader editor for mobile video effects and transitions",
  // Vercel's production domain (custom domain if one is set) wins, so links never point at a guessed URL.
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  repo: "https://github.com/muhammadhassan2/Kiln",
  releases: "https://github.com/muhammadhassan2/Kiln/releases/latest",
};

export const nav = [
  { href: "/features", label: "Features" },
  { href: "/guide", label: "Guide" },
  { href: "/changelog", label: "Changelog" },
];
