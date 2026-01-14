/**
 * Theme System Tests
 * 
 * Comprehensive test suite for the IDE theme system
 */

import { describe, test, expect } from '@jest/globals'
import {
    getTheme,
    getAllThemes,
    getContrastRatio,
    meetsWCAGAA,
    lightTheme,
    darkTheme,
    highContrastTheme,
} from '@/lib/theme-config'

describe('Theme Configuration', () => {
    describe('Theme Retrieval', () => {
        test('getTheme returns correct theme for valid ID', () => {
            const theme = getTheme('light')
            expect(theme).toBeDefined()
            expect(theme?.id).toBe('light')
            expect(theme?.name).toBe('Light')
        })

        test('getTheme returns undefined for invalid ID', () => {
            const theme = getTheme('invalid-theme')
            expect(theme).toBeUndefined()
        })

        test('getAllThemes returns all three themes', () => {
            const themes = getAllThemes()
            expect(themes).toHaveLength(3)
            expect(themes.map(t => t.id)).toContain('light')
            expect(themes.map(t => t.id)).toContain('dark')
            expect(themes.map(t => t.id)).toContain('high-contrast')
        })
    })

    describe('WCAG Compliance', () => {
        test('light theme meets WCAG AA minimum contrast', () => {
            expect(lightTheme.accessibility.contrastRatio).toBeGreaterThanOrEqual(4.5)
        })

        test('dark theme meets WCAG AA minimum contrast', () => {
            expect(darkTheme.accessibility.contrastRatio).toBeGreaterThanOrEqual(4.5)
        })

        test('high-contrast theme exceeds WCAG AA (meets AAA)', () => {
            expect(highContrastTheme.accessibility.contrastRatio).toBeGreaterThanOrEqual(7)
        })

        test('all themes are marked as color-blind safe', () => {
            getAllThemes().forEach(theme => {
                expect(theme.accessibility.colorBlindSafe).toBe(true)
            })
        })
    })

    describe('Color Contrast Calculations', () => {
        test('pure black on white has maximum contrast', () => {
            const ratio = getContrastRatio('oklch(0 0 0)', 'oklch(1 0 0)')
            expect(ratio).toBeGreaterThan(20) // Should be 21:1
        })

        test('same color has minimum contrast', () => {
            const ratio = getContrastRatio('oklch(0.5 0 0)', 'oklch(0.5 0 0)')
            expect(ratio).toBe(1)
        })

        test('meetsWCAGAA correctly validates normal text', () => {
            // Good contrast
            expect(meetsWCAGAA('oklch(0 0 0)', 'oklch(1 0 0)', false)).toBe(true)

            // Poor contrast
            expect(meetsWCAGAA('oklch(0.5 0 0)', 'oklch(0.6 0 0)', false)).toBe(false)
        })

        test('meetsWCAGAA correctly validates large text', () => {
            // Large text has lower requirement (3:1 vs 4.5:1)
            // This would fail for normal text but pass for large text
            const result = meetsWCAGAA('oklch(0.4 0 0)', 'oklch(0.7 0 0)', true)
            expect(result).toBe(true)
        })
    })

    describe('Theme Structure', () => {
        test('all themes have required color properties', () => {
            getAllThemes().forEach(theme => {
                expect(theme.colors.background).toBeDefined()
                expect(theme.colors.foreground).toBeDefined()
                expect(theme.colors.primary).toBeDefined()
                expect(theme.colors.accent).toBeDefined()
                expect(theme.colors.border).toBeDefined()
            })
        })

        test('all themes have syntax highlighting colors', () => {
            getAllThemes().forEach(theme => {
                expect(theme.syntax.keyword).toBeDefined()
                expect(theme.syntax.string).toBeDefined()
                expect(theme.syntax.comment).toBeDefined()
                expect(theme.syntax.function).toBeDefined()
                expect(theme.syntax.type).toBeDefined()
            })
        })

        test('theme mode matches theme ID', () => {
            expect(lightTheme.mode).toBe('light')
            expect(darkTheme.mode).toBe('dark')
            expect(highContrastTheme.mode).toBe('high-contrast')
        })
    })

    describe('Color Palette Consistency', () => {
        test('light theme uses light backgrounds', () => {
            // Background should be brighter than foreground
            const bgLightness = parseFloat(lightTheme.colors.background.match(/oklch\(([\d.]+)/)?.[1] || '0')
            const fgLightness = parseFloat(lightTheme.colors.foreground.match(/oklch\(([\d.]+)/)?.[1] || '0')
            expect(bgLightness).toBeGreaterThan(fgLightness)
        })

        test('dark theme uses dark backgrounds', () => {
            // Background should be darker than foreground
            const bgLightness = parseFloat(darkTheme.colors.background.match(/oklch\(([\d.]+)/)?.[1] || '0')
            const fgLightness = parseFloat(darkTheme.colors.foreground.match(/oklch\(([\d.]+)/)?.[1] || '0')
            expect(bgLightness).toBeLessThan(fgLightness)
        })

        test('high-contrast theme uses extreme values', () => {
            // Background should be pure black (0)
            const bgLightness = parseFloat(highContrastTheme.colors.background.match(/oklch\(([\d.]+)/)?.[1] || '1')
            expect(bgLightness).toBe(0)

            // Foreground should be pure white (1)
            const fgLightness = parseFloat(highContrastTheme.colors.foreground.match(/oklch\(([\d.]+)/)?.[1] || '0')
            expect(fgLightness).toBe(1)
        })
    })
})

describe('Monaco Theme Integration', () => {
    test('Monaco themes are defined for all IDE themes', () => {
        const { monacoLightTheme, monacoDarkTheme, monacoHighContrastTheme } = require('@/lib/monaco-themes')

        expect(monacoLightTheme).toBeDefined()
        expect(monacoDarkTheme).toBeDefined()
        expect(monacoHighContrastTheme).toBeDefined()
    })

    test('Monaco themes have required properties', () => {
        const { monacoLightTheme } = require('@/lib/monaco-themes')

        expect(monacoLightTheme.base).toBeDefined()
        expect(monacoLightTheme.rules).toBeDefined()
        expect(monacoLightTheme.colors).toBeDefined()
        expect(Array.isArray(monacoLightTheme.rules)).toBe(true)
    })
})

/**
 * Accessibility Testing Utilities
 * 
 * Use these in manual testing or integration with axe-core
 */
export const accessibilityChecks = {
    /**
     * Check all text/background combinations meet WCAG AA
     */
    checkAllContrasts: (theme: typeof lightTheme) => {
        const combinations = [
            { text: theme.colors.foreground, bg: theme.colors.background, name: 'foreground/background' },
            { text: theme.colors.primaryForeground, bg: theme.colors.primary, name: 'primary' },
            { text: theme.colors.secondaryForeground, bg: theme.colors.secondary, name: 'secondary' },
            { text: theme.colors.accentForeground, bg: theme.colors.accent, name: 'accent' },
            { text: theme.colors.destructiveForeground, bg: theme.colors.destructive, name: 'destructive' },
        ]

        const results = combinations.map(({ text, bg, name }) => ({
            name,
            ratio: getContrastRatio(text, bg),
            passes: meetsWCAGAA(text, bg, false),
        }))

        return results
    },

    /**
     * Generate accessibility report for a theme
     */
    generateReport: (theme: typeof lightTheme) => {
        const contrasts = accessibilityChecks.checkAllContrasts(theme)
        const allPass = contrasts.every(c => c.passes)

        return {
            themeName: theme.name,
            overallRating: theme.accessibility.contrastRatio,
            wcagAACompliant: theme.accessibility.contrastRatio >= 4.5,
            wcagAAACompliant: theme.accessibility.contrastRatio >= 7,
            colorBlindSafe: theme.accessibility.colorBlindSafe,
            allContrastsPass: allPass,
            details: contrasts,
        }
    },
}

/**
 * Example usage for manual testing:
 * 
 * import { accessibilityChecks } from '@/lib/theme-config.test'
 * import { lightTheme } from '@/lib/theme-config'
 * 
 * const report = accessibilityChecks.generateReport(lightTheme)
 * console.log(report)
 */
