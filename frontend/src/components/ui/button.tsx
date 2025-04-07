import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-700 hover:bg-neutral-700/80 text-primary-foreground shadow-xs ",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-700/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brown_GB:
          "rounded-none text-primary-foreground shadow-xs hover:brightness-95 transition-all text-center",
        brown_rect_GB:
          "rounded-none text-primary-foreground shadow-xs hover:brightness-95 transition-all text-center",
        blue_button_GB:
          "rounded-none text-primary-foreground shadow-xs hover:brightness-95 transition-all text-center",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Create a new style object that includes the background image for brown_GB variant
  const buttonStyle =
    variant === "brown_GB"
      ? {
          ...style,
          backgroundImage: `url(${window.location.origin}/brown_button.png)`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent",
        }
      : variant === "brown_rect_GB"
      ? {
          ...style,
          backgroundImage: `url(${window.location.origin}/brown_rect_button.png)`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent",
        }
      : variant === "blue_button_GB"
      ? {
          ...style,
          backgroundImage: `url(${window.location.origin}/blue_button.png)`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "transparent",
        }
      : style;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={buttonStyle}
      {...props}
    />
  );
}

export { Button, buttonVariants };
