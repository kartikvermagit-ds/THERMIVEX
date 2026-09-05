'use client';

import React, { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';

export interface TextMorphProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
}

export function TextMorph({
  children,
  as: Component = 'span',
  className = '',
  style,
  transition = { type: 'spring', stiffness: 280, damping: 18, mass: 0.3 },
}: TextMorphProps) {
  const uniqueId = useId();

  const characters = useMemo(() => {
    const charCounts: Record<string, number> = {};

    return children.split('').map((char, index) => {
      const lowerChar = char.toLowerCase();
      charCounts[lowerChar] = (charCounts[lowerChar] || 0) + 1;

      return {
        id: `${uniqueId}-${lowerChar}${charCounts[lowerChar]}`,
        label: char,
        index,
      };
    });
  }, [children, uniqueId]);

  return (
    <Component
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        ...style,
      }}
      aria-label={children}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {characters.map((character) => (
          <motion.span
            key={character.id}
            layoutId={character.id}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            style={{
              display: 'inline-block',
              whiteSpace: character.label === ' ' ? 'pre' : 'normal',
            }}
          >
            {character.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </Component>
  );
}

export function TextMorphButton({
  onConfirm,
  className = '',
  style,
}: {
  onConfirm?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [text, setText] = useState('Continue');

  return (
    <button
      onClick={() => {
        setText(text === 'Continue' ? 'Confirm' : 'Continue');
        if (text === 'Confirm' && onConfirm) {
          onConfirm();
        }
      }}
      className={`flex h-10 w-[120px] shrink-0 items-center justify-center rounded-full bg-black px-4 text-base font-medium text-zinc-50 shadow-xs transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 ${className}`}
      style={style}
      type="button"
    >
      <TextMorph>{text}</TextMorph>
    </button>
  );
}
