"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Download,
    Upload,
    RotateCcw,
    Search,
    Palette,
    Type,
    Code,
    Settings as SettingsIcon,
    Sun,
    Moon,
    Contrast,
} from "lucide-react"

interface AdvancedSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fontSize: number
    onFontSizeChange: (size: number) => void
}

export function AdvancedSettingsDialog({
    open,
    onOpenChange,
    fontSize,
    onFontSizeChange,
}: AdvancedSettingsDialogProps) {
    const { theme, setTheme } = useTheme()
    const [searchQuery, setSearchQuery] = useState("")
    const [fontFamily, setFontFamily] = useState("monospace")
    const [fontWeight, setFontWeight] = useState("400")
    const [lineHeight, setLineHeight] = useState(1.5)
    const [letterSpacing, setLetterSpacing] = useState(0)
    const [autoSave, setAutoSave] = useState(true)
    const [syntaxPreset, setSyntaxPreset] = useState("vs-code")

    // Custom colors (in real implementation, these would be state)
    const [customColors, setCustomColors] = useState({
        accent: "#3b82f6",
        primary: "#1e40af",
        secondary: "#6b7280",
    })

    const handleExportSettings = () => {
        const settings = {
            theme,
            fontSize,
            fontFamily,
            fontWeight,
            lineHeight,
            letterSpacing,
            syntaxPreset,
            customColors,
            autoSave,
            exportedAt: new Date().toISOString(),
        }

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ide-settings-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target?.result as string)
                if (settings.theme) setTheme(settings.theme)
                if (settings.fontSize) onFontSizeChange(settings.fontSize)
                if (settings.fontFamily) setFontFamily(settings.fontFamily)
                if (settings.fontWeight) setFontWeight(settings.fontWeight)
                if (settings.lineHeight) setLineHeight(settings.lineHeight)
                if (settings.letterSpacing) setLetterSpacing(settings.letterSpacing)
                if (settings.syntaxPreset) setSyntaxPreset(settings.syntaxPreset)
                if (settings.customColors) setCustomColors(settings.customColors)
                if (typeof settings.autoSave === 'boolean') setAutoSave(settings.autoSave)
            } catch (error) {
                console.error("Failed to import settings:", error)
                alert("Invalid settings file")
            }
        }
        reader.readAsText(file)
    }

    const handleResetDefaults = () => {
        if (confirm("Reset all settings to defaults? This cannot be undone.")) {
            setTheme("system")
            onFontSizeChange(14)
            setFontFamily("monospace")
            setFontWeight("400")
            setLineHeight(1.5)
            setLetterSpacing(0)
            setSyntaxPreset("vs-code")
            setAutoSave(true)
            setCustomColors({
                accent: "#3b82f6",
                primary: "#1e40af",
                secondary: "#6b7280",
            })
        }
    }

    const getThemeIcon = (themeName: string) => {
        if (themeName === "light") return <Sun className="h-4 w-4" />
        if (themeName === "dark") return <Moon className="h-4 w-4" />
        if (themeName === "high-contrast") return <Contrast className="h-4 w-4" />
        return <Palette className="h-4 w-4" />
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Advanced Settings
                    </DialogTitle>
                    <DialogDescription>
                        Customize your IDE appearance, behavior, and preferences
                    </DialogDescription>
                </DialogHeader>

                {/* Search Bar */}
                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search settings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Tabs defaultValue="appearance" className="flex-1">
                    <div className="px-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="appearance" className="gap-2">
                                <Palette className="h-4 w-4" />
                                <span className="hidden sm:inline">Appearance</span>
                            </TabsTrigger>
                            <TabsTrigger value="editor" className="gap-2">
                                <Type className="h-4 w-4" />
                                <span className="hidden sm:inline">Editor</span>
                            </TabsTrigger>
                            <TabsTrigger value="syntax" className="gap-2">
                                <Code className="h-4 w-4" />
                                <span className="hidden sm:inline">Syntax</span>
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className="gap-2">
                                <SettingsIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Advanced</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="h-[400px] px-6 py-4">
                        {/* Appearance Tab */}
                        <TabsContent value="appearance" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold mb-3">Color Theme</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setTheme("light")}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === "light"
                                                    ? "border-accent bg-accent/10"
                                                    : "border-border bg-card hover:border-accent/50"
                                                }`}
                                        >
                                            <Sun className="h-5 w-5" />
                                            <div className="text-left">
                                                <div className="font-medium text-sm">Light</div>
                                                <div className="text-xs text-muted-foreground">Clean & bright</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setTheme("dark")}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === "dark"
                                                    ? "border-accent bg-accent/10"
                                                    : "border-border bg-card hover:border-accent/50"
                                                }`}
                                        >
                                            <Moon className="h-5 w-5" />
                                            <div className="text-left">
                                                <div className="font-medium text-sm">Dark</div>
                                                <div className="text-xs text-muted-foreground">Low light optimized</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setTheme("high-contrast")}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === "high-contrast"
                                                    ? "border-accent bg-accent/10"
                                                    : "border-border bg-card hover:border-accent/50"
                                                }`}
                                        >
                                            <Contrast className="h-5 w-5" />
                                            <div className="text-left">
                                                <div className="font-medium text-sm">High Contrast</div>
                                                <div className="text-xs text-muted-foreground">Maximum accessibility</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setTheme("system")}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === "system"
                                                    ? "border-accent bg-accent/10"
                                                    : "border-border bg-card hover:border-accent/50"
                                                }`}
                                        >
                                            <Palette className="h-5 w-5" />
                                            <div className="text-left">
                                                <div className="font-medium text-sm">Follow System</div>
                                                <div className="text-xs text-muted-foreground">Auto detect</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold mb-3">Custom Accent Colors</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="accent-color" className="text-xs mb-2 block">Accent</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="accent-color"
                                                    type="color"
                                                    value={customColors.accent}
                                                    onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                                                    className="h-10 w-14 cursor-pointer"
                                                />
                                                <Input
                                                    value={customColors.accent}
                                                    onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                                                    className="flex-1 font-mono text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="primary-color" className="text-xs mb-2 block">Primary</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="primary-color"
                                                    type="color"
                                                    value={customColors.primary}
                                                    onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                                                    className="h-10 w-14 cursor-pointer"
                                                />
                                                <Input
                                                    value={customColors.primary}
                                                    onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                                                    className="flex-1 font-mono text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="secondary-color" className="text-xs mb-2 block">Secondary</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="secondary-color"
                                                    type="color"
                                                    value={customColors.secondary}
                                                    onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                                                    className="h-10 w-14 cursor-pointer"
                                                />
                                                <Input
                                                    value={customColors.secondary}
                                                    onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                                                    className="flex-1 font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Editor Tab */}
                        <TabsContent value="editor" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="font-family" className="text-sm mb-2 block">Font Family</Label>
                                        <Select value={fontFamily} onValueChange={setFontFamily}>
                                            <SelectTrigger id=" font-family">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monospace">System Monospace</SelectItem>
                                                <SelectItem value="'Fira Code', monospace">Fira Code</SelectItem>
                                                <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono</SelectItem>
                                                <SelectItem value="'Source Code Pro', monospace">Source Code Pro</SelectItem>
                                                <SelectItem value="'Cascadia Code', monospace">Cascadia Code</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="font-weight" className="text-sm mb-2 block">Font Weight</Label>
                                        <Select value={fontWeight} onValueChange={setFontWeight}>
                                            <SelectTrigger id="font-weight">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="300">Light (300)</SelectItem>
                                                <SelectItem value="400">Normal (400)</SelectItem>
                                                <SelectItem value="500">Medium (500)</SelectItem>
                                                <SelectItem value="600">Semi-Bold (600)</SelectItem>
                                                <SelectItem value="700">Bold (700)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="font-size" className="text-sm mb-2 block">
                                        Font Size: {fontSize}px
                                    </Label>
                                    <Slider
                                        id="font-size"
                                        min={10}
                                        max={24}
                                        step={1}
                                        value={[fontSize]}
                                        onValueChange={(value) => onFontSizeChange(value[0])}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="line-height" className="text-sm mb-2 block">
                                        Line Height: {lineHeight.toFixed(1)}
                                    </Label>
                                    <Slider
                                        id="line-height"
                                        min={1}
                                        max={2.5}
                                        step={0.1}
                                        value={[lineHeight]}
                                        onValueChange={(value) => setLineHeight(value[0])}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="letter-spacing" className="text-sm mb-2 block">
                                        Letter Spacing: {letterSpacing}px
                                    </Label>
                                    <Slider
                                        id="letter-spacing"
                                        min={-2}
                                        max={2}
                                        step={0.1}
                                        value={[letterSpacing]}
                                        onValueChange={(value) => setLetterSpacing(value[0])}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Syntax Highlighting Tab */}
                        <TabsContent value="syntax" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="syntax-preset" className="text-sm mb-2 block">Preset Theme</Label>
                                    <Select value={syntaxPreset} onValueChange={setSyntaxPreset}>
                                        <SelectTrigger id="syntax-preset">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vs-code">VS Code Default</SelectItem>
                                            <SelectItem value="monokai">Monokai Pro</SelectItem>
                                            <SelectItem value="solarized-dark">Solarized Dark</SelectItem>
                                            <SelectItem value="solarized-light">Solarized Light</SelectItem>
                                            <SelectItem value="dracula">Dracula</SelectItem>
                                            <SelectItem value="nord">Nord</SelectItem>
                                            <SelectItem value="github-light">GitHub Light</SelectItem>
                                            <SelectItem value="github-dark">GitHub Dark</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="rounded-lg border border-border bg-muted/30 p-4">
                                    <div className="text-xs font-medium mb-2 text-muted-foreground">Preview</div>
                                    <pre className="text-sm">
                                        <code>
                                            <span className="text-chart-4">function</span>{" "}
                                            <span className="text-chart-1">calculateSum</span>
                                            <span className="text-foreground">(</span>
                                            <span className="text-chart-2">a</span>
                                            <span className="text-foreground">, </span>
                                            <span className="text-chart-2">b</span>
                                            <span className="text-foreground">) {"{"}</span>
                                            {"\n  "}
                                            <span className="text-chart-4">return</span>{" "}
                                            <span className="text-chart-2">a</span>{" "}
                                            <span className="text-foreground">+</span>{" "}
                                            <span className="text-chart-2">b</span>
                                            <span className="text-foreground">;</span>
                                            {"\n"}
                                            <span className="text-foreground">{"}"}</span>
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Advanced Tab */}
                        <TabsContent value="advanced" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="auto-save" className="text-sm font-medium">Auto-save Settings</Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Automatically save settings changes
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto-save"
                                        checked={autoSave}
                                        onCheckedChange={setAutoSave}
                                    />
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h3 className="text-sm font-semibold mb-3">Import / Export</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExportSettings}
                                            className="flex-1 gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export Settings
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2"
                                            onClick={() => document.getElementById("import-file")?.click()}
                                        >
                                            <Upload className="h-4 w-4" />
                                            Import Settings
                                        </Button>
                                        <input
                                            id="import-file"
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={handleImportSettings}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h3 className="text-sm font-semibold mb-3">Reset</h3>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleResetDefaults}
                                        className="gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset to Defaults
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        This will restore all settings to their default values
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>

                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => onOpenChange(false)}>
                            Save Changes
                        </Button>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
