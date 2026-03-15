'use client'

import { motion } from 'framer-motion'
import { emptyStateVariants, listVariants, shimmerVariants } from '@/lib/animations'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface GhostRow {
  widths: string[]
}

interface EmptyStateProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  title: string
  description: string
  primaryCTA?: { label: string; href?: string; onClick?: () => void }
  secondaryCTA?: { label: string; href?: string; onClick?: () => void }
  ghostRows?: GhostRow[]
  tip?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  iconColor = 'text-orange-400',
  iconBg = 'bg-orange-50',
  title,
  description,
  primaryCTA,
  secondaryCTA,
  ghostRows,
  tip,
  className
}: EmptyStateProps) {
  return (
    <div className={`relative flex flex-col ${className ?? ''}`}>

      {ghostRows && ghostRows.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 p-6"
          >
            {ghostRows.map((row, i) => (
              <motion.div
                key={i}
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="w-9 h-9 rounded-full bg-zinc-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  {row.widths.map((w, j) => (
                    <div key={j} className={`h-2.5 rounded-full bg-zinc-100 ${w}`} />
                  ))}
                </div>
                <div className="w-16 h-5 rounded-full bg-zinc-100" />
              </motion.div>
            ))}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/60 to-zinc-50" />
        </div>
      )}

      <motion.div
        variants={emptyStateVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-12 min-h-[320px]"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35, type: 'spring', bounce: 0.3 }}
          className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mb-5 shadow-sm`}
        >
          <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={1.5} />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-lg font-bold text-zinc-900 mb-2"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {primaryCTA && (
            primaryCTA.href ? (
              <Link
                href={primaryCTA.href}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {primaryCTA.label}
              </Link>
            ) : (
              <button
                onClick={primaryCTA.onClick}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {primaryCTA.label}
              </button>
            )
          )}
          {secondaryCTA && (
            secondaryCTA.href ? (
              <Link
                href={secondaryCTA.href}
                className="border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {secondaryCTA.label}
              </Link>
            ) : (
              <button
                onClick={secondaryCTA.onClick}
                className="border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {secondaryCTA.label}
              </button>
            )
          )}
        </motion.div>

        {tip && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-xs text-zinc-400"
          >
            {tip}
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
