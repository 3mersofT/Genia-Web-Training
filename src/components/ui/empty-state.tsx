"use client"

import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"
import { fadeInUp } from "@/lib/animation-presets"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-12 h-12 text-primary/60" />
        </div>
        <motion.div
          className="absolute inset-0 w-24 h-24 rounded-full bg-primary/5"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button variant="brand" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
