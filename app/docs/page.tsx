import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { ArrowLeft, Book, Code, Terminal, Users, Zap, GitBranch, Bug } from "lucide-react"

const sections = [
  {
    title: "Getting Started",
    icon: Zap,
    items: [
      { title: "Quick Start Guide", href: "#quick-start" },
      { title: "Creating Your First Project", href: "#first-project" },
      { title: "Inviting Collaborators", href: "#collaborators" },
    ],
  },
  {
    title: "Editor Features",
    icon: Code,
    items: [
      { title: "Syntax Highlighting", href: "#syntax" },
      { title: "Auto-completion", href: "#autocomplete" },
      { title: "Multiple Cursors", href: "#cursors" },
      { title: "Keyboard Shortcuts", href: "#shortcuts" },
    ],
  },
  {
    title: "Collaboration",
    icon: Users,
    items: [
      { title: "Real-time Editing", href: "#realtime" },
      { title: "Presence Indicators", href: "#presence" },
      { title: "Chat & Comments", href: "#chat" },
    ],
  },
  {
    title: "Debugging",
    icon: Bug,
    items: [
      { title: "Setting Breakpoints", href: "#breakpoints" },
      { title: "Variable Inspection", href: "#variables" },
      { title: "Call Stack", href: "#callstack" },
    ],
  },
  {
    title: "Terminal",
    icon: Terminal,
    items: [
      { title: "Built-in Terminal", href: "#terminal" },
      { title: "Running Commands", href: "#commands" },
      { title: "Package Management", href: "#packages" },
    ],
  },
  {
    title: "Version Control",
    icon: GitBranch,
    items: [
      { title: "Git Integration", href: "#git" },
      { title: "Branch Management", href: "#branches" },
      { title: "Commit History", href: "#history" },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Documentation</h1>
          <p className="mt-2 text-lg text-muted-foreground">Everything you need to know about using CodeSync</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <section.icon className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.title}>
                    <a href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-8">
          <div className="flex items-start gap-4">
            <Book className="h-8 w-8 text-accent" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Need more help?</h2>
              <p className="mt-2 text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90">Contact Support</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
