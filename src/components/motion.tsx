"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

export function staggerContainer(
  stagger = 0.08,
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
};

/** Fade + slide konten masuk saat pertama kali dirender. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 14,
  duration = 0.45,
}: FadeInProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
};

/** Container yang mengatur animasi berurutan untuk anak StaggerItem. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
}: StaggerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once, amount: 0.15 }}
      variants={staggerContainer(stagger, delay)}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  lift?: boolean;
};

/** Anak dari Stagger: fade-up dan opsional terangkat saat hover. */
export function StaggerItem({
  children,
  className,
  y = 14,
  lift = false,
}: StaggerItemProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={
        reduce
          ? undefined
          : {
              hidden: { opacity: 0, y },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: EASE },
              },
            }
      }
      whileHover={reduce || !lift ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}

/** Tombol dengan feedback tekan/hover memakai spring Framer Motion. */
export function PressableButton({
  className,
  children,
  ...props
}: HTMLMotionProps<"button">) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      className={className}
      whileHover={reduce ? undefined : { y: -1 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Titik indikator dengan denyut halus. */
export function PulseDot({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className={className}
      animate={
        reduce
          ? undefined
          : { scale: [1, 1.35, 1], opacity: [1, 0.55, 1] }
      }
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

type FloatingBlobProps = {
  className?: string;
  delay?: number;
  duration?: number;
};

/** Orb dekoratif yang bergerak pelan terus-menerus. */
export function FloatingBlob({
  className,
  delay = 0,
  duration = 9,
}: FloatingBlobProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={className}
      animate={reduce ? undefined : { y: [0, -14, 0], x: [0, 10, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/** Spinner loading dengan rotasi Framer Motion. */
export function Spinner({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className={className}
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Animasi transisi halaman yang dipakai lewat file template.tsx. */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
