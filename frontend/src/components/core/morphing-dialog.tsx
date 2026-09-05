'use client';

import React, {
  createContext,
  useContext,
  useState,
  useId,
  useRef,
  useEffect,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Transition, type Variants } from 'motion/react';
import { X, PlusIcon } from 'lucide-react';

interface MorphingDialogContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  uniqueId: string;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  transition?: Transition;
}

const MorphingDialogContext = createContext<MorphingDialogContextType | undefined>(
  undefined
);

function useMorphingDialog() {
  const context = useContext(MorphingDialogContext);
  if (!context) {
    throw new Error('useMorphingDialog must be used within a MorphingDialog');
  }
  return context;
}

function subscribe() {
  return () => {};
}

function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export interface MorphingDialogProps {
  children: React.ReactNode;
  transition?: Transition;
}

export function MorphingDialog({ children, transition }: MorphingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const uniqueId = useId();
  const triggerRef = useRef<HTMLDivElement | null>(null);

  return (
    <MorphingDialogContext.Provider
      value={{
        isOpen,
        setIsOpen,
        uniqueId,
        triggerRef,
        transition: transition || {
          type: 'spring',
          bounce: 0.05,
          duration: 0.25,
        },
      }}
    >
      {children}
    </MorphingDialogContext.Provider>
  );
}

export interface MorphingDialogTriggerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogTrigger({
  children,
  className = '',
  style,
}: MorphingDialogTriggerProps) {
  const { setIsOpen, uniqueId, triggerRef, transition } = useMorphingDialog();

  return (
    <motion.div
      ref={triggerRef}
      layoutId={`dialog-${uniqueId}`}
      className={`cursor-pointer ${className}`}
      style={style}
      onClick={() => setIsOpen(true)}
      transition={transition}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export interface MorphingDialogContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogContainer({
  children,
  className = '',
  style,
}: MorphingDialogContainerProps) {
  const { isOpen, setIsOpen } = useMorphingDialog();
  const isMounted = useIsMounted();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, setIsOpen]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={style}
        >
          {/* Backdrop overlay */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${className}`}
            onClick={() => setIsOpen(false)}
          />
          {children}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export interface MorphingDialogContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogContent({
  children,
  className = '',
  style,
}: MorphingDialogContentProps) {
  const { uniqueId, transition } = useMorphingDialog();

  return (
    <motion.div
      layoutId={`dialog-${uniqueId}`}
      className={`relative z-10 overflow-hidden ${className}`}
      style={style}
      transition={transition}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

export interface MorphingDialogImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogImage({
  className = '',
  style,
  alt = '',
  ...props
}: MorphingDialogImageProps) {
  const { uniqueId, transition } = useMorphingDialog();

  return (
    <motion.img
      layoutId={`dialog-img-${uniqueId}`}
      className={className}
      style={style}
      alt={alt}
      transition={transition}
      {...(props as any)}
    />
  );
}

export interface MorphingDialogTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogTitle({
  children,
  className = '',
  style,
}: MorphingDialogTitleProps) {
  const { uniqueId, transition } = useMorphingDialog();

  return (
    <motion.div
      layoutId={`dialog-title-${uniqueId}`}
      className={className}
      style={style}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export interface MorphingDialogSubtitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogSubtitle({
  children,
  className = '',
  style,
}: MorphingDialogSubtitleProps) {
  const { uniqueId, transition } = useMorphingDialog();

  return (
    <motion.div
      layoutId={`dialog-subtitle-${uniqueId}`}
      className={className}
      style={style}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export interface MorphingDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disableLayoutAnimation?: boolean;
  variants?: Variants;
}

export function MorphingDialogDescription({
  children,
  className = '',
  style,
  disableLayoutAnimation = false,
  variants,
}: MorphingDialogDescriptionProps) {
  const { uniqueId, transition } = useMorphingDialog();

  const defaultVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  return (
    <motion.div
      {...(!disableLayoutAnimation && { layoutId: `dialog-desc-${uniqueId}` })}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants || defaultVariants}
      className={className}
      style={style}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export interface MorphingDialogCloseProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogClose({
  children,
  className = '',
  style,
}: MorphingDialogCloseProps) {
  const { setIsOpen } = useMorphingDialog();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(false);
      }}
      className={`absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-110 active:scale-95 cursor-pointer ${className}`}
      style={style}
      aria-label="Close dialog"
    >
      {children || <X size={16} />}
    </button>
  );
}

export function MorphingDialogBasicOne() {
  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0.05,
        duration: 0.25,
      }}
    >
      <MorphingDialogTrigger
        style={{
          borderRadius: '12px',
        }}
        className="flex max-w-[270px] flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900"
      >
        <MorphingDialogImage
          src="/eb-27-lamp-edouard-wilfrid-buquet.jpg"
          alt="A desk lamp designed by Edouard Wilfrid Buquet in 1925. It features a double-arm design and is made from nickel-plated brass, aluminium and varnished wood."
          className="h-48 w-full object-cover"
        />
        <div className="flex grow flex-row items-end justify-between px-3 py-2">
          <div>
            <MorphingDialogTitle className="text-zinc-950 dark:text-zinc-50">
              EB27
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className="text-zinc-700 dark:text-zinc-400">
              Edouard Wilfrid Buquet
            </MorphingDialogSubtitle>
          </div>
          <button
            type="button"
            className="relative ml-1 flex h-6 w-6 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98] dark:border-zinc-50/10 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-500"
            aria-label="Open dialog"
          >
            <PlusIcon size={12} />
          </button>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{
            borderRadius: '24px',
          }}
          className="pointer-events-auto relative flex h-auto w-full flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900 sm:w-[500px]"
        >
          <MorphingDialogImage
            src="/eb-27-lamp-edouard-wilfrid-buquet.jpg"
            alt="A desk lamp designed by Edouard Wilfrid Buquet in 1925. It features a double-arm design and is made from nickel-plated brass, aluminium and varnished wood."
            className="h-full w-full"
          />
          <div className="p-6">
            <MorphingDialogTitle className="text-2xl text-zinc-950 dark:text-zinc-50">
              EB27
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className="text-zinc-700 dark:text-zinc-400">
              Edouard Wilfrid Buquet
            </MorphingDialogSubtitle>
            <MorphingDialogDescription
              disableLayoutAnimation
              variants={{
                initial: { opacity: 0, scale: 0.8, y: 100 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.8, y: 100 },
              }}
            >
              <p className="mt-2 text-zinc-500 dark:text-zinc-500">
                Little is known about the life of Édouard-Wilfrid Buquet. He was
                born in France in 1866, but the time and place of his death is
                unfortunately a mystery.
              </p>
              <p className="text-zinc-500">
                Research conducted in the 1970s revealed that he’d designed the
                “EB 27” double-arm desk lamp in 1925, handcrafting it from
                nickel-plated brass, aluminium and varnished wood.
              </p>
              <a
                className="mt-2 inline-flex text-zinc-500 underline"
                href="https://www.are.na/block/12759029"
                target="_blank"
                rel="noopener noreferrer"
              >
                Are.na block
              </a>
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose className="text-zinc-50" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
