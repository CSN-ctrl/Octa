import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-[200px] h-[300px] border border-white/40 rounded-2xl overflow-hidden group",
      className
    )}
    {...props}
  >
    {/* Outer Glow Layer */}
    <div className="w-full h-full p-1 absolute bg-purple-400">
      <div className="w-full h-full rounded-xl rounded-tr-[100px] rounded-br-[40px] bg-[#222]" />
    </div>

    {/* Spinning Core */}
    <div className="w-full h-full flex items-center justify-center relative backdrop-blur-lg rounded-2xl">
      <div
        className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-orange-300 animate-spin"
        style={{ animationDuration: "12s" }}
      />
    </div>

    {/* Content Overlay */}
    <div className="w-full h-full p-2 flex justify-between absolute inset-0">
      <div className="w-3/5 p-2 pt-3 pb-1.5 flex flex-col rounded-xl backdrop-blur-lg bg-gray-50/10 text-gray-200 font-medium font-mono">
        {children}
      </div>
      <div className="h-full pt-2 flex flex-col items-end text-white/50">
        <span className="text-[10px] leading-[12px]">Octavia</span>
        <span className="text-[10px] leading-[13px]">Core</span>
        <div className="w-8 h-8 mt-auto flex items-center justify-center rounded-full backdrop-blur-lg bg-gray-50/20 cursor-pointer transition-all duration-300 hover:bg-gray-50/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 12"
            className="w-4 h-4 text-white/80"
            fill="currentColor"
          >
            <path d="M4.646 2.146a.5.5 0 0 0 0 .708L7.793 6 4.646 9.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-xl font-medium", className)}>{children}</div>
)

const CardTitle = ({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h3>
)

const CardDescription = ({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-xs text-gray-400", className)}>{children}</p>
)

const CardContent = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col mt-auto text-center", className)}>{children}</div>
)

const CardFooter = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-center text-xs text-gray-400 mt-2", className)}>
    {children}
  </div>
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
