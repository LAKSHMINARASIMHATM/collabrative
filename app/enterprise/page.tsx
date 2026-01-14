"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import { ArrowLeft, Shield, Server, Users, Clock, Lock, Building2, Check, Headphones } from "lucide-react"
import { LaserFlow } from "@/components/ui/laser-flow"

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SSO, SAML, and advanced security controls to meet your compliance needs",
  },
  {
    icon: Server,
    title: "On-Premise Deployment",
    description: "Deploy CodeSync on your own infrastructure for maximum control",
  },
  {
    icon: Users,
    title: "Unlimited Users",
    description: "No limits on team size or collaborators",
  },
  {
    icon: Clock,
    title: "99.99% SLA",
    description: "Enterprise-grade uptime guarantees with priority support",
  },
  {
    icon: Lock,
    title: "Audit Logs",
    description: "Comprehensive logging and audit trails for compliance",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "24/7 priority support with dedicated account manager",
  },
]

export default function EnterprisePage() {
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header />

      {/* LaserFlow Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <LaserFlow
          color="#3b8eea"
          flowSpeed={0.8}
          wispSpeed={20}
        />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-12 relative z-10">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 text-muted-foreground hover:bg-background/50">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left side - Info */}
          <div>
            <div className="mb-8 flex items-center gap-3">
              <Building2 className="h-10 w-10 text-accent" />
              <h1 className="text-4xl font-bold text-foreground">Enterprise</h1>
            </div>
            <p className="mb-8 text-lg text-muted-foreground">
              CodeSync Enterprise is designed for organizations that need advanced security, compliance, and support.
              Get custom pricing tailored to your team's needs.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3 bg-background/50 p-3 rounded-lg border border-transparent hover:border-accent/20 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Contact Form */}
          <div className="rounded-xl border border-border bg-card p-8">
            {formSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <Check className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Thank you!</h2>
                <p className="mt-2 text-muted-foreground">Our enterprise team will contact you within 24 hours.</p>
                <Button className="mt-6 bg-foreground text-background hover:bg-foreground/90" asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            ) : (
              <>
                <h2 className="mb-6 text-2xl font-semibold text-foreground">Contact Sales</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-foreground">
                        First Name
                      </Label>
                      <Input id="firstName" required className="bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-foreground">
                        Last Name
                      </Label>
                      <Input id="lastName" required className="bg-background border-border" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Work Email
                    </Label>
                    <Input id="email" type="email" required className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground">
                      Company
                    </Label>
                    <Input id="company" required className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamSize" className="text-foreground">
                      Team Size
                    </Label>
                    <Input id="teamSize" placeholder="e.g., 50-100" className="bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">
                      Tell us about your needs
                    </Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="What features are most important to your team?"
                      className="bg-background border-border"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
                    Get in Touch
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
