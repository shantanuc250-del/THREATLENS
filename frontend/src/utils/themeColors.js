/**
 * ThreatLens locked Dark Cyber-Defense SOC palette.
 * Hardcoded to deep cyber-defense values (#070b14, #0d1628, #1a263e, #38bdf8, #2563eb).
 */
export default function themeColors() {
  return {
    isDark: true,
    // Base backgrounds
    appBg:            '#070b14',
    cardBg:           '#0d1628',
    cardBgGlass:      'rgba(13, 22, 40, 0.88)',
    cardBgAlt:        '#111827',
    surfaceBg:        '#070b14',
    inputBg:          '#060a12',
    barTrack:         '#16233b',

    // Borders
    border:           '#1a263e',
    borderLight:      '#141f33',
    borderStrong:     '#233555',
    borderFocus:      '#3b82f6',

    // Text
    textPrimary:      '#f8fafc',
    textBody:         '#cbd5e1',
    textSecondary:    '#94a3b8',
    textMuted:        '#64748b',
    textFaint:        '#475569',

    // Accent colors
    accentCyan:       '#38bdf8',
    accentBlue:       '#06b6d4',
    brand:            '#2563eb',
    brandHover:       '#1d4ed8',

    // Interactive element backgrounds
    btnSecondaryBg:   '#16233b',
    btnSecondaryText: '#94a3b8',
    btnSecondaryBorder: '#233555',
    btnPrimaryBg:     '#2563eb',

    // Table / row dividers
    rowDivider:       '#141f33',
    tableHeaderBg:    '#141f33',

    // Status badge backgrounds (semi-transparent)
    dangerBgSoft:     'rgba(239, 68, 68, 0.16)',
    warnBgSoft:       'rgba(245, 158, 11, 0.16)',
    okBgSoft:         'rgba(16, 185, 129, 0.18)',
    infoBgSoft:       'rgba(56, 189, 248, 0.16)',

    // Strong label text in cards
    strongText:       '#cbd5e1',

    // Box shadows
    shadowSm:         '0 1px 3px rgba(0,0,0,0.4)',
    shadowCard:       '0 4px 20px -2px rgba(0,0,0,0.5)',

    // Transition string
    transition:       'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease, box-shadow 0.3s ease',
  };
}
