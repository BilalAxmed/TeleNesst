import { ThemeOption, CustomThemePalette } from '../types';

export const THEMES: ThemeOption[] = [
  {
    id: 'theme-blue',
    name: 'White / Blue Crisp Light (Default)',
    description: 'Clean enterprise white backdrop with deep corporate sapphire blue indicators and crisp readability.',
    isDark: false,
    accentColor: '#2563eb',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    previewText: '#0f172a',
  },
  {
    id: 'theme-obsidian',
    name: 'Obsidian Slate',
    description: 'Precision dark workspace with deep slate surfaces and subtle borders.',
    isDark: true,
    accentColor: '#3b82f6',
    previewBg: '#0f1117',
    previewCard: '#1a1d26',
    previewText: '#f8fafc',
  },
  {
    id: 'theme-green',
    name: 'White / Green',
    description: 'Crisp light layout paired with emerald telecom green accents for active network deployment logs.',
    isDark: false,
    accentColor: '#059669',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    previewText: '#0f172a',
  },
  {
    id: 'theme-monochrome',
    name: 'White / Black',
    description: 'High-contrast architectural monochrome theme with pitch-black typography and clean borders.',
    isDark: false,
    accentColor: '#09090b',
    previewBg: '#ffffff',
    previewCard: '#fafafa',
    previewText: '#09090b',
  },
  {
    id: 'theme-orange',
    name: 'White / Orange',
    description: 'Industrial telecom engineering palette with vibrant safety orange markers and warm accents.',
    isDark: false,
    accentColor: '#ea580c',
    previewBg: '#fafaf9',
    previewCard: '#ffffff',
    previewText: '#1c1917',
  },
];

export const DEFAULT_CUSTOM_PALETTE: CustomThemePalette = {
  name: 'Midnight Cyber Teal',
  isDark: true,
  bgMain: '#090d16',
  bgSurface: '#0f1624',
  bgCard: '#151f32',
  bgInput: '#0d1320',
  bgHover: '#1c2840',
  textMain: '#f1f5f9',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  borderMain: '#1e2d47',
  borderLight: '#283b5c',
  accent: '#06b6d4',
  accentHover: '#0891b2',
  accentGlow: 'rgba(6, 182, 212, 0.2)',
};

export interface CustomColorTemplate {
  name: string;
  description: string;
  palette: CustomThemePalette;
}

export const CUSTOM_PRESET_TEMPLATES: CustomColorTemplate[] = [
  {
    name: 'Midnight Cyber Teal',
    description: 'Deep navy-tinted obsidian with vivid electric cyan accents and sleek borders.',
    palette: {
      name: 'Midnight Cyber Teal',
      isDark: true,
      bgMain: '#090d16',
      bgSurface: '#0f1624',
      bgCard: '#151f32',
      bgInput: '#0d1320',
      bgHover: '#1c2840',
      textMain: '#f1f5f9',
      textMuted: '#94a3b8',
      textDim: '#64748b',
      borderMain: '#1e2d47',
      borderLight: '#283b5c',
      accent: '#06b6d4',
      accentHover: '#0891b2',
      accentGlow: 'rgba(6, 182, 212, 0.2)',
    },
  },
  {
    name: 'Royal Purple & Indigo',
    description: 'Executive dark violet workspace with luminous amethyst accents.',
    palette: {
      name: 'Royal Purple & Indigo',
      isDark: true,
      bgMain: '#0d0b18',
      bgSurface: '#141224',
      bgCard: '#1d1933',
      bgInput: '#100e1f',
      bgHover: '#272244',
      textMain: '#f8fafc',
      textMuted: '#a78bfa',
      textDim: '#7c3aed',
      borderMain: '#2e2652',
      borderLight: '#3d336b',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      accentGlow: 'rgba(139, 92, 246, 0.25)',
    },
  },
  {
    name: 'Emerald Forest Tactical',
    description: 'Stealth dark green military/tactical telecom palette with lime-mint accents.',
    palette: {
      name: 'Emerald Forest Tactical',
      isDark: true,
      bgMain: '#07120d',
      bgSurface: '#0c1b14',
      bgCard: '#13281e',
      bgInput: '#091610',
      bgHover: '#1a3729',
      textMain: '#ecfdf5',
      textMuted: '#a7f3d0',
      textDim: '#34d399',
      borderMain: '#1c4230',
      borderLight: '#26573f',
      accent: '#10b981',
      accentHover: '#059669',
      accentGlow: 'rgba(16, 185, 129, 0.2)',
    },
  },
  {
    name: 'Solar Amber Industrial',
    description: 'Deep carbon charcoal with high-visibility hazard amber accents.',
    palette: {
      name: 'Solar Amber Industrial',
      isDark: true,
      bgMain: '#121110',
      bgSurface: '#1a1816',
      bgCard: '#24211d',
      bgInput: '#161412',
      bgHover: '#332e29',
      textMain: '#fef3c7',
      textMuted: '#d97706',
      textDim: '#92400e',
      borderMain: '#3d362c',
      borderLight: '#52493b',
      accent: '#f59e0b',
      accentHover: '#d97706',
      accentGlow: 'rgba(245, 158, 11, 0.22)',
    },
  },
  {
    name: 'Crimson Ops Dark',
    description: 'Dark graphite chassis punctuated by intense crimson ruby beacons.',
    palette: {
      name: 'Crimson Ops Dark',
      isDark: true,
      bgMain: '#120b0d',
      bgSurface: '#1a1013',
      bgCard: '#24161b',
      bgInput: '#140c0f',
      bgHover: '#351f26',
      textMain: '#fff1f2',
      textMuted: '#fda4af',
      textDim: '#9f1239',
      borderMain: '#43222d',
      borderLight: '#5a2d3b',
      accent: '#f43f5e',
      accentHover: '#e11d48',
      accentGlow: 'rgba(244, 63, 94, 0.22)',
    },
  },
  {
    name: 'Nordic Snow & Cobalt',
    description: 'Pristine arctic cool-white layout with high-contrast royal cobalt markers.',
    palette: {
      name: 'Nordic Snow & Cobalt',
      isDark: false,
      bgMain: '#f4f6fb',
      bgSurface: '#ffffff',
      bgCard: '#ffffff',
      bgInput: '#edf2f7',
      bgHover: '#e2e8f0',
      textMain: '#0f172a',
      textMuted: '#334155',
      textDim: '#64748b',
      borderMain: '#cbd5e1',
      borderLight: '#e2e8f0',
      accent: '#1d4ed8',
      accentHover: '#1e40af',
      accentGlow: 'rgba(29, 78, 216, 0.15)',
    },
  },
  {
    name: 'Travertine & Warm Slate',
    description: 'Warm architectural light tone with natural stone hues and bronze accents.',
    palette: {
      name: 'Travertine & Warm Slate',
      isDark: false,
      bgMain: '#faf7f2',
      bgSurface: '#ffffff',
      bgCard: '#ffffff',
      bgInput: '#f5efe6',
      bgHover: '#ece3d6',
      textMain: '#292524',
      textMuted: '#57534e',
      textDim: '#78716c',
      borderMain: '#d6cec2',
      borderLight: '#e7e2d8',
      accent: '#d97706',
      accentHover: '#b45309',
      accentGlow: 'rgba(217, 119, 6, 0.15)',
    },
  },
];

/**
 * Apply custom theme palette CSS variables to the document
 */
export function applyCustomThemeVariables(palette: CustomThemePalette) {
  if (typeof document === 'undefined' || !palette) return;
  const root = document.documentElement;
  root.setAttribute('data-theme', 'theme-custom');
  root.style.setProperty('--bg-main', palette.bgMain || '#0c0e12');
  root.style.setProperty('--bg-surface', palette.bgSurface || '#13161d');
  root.style.setProperty('--bg-card', palette.bgCard || '#1a1d27');
  root.style.setProperty('--bg-input', palette.bgInput || '#11131a');
  root.style.setProperty('--bg-hover', palette.bgHover || '#232735');
  root.style.setProperty('--text-main', palette.textMain || '#f8fafc');
  root.style.setProperty('--text-muted', palette.textMuted || '#94a3b8');
  root.style.setProperty('--text-dim', palette.textDim || '#64748b');
  root.style.setProperty('--border-main', palette.borderMain || '#262b3a');
  root.style.setProperty('--border-light', palette.borderLight || '#32384c');
  root.style.setProperty('--accent', palette.accent || '#3b82f6');
  root.style.setProperty('--accent-hover', palette.accentHover || '#2563eb');
  root.style.setProperty('--accent-glow', palette.accentGlow || `${palette.accent || '#3b82f6'}33`);
}

/**
 * Remove custom inline styles when switching back to preset themes
 */
export function clearCustomThemeVariables() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const vars = [
    '--bg-main',
    '--bg-surface',
    '--bg-card',
    '--bg-input',
    '--bg-hover',
    '--text-main',
    '--text-muted',
    '--text-dim',
    '--border-main',
    '--border-light',
    '--accent',
    '--accent-hover',
    '--accent-glow',
  ];
  vars.forEach((v) => root.style.removeProperty(v));
}
