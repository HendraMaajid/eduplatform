'use client';
import { ReactNode } from 'react';
import { motion, Variants, useInView } from 'motion/react';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';

type PresetType = 'fade' | 'slide' | 'scale' | 'blur-slide';

type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  preset?: PresetType;
  staggerDelay?: number;
  delay?: number;
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  fade: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5 } },
    },
  },
  slide: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    },
  },
  scale: {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    },
  },
  'blur-slide': {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    },
    item: {
      hidden: { opacity: 0, filter: 'blur(4px)', y: 12 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { type: 'spring', bounce: 0.3, duration: 1 } },
    },
  },
};

function AnimatedGroup({ children, className, preset = 'slide', staggerDelay = 0.1, delay = 0 }: AnimatedGroupProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  const variants = presetVariants[preset];
  const containerVariants: Variants = {
    ...variants.container,
    visible: {
      ...((variants.container.visible as object) || {}),
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={variants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { AnimatedGroup };
