"use client"

import Link from "next/link"
import { Rocket, Brain, Palette, Users, ChevronRight, GraduationCap, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-border bg-card">
        <div className="flex items-center">
          <Logo size={32} variant="full" />
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-muted-foreground">Already a member?</span>
          <Button variant="outline" asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Hero Visual */}
        <div className="hidden lg:flex w-1/2 relative bg-[#111418] flex-col justify-end p-16">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center opacity-60 mix-blend-overlay"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfYiTGh8h9SbERj6uUKVEKMGXnEXZ7SiwL5j_Iaw96f7ijS3okA5gNWqR2Q1jyNfJb3Zg0hprKyeg0Gy8hTrldGJQTm_rAQEWWTFzDbhMUnaETQ8E2YPgI4i1asdqP8_OPDl0RbSVC1T8Bk93RUCBg08yKnQrT_3VqrN2QvFFxSKF7Y2u-yXRWvPKXFEv0LZo_XaxnkaohuzRoAiwbQFGJhOT90BZd67xIQibMM67KVQuLZUs3n9PXIV-lSU-TdJo1yJuVIDe_71gm')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101922] via-[#101922]/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-lg">
            {/* Floating Icons */}
            <div className="flex gap-2 mb-6">
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary backdrop-blur-sm border border-primary/30">
                <Rocket className="size-5" />
              </span>
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-purple-500/20 text-purple-400 backdrop-blur-sm border border-purple-500/30">
                <Brain className="size-5" />
              </span>
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-orange-500/20 text-orange-400 backdrop-blur-sm border border-orange-500/30">
                <Palette className="size-5" />
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Spark their curiosity.<br />Fuel their future.
            </h1>
            <p className="text-lg text-gray-300 font-light leading-relaxed mb-8">
              Join thousands of families and educators using STEAM Spark to ignite a passion for Science, Technology, Engineering, Art, and Math.
            </p>

            {/* Social Proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#101922]" src="https://i.pravatar.cc/100?img=1" />
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#101922]" src="https://i.pravatar.cc/100?img=2" />
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#101922]" src="https://i.pravatar.cc/100?img=3" />
              </div>
              <span className="text-sm font-medium text-white">Trusted by 10,000+ families</span>
            </div>
          </div>
        </div>

        {/* Right Side: Role Selector */}
        <div className="w-full lg:w-1/2 bg-card flex items-center justify-center p-6 lg:p-16">
          <div className="max-w-md w-full">
            {/* Mobile Hero */}
            <div className="lg:hidden text-center mb-10">
              <h1 className="text-3xl font-black tracking-tight mb-3">Welcome to STEAM Spark</h1>
              <p className="text-muted-foreground">Igniting curiosity through Science, Technology, Engineering, Art, and Math.</p>
            </div>

            <div className="hidden lg:block mb-10">
              <h2 className="text-3xl font-bold mb-2">Get Started</h2>
              <p className="text-muted-foreground">Choose how you'd like to join STEAM Spark</p>
            </div>

            {/* Role Cards */}
            <div className="flex flex-col gap-4">
              {/* Parent Card */}
              <Link
                href="/signup/parent"
                className="group relative flex items-start gap-5 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="size-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <Heart className="size-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    I'm a Parent
                    <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Find the perfect tutors and resources to help my child explore STEAM subjects.
                  </p>
                </div>
              </Link>

              {/* Teacher Card */}
              <Link
                href="/signup/teacher"
                className="group relative flex items-start gap-5 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="size-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="size-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    I'm an Educator
                    <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Share my expertise and inspire the next generation of creators and innovators.
                  </p>
                </div>
              </Link>
            </div>

            {/* Features */}
            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-4 text-center">Why STEAM Spark?</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <Users className="size-5" />
                  </div>
                  <span className="text-xs font-medium">Expert Tutors</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Brain className="size-5" />
                  </div>
                  <span className="text-xs font-medium">AI Roadmaps</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                    <Rocket className="size-5" />
                  </div>
                  <span className="text-xs font-medium">Fun Learning</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-8">
              By signing up, you agree to our <a className="underline hover:text-primary" href="#">Terms of Service</a> and <a className="underline hover:text-primary" href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
