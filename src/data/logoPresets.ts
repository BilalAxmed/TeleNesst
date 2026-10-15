export interface OnlineLogoPreset {
  id: string;
  name: string;
  category: 'Telecom & 5G' | 'Fiber Optics' | 'Servers & Cloud' | 'Modern & Abstract' | 'Corporate Shield';
  description: string;
  url: string;
  sourceType: 'vector-svg' | 'online-cdn';
  badgeColor: string;
}

export const ONLINE_LOGO_PRESETS: OnlineLogoPreset[] = [
  // 1. TeleNest Quantum Core
  {
    id: 'telenest-quantum-core',
    name: 'TeleNest Quantum Core',
    category: 'Telecom & 5G',
    description: 'Hexagonal telecom mesh lattice with central optical node',
    sourceType: 'vector-svg',
    badgeColor: '#38bdf8',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230f172a"/><polygon points="50,15 85,35 85,75 50,95 15,75 15,35" stroke="%2338bdf8" stroke-width="4" fill="none"/><polygon points="50,28 73,42 73,68 50,82 27,68 27,42" stroke="%23818cf8" stroke-width="3" fill="%231e1b4b" fill-opacity="0.6"/><circle cx="50" cy="55" r="10" fill="%2338bdf8"/><path d="M50 15v20M50 75v20M15 35l18 10M85 35l-18 10M15 75l18-10M85 75l-18-10" stroke="%2338bdf8" stroke-width="2.5"/><circle cx="50" cy="15" r="4" fill="%2338bdf8"/><circle cx="85" cy="35" r="4" fill="%23818cf8"/><circle cx="85" cy="75" r="4" fill="%2338bdf8"/><circle cx="50" cy="95" r="4" fill="%23818cf8"/><circle cx="15" cy="75" r="4" fill="%2338bdf8"/><circle cx="15" cy="35" r="4" fill="%23818cf8"/></svg>`,
  },
  // 2. Fiber Optical Laser Pulse
  {
    id: 'fiber-laser-pulse',
    name: 'Fiber Laser Optic Pulse',
    category: 'Fiber Optics',
    description: 'Precision emerald laser fusion and strand distribution node',
    sourceType: 'vector-svg',
    badgeColor: '#10b981',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23022c22"/><circle cx="50" cy="50" r="38" stroke="%2310b981" stroke-width="3" stroke-dasharray="6 4"/><circle cx="50" cy="50" r="24" fill="%23065f46" stroke="%2334d399" stroke-width="2.5"/><path d="M20 50h60M50 20v60" stroke="%23a7f3d0" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="%2334d399"/><path d="M30 30l40 40M30 70l40-40" stroke="%2310b981" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="%23ffffff"/></svg>`,
  },
  // 3. Cellular 5G Tower & Broadcast Waves
  {
    id: 'telecom-5g-tower',
    name: '5G Broadcast Tower',
    category: 'Telecom & 5G',
    description: 'Tower transmitter mast radiating multi-gigabit wireless waves',
    sourceType: 'vector-svg',
    badgeColor: '#f59e0b',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%231e1b4b"/><path d="M50 22v56M35 78l15-56 15 56M38 62h24M42 46h16" stroke="%23f59e0b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="22" r="5" fill="%23f59e0b"/><path d="M32 20a22 22 0 0 1 0-14M68 20a22 22 0 0 0 0-14M24 20a32 32 0 0 1 0-22M76 20a32 32 0 0 0 0-22" stroke="%23fbbf24" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  // 4. Datacenter High-Speed Rack
  {
    id: 'datacenter-core-rack',
    name: 'Carrier Datacenter Rack',
    category: 'Servers & Cloud',
    description: 'Modular server chassis with optical telemetry indicators',
    sourceType: 'vector-svg',
    badgeColor: '#60a5fa',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230f172a"/><rect x="22" y="18" width="56" height="18" rx="4" fill="%231e293b" stroke="%2360a5fa" stroke-width="2.5"/><circle cx="32" cy="27" r="3" fill="%2322c55e"/><circle cx="40" cy="27" r="3" fill="%2338bdf8"/><line x1="52" y1="27" x2="70" y2="27" stroke="%2364748b" stroke-width="2"/><rect x="22" y="41" width="56" height="18" rx="4" fill="%231e293b" stroke="%23818cf8" stroke-width="2.5"/><circle cx="32" cy="50" r="3" fill="%2322c55e"/><circle cx="40" cy="50" r="3" fill="%23818cf8"/><line x1="52" y1="50" x2="70" y2="50" stroke="%2364748b" stroke-width="2"/><rect x="22" y="64" width="56" height="18" rx="4" fill="%231e293b" stroke="%23c084fc" stroke-width="2.5"/><circle cx="32" cy="73" r="3" fill="%2322c55e"/><circle cx="40" cy="73" r="3" fill="%23e879f9"/><line x1="52" y1="73" x2="70" y2="73" stroke="%2364748b" stroke-width="2"/></svg>`,
  },
  // 5. Global Telecom Satellite Orbit
  {
    id: 'satellite-telecom-orbit',
    name: 'Satellite Orbital Comms',
    category: 'Telecom & 5G',
    description: 'Low-Earth-orbit constellation link around planetary sphere',
    sourceType: 'vector-svg',
    badgeColor: '#0284c7',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23082f49"/><circle cx="50" cy="50" r="26" fill="%230284c7" stroke="%2338bdf8" stroke-width="3"/><ellipse cx="50" cy="50" rx="42" ry="16" stroke="%237dd3fc" stroke-width="2.5" stroke-dasharray="6 3" transform="rotate(-25 50 50)"/><circle cx="78" cy="34" r="6" fill="%2338bdf8" stroke="%23ffffff" stroke-width="2"/><circle cx="50" cy="50" r="16" fill="%230369a1"/></svg>`,
  },
  // 6. Enterprise Cyber Shield
  {
    id: 'enterprise-cyber-shield',
    name: 'Telecom Cyber Shield',
    category: 'Corporate Shield',
    description: 'Hardened perimeter security crest for ICT enterprise',
    sourceType: 'vector-svg',
    badgeColor: '#22d3ee',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%2318181b"/><path d="M50 14L80 26V52C80 72 50 86 50 86C50 86 20 72 20 52V26L50 14Z" fill="%2327272a" stroke="%2322d3ee" stroke-width="3.5"/><path d="M50 24L72 33V52C72 67 50 78 50 78C50 78 28 67 28 52V33L50 24Z" fill="%230891b2" fill-opacity="0.3"/><circle cx="50" cy="48" r="8" fill="%2322d3ee"/><path d="M50 36v8M50 52v8M42 48h16" stroke="%23ffffff" stroke-width="2"/></svg>`,
  },
  // 7. Parabolic Microwave Dish
  {
    id: 'microwave-parabolic-dish',
    name: 'Microwave Backhaul Dish',
    category: 'Telecom & 5G',
    description: 'High-gain line-of-sight microwave dish transceiver',
    sourceType: 'vector-svg',
    badgeColor: '#3b82f6',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23172554"/><path d="M22 62C22 38 42 22 66 22" stroke="%233b82f6" stroke-width="5" stroke-linecap="round"/><line x1="38" y1="46" x2="68" y2="76" stroke="%2393c5fd" stroke-width="4" stroke-linecap="round"/><circle cx="68" cy="76" r="6" fill="%2360a5fa"/><path d="M60 22A30 30 0 0 1 82 44" stroke="%2360a5fa" stroke-width="3" stroke-linecap="round"/><path d="M72 22A42 42 0 0 1 92 42" stroke="%2393c5fd" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  // 8. Infinity Optical Loop
  {
    id: 'infinity-fiber-loop',
    name: 'Infinity Optical Ribbon',
    category: 'Modern & Abstract',
    description: 'Continuous ultra-low latency fiber optic loop emblem',
    sourceType: 'vector-svg',
    badgeColor: '#ec4899',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23311042"/><path d="M30 50c0-9 8-16 18-16s16 16 22 16 12-7 12-16-8-16-18-16-16 16-22 16-12-7-12-16z" stroke="%23ec4899" stroke-width="4" fill="none"/><circle cx="50" cy="50" r="5" fill="%23f43f5e"/><circle cx="30" cy="50" r="4" fill="%23a855f7"/><circle cx="70" cy="50" r="4" fill="%23ec4899"/></svg>`,
  },
  // 9. Cyber Green Matrix Node
  {
    id: 'cyber-green-matrix',
    name: 'Cyber Matrix Switch Node',
    category: 'Fiber Optics',
    description: 'High-density fiber optic cross-connect switch node',
    sourceType: 'vector-svg',
    badgeColor: '#22c55e',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23052e16"/><rect x="25" y="25" width="50" height="50" rx="8" stroke="%2322c55e" stroke-width="3" fill="%2314532d" fill-opacity="0.5"/><circle cx="50" cy="50" r="12" fill="%2322c55e"/><path d="M50 15v10M50 75v10M15 50h10M75 50h10" stroke="%2386efac" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  // 10. Golden Enterprise Crown Crest
  {
    id: 'golden-telecom-crest',
    name: 'Executive Telecom Crest',
    category: 'Corporate Shield',
    description: 'Gold-embossed prestige seal for tier-1 network carriers',
    sourceType: 'vector-svg',
    badgeColor: '#eab308',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%231c1917"/><circle cx="50" cy="50" r="34" stroke="%23eab308" stroke-width="3.5"/><polygon points="50,22 58,38 76,41 63,54 66,72 50,63 34,72 37,54 24,41 42,38" fill="%23ca8a04" stroke="%23fde047" stroke-width="2"/></svg>`,
  },
  // 11. Cloud Carrier Edge Gateway
  {
    id: 'cloud-carrier-edge',
    name: 'Cloud Carrier Gateway',
    category: 'Servers & Cloud',
    description: 'SD-WAN & cloud interconnection ingress hub',
    sourceType: 'vector-svg',
    badgeColor: '#38bdf8',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230c4a6e"/><path d="M30 65h42a18 18 0 0 0 0-36 24 24 0 0 0-46-6A16 16 0 0 0 30 65z" fill="%230284c7" stroke="%2338bdf8" stroke-width="3"/><path d="M50 42v18M42 52l8 8 8-8" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  // 12. Apex Modern Delta
  {
    id: 'apex-modern-delta',
    name: 'Apex Telecom Delta',
    category: 'Modern & Abstract',
    description: 'Triangular optical prism with dual refractive laser streams',
    sourceType: 'vector-svg',
    badgeColor: '#a855f7',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%232e1065"/><polygon points="50,18 84,78 16,78" stroke="%23a855f7" stroke-width="3.5" fill="%233b0764"/><polygon points="50,34 72,72 28,72" fill="%237e22ce" stroke="%23c084fc" stroke-width="2"/><circle cx="50" cy="54" r="6" fill="%23ffffff"/></svg>`,
  },
  // 13. Curated Online CDN Preset: Wikimedia Telecom Satellite
  {
    id: 'online-satellite-comm',
    name: 'Satellite Communication Dish',
    category: 'Telecom & 5G',
    description: 'Global telecommunication ground station array',
    sourceType: 'online-cdn',
    badgeColor: '#0284c7',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop&q=80',
  },
  // 14. Curated Online CDN Preset: Fiber Grid
  {
    id: 'online-fiber-grid',
    name: 'Optic Fiber Glow Matrix',
    category: 'Fiber Optics',
    description: 'Ultra-dense multi-core optical glass bundle',
    sourceType: 'online-cdn',
    badgeColor: '#38bdf8',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=200&auto=format&fit=crop&q=80',
  },
  // 15. Curated Online CDN Preset: High-Tech Microchip
  {
    id: 'online-microchip-core',
    name: 'Silicon Routing ASIC',
    category: 'Servers & Cloud',
    description: 'Silicon optical packet processing accelerator',
    sourceType: 'online-cdn',
    badgeColor: '#6366f1',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80',
  },
  // 16. Curated Online CDN Preset: Server Vault
  {
    id: 'online-server-vault',
    name: 'Cyber Telecom Server Vault',
    category: 'Servers & Cloud',
    description: 'Enterprise carrier hotel colocation infrastructure',
    sourceType: 'online-cdn',
    badgeColor: '#10b981',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&auto=format&fit=crop&q=80',
  },
];
