'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function Fade({ children, delay = 0, duration = 0.25, className, ...props }: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({ children, delay = 0, duration = 0.35, className, ...props }: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // ease-out-premium curve
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Scale({ children, delay = 0, duration = 0.3, className, ...props }: MotionProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number;
}

export function Stagger({ children, staggerDelay = 0.05, className, ...props }: StaggerProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.25 } },
  };

  const childrenArray = React.Children.toArray(children);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      {...props}
    >
      {childrenArray.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
