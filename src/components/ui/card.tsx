import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
  title: string;
  subtitle?: string;
  glowColor?: string; // e.g. "#7209b7" or "from-[#7209b7] to-[#3a0ca3]"
  faction?: "residential" | "industrial" | "business" | "admin" | string;
  socials?: { href: string; icon: React.ReactNode }[];
}

const FACTION_COLORS: Record<string, { from: string; to: string }> = {
  residential: { from: "#4CC9F0", to: "#4895EF" },
  industrial: { from: "#FF6D00", to: "#F72585" },
  business: { from: "#7209B7", to: "#3A0CA3" },
  admin: { from: "#00F5D4", to: "#00BBF9" },
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      title,
      subtitle,
      image,
      faction = "business",
      glowColor,
      socials = [],
      children,
      ...props
    },
    ref
  ) => {
    const colors = FACTION_COLORS[faction] || {
      from: "#7209B7",
      to: "#3A0CA3",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-[200px] h-[280px] flex justify-center items-center overflow-hidden group",
          className
        )}
        {...props}
      >
        {/* Outer Glow */}
        <div
          className={cn(
            "absolute inset-0 opacity-80 group-hover:opacity-100 transition-all duration-500 blur-md",
            `bg-gradient-to-tr from-[${colors.from}] to-[${colors.to}]`
          )}
        ></div>
        <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-2xl z-10"></div>

        {/* Energy Core */}
        <div className="absolute inset-1 bg-gradient-to-tr from-[#1a1a1a] to-[#111] rounded-2xl border border-white/5 z-20 overflow-hidden">
          <div className="absolute inset-0 opacity-40 group-hover:opacity-80 transition-all duration-500">
            <div
              className={cn(
                "absolute w-[300px] h-[300px] blur-2xl animate-[spin_15s_linear_infinite] rounded-full left-[-50%] top-[-50%]",
                `bg-gradient-to-tr from-[${colors.from}]/40 to-[${colors.to}]/40`
              )}
            />
          </div>
        </div>

        {/* Image */}
        {image && (
          <img
            src={image}
            alt={title}
            className="absolute z-30 scale-75 opacity-30 group-hover:scale-50 group-hover:opacity-90 transform transition-all duration-700 ease-in-out"
          />
        )}

        {/* Content */}
        <div className="absolute bottom-0 z-40 flex flex-col items-center gap-1 text-center scale-0 group-hover:scale-100 group-hover:bottom-6 transition-all duration-700 ease-out">
          <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wide">
            {title}
            {subtitle && (
              <span className="block text-[0.7em] font-light text-gray-400">
                {subtitle}
              </span>
            )}
          </h3>
          {children && (
            <div className="text-[0.75rem] text-gray-300 mt-1">{children}</div>
          )}
          {socials.length > 0 && (
            <ul className="flex justify-center items-center gap-2 mt-2">
              {socials.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.href}
                    className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-300"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";
export { Card };
