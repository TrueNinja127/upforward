import type { ComponentProps } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const pillButton = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-white/85",
        secondary: "bg-card text-white hover:bg-white/15",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-11 px-6 text-[17px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export function PillLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof pillButton>) {
  return <Link className={cn(pillButton({ variant, size }), className)} {...props} />;
}

/** Apple-style text link with a trailing chevron: "Learn more ›" */
export function ChevronLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("group inline-flex items-center gap-0.5 text-[17px] text-white hover:underline underline-offset-4", className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
