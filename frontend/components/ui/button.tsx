"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = HTMLMotionProps<"a"> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <motion.a
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-night",
        variant === "primary"
          ? "bg-gold text-night shadow-gold-soft hover:bg-champagne"
          : "border border-white/12 bg-white/[0.03] text-zinc-100 hover:border-gold/50 hover:bg-white/[0.06]",
        className
      )}
      {...props}
    >
      {children}
    </motion.a>
  );
}
