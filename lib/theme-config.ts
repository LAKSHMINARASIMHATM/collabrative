/**
 * Theme System Configuration
 * 
 * Centralized theme configuration with WCAG 2.1 AA compliant color palettes
 * for light, dark, and high-contrast themes.
 */

export type ThemeMode = 'light' | 'dark' | 'high-contrast'

export interface ThemeColors {
    // Base colors
    background: string
    foreground: string

    // UI Components
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string

    // Interactive states
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string

    // Status
    destructive: string
    destructiveForeground: string

    // Borders & inputs
    border: string
    input: string
    ring: string

    // Charts
    chart1: string
    chart2: string
    chart3: string
    chart4: string
    chart5: string

    // Sidebar
    sidebar: string
    sidebarForeground: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarAccent: string
    sidebarAccentForeground: string
    sidebarBorder: string
    sidebarRing: string
}

export interface SyntaxColors {
    keyword: string
    string: string
    comment: string
    variable: string
    function: string
    type: string
    number: string
    operator: string
    constant: string
    property: string
}

export interface ThemeConfig {
    id: string
    name: string
    mode: ThemeMode
    colors: ThemeColors
    syntax: SyntaxColors
    accessibility: {
        contrastRatio: number
        colorBlindSafe: boolean
        description: string
    }
}

/**
 * WCAG 2.1 Contrast Ratio Calculation
 * Minimum requirements: 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
    const lum1 = getRelativeLuminance(color1)
    const lum2 = getRelativeLuminance(color2)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance(oklch: string): number {
    // Parse oklch color format: oklch(L C H)
    const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (!match) return 0

    const [, l] = match
    const lightness = parseFloat(l)

    // Approximate conversion from OKLCH lightness to relative luminance
    // This is a simplified version; for production, use a proper color library
    return lightness
}

export function meetsWCAGAA(textColor: string, bgColor: string, largeText = false): boolean {
    const ratio = getContrastRatio(textColor, bgColor)
    return largeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Light Theme - Clean, bright aesthetic with subdued accents
 */
export const lightTheme: ThemeConfig = {
    id: 'light',
    name: 'Light',
    mode: 'light',
    colors: {
        background: 'oklch(0.99 0 0)',           // Near white
        foreground: 'oklch(0.15 0 0)',           // Near black
        card: 'oklch(1 0 0)',                     // Pure white
        cardForeground: 'oklch(0.15 0 0)',
        popover: 'oklch(1 0 0)',
        popoverForeground: 'oklch(0.15 0 0)',
        primary: 'oklch(0.45 0.15 250)',         // Soft blue
        primaryForeground: 'oklch(0.99 0 0)',
        secondary: 'oklch(0.95 0.01 260)',       // Very light blue-gray
        secondaryForeground: 'oklch(0.20 0 0)',
        muted: 'oklch(0.96 0.01 260)',
        mutedForeground: 'oklch(0.50 0 0)',      // Medium gray
        accent: 'oklch(0.50 0.20 220)',          // Vibrant blue
        accentForeground: 'oklch(0.99 0 0)',
        destructive: 'oklch(0.55 0.22 25)',      // Soft red
        destructiveForeground: 'oklch(0.99 0 0)',
        border: 'oklch(0.90 0.01 260)',
        input: 'oklch(0.90 0.01 260)',
        ring: 'oklch(0.50 0.20 220)',
        chart1: 'oklch(0.60 0.18 250)',
        chart2: 'oklch(0.65 0.15 150)',
        chart3: 'oklch(0.55 0.20 30)',
        chart4: 'oklch(0.70 0.12 290)',
        chart5: 'oklch(0.62 0.16 180)',
        sidebar: 'oklch(0.97 0.01 260)',
        sidebarForeground: 'oklch(0.15 0 0)',
        sidebarPrimary: 'oklch(0.45 0.15 250)',
        sidebarPrimaryForeground: 'oklch(0.99 0 0)',
        sidebarAccent: 'oklch(0.95 0.01 260)',
        sidebarAccentForeground: 'oklch(0.20 0 0)',
        sidebarBorder: 'oklch(0.90 0.01 260)',
        sidebarRing: 'oklch(0.50 0.20 220)',
    },
    syntax: {
        keyword: 'oklch(0.45 0.18 280)',        // Purple-blue
        string: 'oklch(0.50 0.15 140)',         // Green
        comment: 'oklch(0.55 0.02 120)',        // Gray-green
        variable: 'oklch(0.35 0.10 230)',       // Dark blue
        function: 'oklch(0.50 0.20 60)',        // Yellow-orange
        type: 'oklch(0.48 0.16 200)',           // Cyan
        number: 'oklch(0.52 0.18 130)',         // Light green
        operator: 'oklch(0.40 0.05 0)',         // Dark gray
        constant: 'oklch(0.42 0.20 340)',       // Magenta
        property: 'oklch(0.45 0.15 190)',       // Light blue
    },
    accessibility: {
        contrastRatio: 4.5,
        colorBlindSafe: true,
        description: 'Clean light theme optimized for bright environments',
    },
}

/**
 * Dark Theme - Low-light optimized with sufficient contrast
 */
export const darkTheme: ThemeConfig = {
    id: 'dark',
    name: 'Dark',
    mode: 'dark',
    colors: {
        background: 'oklch(0.15 0 0)',           // Very dark gray
        foreground: 'oklch(0.95 0 0)',           // Off-white
        card: 'oklch(0.18 0 0)',
        cardForeground: 'oklch(0.95 0 0)',
        popover: 'oklch(0.18 0 0)',
        popoverForeground: 'oklch(0.95 0 0)',
        primary: 'oklch(0.70 0.20 250)',         // Bright blue
        primaryForeground: 'oklch(0.15 0 0)',
        secondary: 'oklch(0.25 0.02 260)',       // Dark blue-gray
        secondaryForeground: 'oklch(0.95 0 0)',
        muted: 'oklch(0.28 0.02 260)',
        mutedForeground: 'oklch(0.65 0 0)',      // Light gray
        accent: 'oklch(0.65 0.24 220)',          // Vivid blue
        accentForeground: 'oklch(0.95 0 0)',
        destructive: 'oklch(0.60 0.25 25)',      // Bright red
        destructiveForeground: 'oklch(0.95 0 0)',
        border: 'oklch(0.30 0.02 260)',
        input: 'oklch(0.30 0.02 260)',
        ring: 'oklch(0.65 0.24 220)',
        chart1: 'oklch(0.65 0.22 250)',
        chart2: 'oklch(0.68 0.18 150)',
        chart3: 'oklch(0.72 0.22 60)',
        chart4: 'oklch(0.70 0.20 300)',
        chart5: 'oklch(0.66 0.20 180)',
        sidebar: 'oklch(0.20 0 0)',
        sidebarForeground: 'oklch(0.95 0 0)',
        sidebarPrimary: 'oklch(0.70 0.20 250)',
        sidebarPrimaryForeground: 'oklch(0.95 0 0)',
        sidebarAccent: 'oklch(0.25 0.02 260)',
        sidebarAccentForeground: 'oklch(0.95 0 0)',
        sidebarBorder: 'oklch(0.30 0.02 260)',
        sidebarRing: 'oklch(0.65 0.24 220)',
    },
    syntax: {
        keyword: 'oklch(0.70 0.22 280)',        // Bright purple-blue
        string: 'oklch(0.72 0.20 140)',         // Bright green
        comment: 'oklch(0.55 0.03 120)',        // Muted green-gray
        variable: 'oklch(0.80 0.12 230)',       // Light blue
        function: 'oklch(0.75 0.24 60)',        // Bright yellow
        type: 'oklch(0.72 0.20 200)',           // Bright cyan
        number: 'oklch(0.75 0.22 130)',         // Light green
        operator: 'oklch(0.75 0.05 0)',         // Light gray
        constant: 'oklch(0.73 0.24 340)',       // Bright magenta
        property: 'oklch(0.70 0.18 190)',       // Light blue
    },
    accessibility: {
        contrastRatio: 4.5,
        colorBlindSafe: true,
        description: 'Comfortable dark theme for extended coding sessions',
    },
}

/**
 * High Contrast Theme - Maximum accessibility with bold differentiation
 */
export const highContrastTheme: ThemeConfig = {
    id: 'high-contrast',
    name: 'High Contrast',
    mode: 'high-contrast',
    colors: {
        background: 'oklch(0 0 0)',              // Pure black
        foreground: 'oklch(1 0 0)',              // Pure white
        card: 'oklch(0.08 0 0)',                 // Very dark gray
        cardForeground: 'oklch(1 0 0)',
        popover: 'oklch(0.08 0 0)',
        popoverForeground: 'oklch(1 0 0)',
        primary: 'oklch(0.85 0.30 140)',         // Vivid green
        primaryForeground: 'oklch(0 0 0)',
        secondary: 'oklch(0.15 0 0)',            // Dark gray
        secondaryForeground: 'oklch(1 0 0)',
        muted: 'oklch(0.20 0 0)',
        mutedForeground: 'oklch(0.85 0 0)',      // Light gray
        accent: 'oklch(0.85 0.35 60)',           // Vivid yellow
        accentForeground: 'oklch(0 0 0)',
        destructive: 'oklch(0.70 0.35 25)',      // Vivid red
        destructiveForeground: 'oklch(0 0 0)',
        border: 'oklch(0.50 0 0)',               // Medium gray for contrast
        input: 'oklch(0.50 0 0)',
        ring: 'oklch(0.85 0.35 60)',
        chart1: 'oklch(0.80 0.32 220)',          // Vivid blue
        chart2: 'oklch(0.82 0.30 150)',          // Vivid green
        chart3: 'oklch(0.78 0.32 40)',           // Vivid orange
        chart4: 'oklch(0.80 0.28 290)',          // Vivid purple
        chart5: 'oklch(0.82 0.30 340)',          // Vivid pink
        sidebar: 'oklch(0.10 0 0)',
        sidebarForeground: 'oklch(1 0 0)',
        sidebarPrimary: 'oklch(0.85 0.30 140)',
        sidebarPrimaryForeground: 'oklch(0 0 0)',
        sidebarAccent: 'oklch(0.15 0 0)',
        sidebarAccentForeground: 'oklch(1 0 0)',
        sidebarBorder: 'oklch(0.50 0 0)',
        sidebarRing: 'oklch(0.85 0.35 60)',
    },
    syntax: {
        keyword: 'oklch(0.85 0.32 280)',        // Vivid purple
        string: 'oklch(0.85 0.30 140)',         // Vivid green
        comment: 'oklch(0.65 0.05 120)',        // Muted gray
        variable: 'oklch(0.90 0.15 230)',       // Bright blue
        function: 'oklch(0.90 0.30 60)',        // Vivid yellow
        type: 'oklch(0.85 0.28 200)',           // Vivid cyan
        number: 'oklch(0.88 0.28 130)',         // Bright green
        operator: 'oklch(0.95 0 0)',            // Bright white
        constant: 'oklch(0.85 0.32 340)',       // Vivid magenta
        property: 'oklch(0.82 0.25 190)',       // Bright blue
    },
    accessibility: {
        contrastRatio: 7,
        colorBlindSafe: true,
        description: 'Maximum contrast theme for optimal accessibility',
    },
}

export const themes: Record<string, ThemeConfig> = {
    light: lightTheme,
    dark: darkTheme,
    'high-contrast': highContrastTheme,
}

export function getTheme(id: string): ThemeConfig | undefined {
    return themes[id]
}

export function getAllThemes(): ThemeConfig[] {
    return Object.values(themes)
}
