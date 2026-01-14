import React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaLive?: "polite" | "assertive" | "off";
}

/**
 * Accessible button component with proper ARIA attributes
 * Wraps the base Button component with accessibility enhancements
 */
export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaControls,
      ariaLive,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        className={cn(className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-live={ariaLive}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

