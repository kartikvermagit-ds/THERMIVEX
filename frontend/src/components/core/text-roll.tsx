'use client';

import React from 'react';
import { motion, type Transition } from 'motion/react';

export interface TextRollProps {
  children: string;
  className?: string;
  duration?: number;
  getEnterDelay?: (index: number) => number;
  getExitDelay?: (index: number) => number;
  transition?: Transition;
  style?: React.CSSProperties;
}

export function TextRoll({
  children,
  className = '',
  duration = 0.45,
  getEnterDelay = (i: number) => i * 0.035,
  getExitDelay = (i: number) => i * 0.035,
  transition,
  style,
}: TextRollProps) {
  return (
    <motion.span
      initial="initial"
      whileHover="hover"
      className={className}
      style={{
        display: 'inline-flex',
        overflow: 'hidden',
        cursor: 'pointer',
        lineHeight: 1.1,
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
    >
      {children.split('').map((letter, i) => (
        <span
          key={i}
          style={{
            position: 'relative',
            display: 'inline-block',
            overflow: 'hidden',
            lineHeight: 1.1,
            whiteSpace: letter === ' ' ? 'pre' : 'normal',
          }}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            variants={{
              initial: { y: 0 },
              hover: { y: '-100%' },
            }}
            transition={
              transition || {
                duration,
                ease: [0.25, 1, 0.5, 1],
                delay: getEnterDelay(i),
              }
            }
          >
            {letter}
          </motion.span>
          <motion.span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'inline-block',
            }}
            variants={{
              initial: { y: '100%' },
              hover: { y: 0 },
            }}
            transition={
              transition || {
                duration,
                ease: [0.25, 1, 0.5, 1],
                delay: getExitDelay(i),
              }
            }
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export function TextRollBasic() {
  return (
    <TextRoll className="text-4xl text-black dark:text-white">
      PYRAVEX
    </TextRoll>
  );
}
