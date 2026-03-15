'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { pageVariants } from '@/lib/animations'

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}
