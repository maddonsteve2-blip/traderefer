'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function AnimatedStatGrid({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
      }}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedStatCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      {children}
    </motion.div>
  )
}
