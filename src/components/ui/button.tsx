import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight text-center ring-offset-background transition-[color,box-shadow,transform,background-color,opacity,border-color,filter] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/75 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/25 bg-primary text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_2px_10px_-3px_rgba(0,0,0,0.55)] hover:border-primary/35 hover:bg-primary/92 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_8px_24px_-8px_hsl(262_72%_42%_/_0.55)]",
        destructive:
          "border border-red-500/18 bg-destructive text-destructive-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_2px_8px_-2px_rgba(0,0,0,0.45)] hover:bg-destructive/88 hover:border-red-400/35",
        outline:
          "border border-border/90 bg-background/55 text-foreground shadow-sm backdrop-blur-md hover:bg-muted/75 hover:border-primary/32 hover:text-foreground",
        secondary:
          "border border-white/[0.08] bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/78 hover:border-white/[0.14]",
        ghost:
          "border border-transparent text-foreground hover:bg-muted/55 hover:border-border/35 active:scale-100",
        link: "border-transparent text-primary underline-offset-4 shadow-none hover:underline active:scale-100",
        cosmic:
          "border border-white/[0.11] bg-gradient-cosmic text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(232,220,180,0.09)_inset,0_4px_24px_-6px_hsl(262_72%_32%_/_0.52)] hover:opacity-[0.97] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.17)_inset,0_0_0_1px_rgba(232,220,180,0.12)_inset,0_10px_36px_-8px_hsl(268_65%_44%_/_0.38)]",
        /** Jewel + champagne trim — high-trust CTAs (deposit, treasury) */
        luxury:
          "border border-[hsl(43_48%_62%)]/32 bg-gradient-to-b from-[hsl(158_28%_22%)] via-[hsl(162_26%_16%)] to-[hsl(168_24%_11%)] text-[hsl(48_20%_98%)] tracking-wide shadow-[0_1px_0_0_rgba(255,255,255,0.13)_inset,0_0_0_1px_rgba(232,220,180,0.07)_inset,0_3px_16px_-4px_rgba(0,0,0,0.55)] hover:border-[hsl(43_48%_62%)]/48 hover:brightness-[1.05] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.16)_inset,0_8px_28px_-8px_hsl(158_28%_14%_/_0.55)]",
        /** Primary nav / hero CTA — emerald gradient + gold rim + green glow */
        deposit:
          "relative overflow-hidden border-2 border-[hsl(43_48%_58%)]/45 bg-gradient-to-br from-[hsl(152_58%_40%)] via-[hsl(158_52%_34%)] to-[hsl(166_48%_26%)] text-[hsl(48_20%_98%)] uppercase tracking-[0.12em] font-bold shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_0_0_1px_rgba(232,220,180,0.14)_inset,0_4px_22px_-4px_hsl(158_50%_24%_/_0.72),0_0_40px_-10px_hsl(152_55%_34%_/_0.42),0_0_0_1px_hsl(152_55%_45%_/_0.28)] hover:border-[hsl(43_48%_72%)]/70 hover:brightness-[1.07] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.22)_inset,0_0_0_1px_rgba(232,220,180,0.16)_inset,0_10px_40px_-6px_hsl(158_55%_30%_/_0.58),0_0_56px_-12px_hsl(152_60%_38%_/_0.45),0_0_0_1px_hsl(152_58%_52%_/_0.38)] hover:scale-[1.03] hover:ring-2 hover:ring-emerald-300/45 active:scale-[0.98]",
        glass:
          "border border-white/[0.12] glass text-foreground shadow-sm hover:border-primary/28 hover:bg-primary/[0.12]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** When true, smooth-scrolls to top on click (opt-in; not default). */
  scrollToTopOnClick?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      onClick,
      scrollToTopOnClick = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (scrollToTopOnClick) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      onClick?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
