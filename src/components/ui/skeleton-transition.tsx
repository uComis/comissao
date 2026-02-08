'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface SkeletonTransitionProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
}

export function SkeletonTransition({ isLoading, skeleton, children }: SkeletonTransitionProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }

  return <>{children}</>
}
