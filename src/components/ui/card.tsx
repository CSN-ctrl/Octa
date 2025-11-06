import * as React from "react"
import { cn } from "@/lib/utils"

// Core Card Container
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-[220px] h-[300px] rounded-2xl overflow-hidden border border-white/20 bg-[#111]/80 shadow-[0_0_15px_rgba(155,0,255,0.15)] transition-all duration-500 hover:shadow-[0_0_30px_rgba(155,0,255,0.4)] group",
      className
    )}
    {...props}
  >
    {/* Glow layers */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#7f00ff] via-[#e100ff] to-[#00c3ff] opacity-30 group-hover:opacity-60 blur-2xl transition-all duration-500" />
    <div className="absolute inset-[3px] bg-black/80 rounded-2xl z-10 border border-white/10" />

    <div className="relative z-20 flex flex-col justify-between h-full">
      {children}
    </div>
  </div>
))
Card.displayName = "Card"

// Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center text-center p-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// Title
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-white font-semibold tracking-widest text-lg uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-xs text-white/60 mt-1 tracking-wide uppercase",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex justify-center items-center flex-1 p-4", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

// Footer (social icons etc.)
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex justify-center gap-3 pb-4 text-white/50 group-hover:text-white transition-colors duration-500",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
