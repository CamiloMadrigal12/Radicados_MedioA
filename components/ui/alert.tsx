"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export const Alert = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="alert" className={cn("relative w-full rounded-lg border p-4", className)} {...props} />
)

export const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
)

export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
)