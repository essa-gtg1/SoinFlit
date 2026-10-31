// Shared motion tokens: ease-out for anything entering, springs for touch.
export const EASE_OUT = [0.22, 1, 0.36, 1]
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]

export const liquidSpring = { type: 'spring', stiffness: 260, damping: 20, mass: 0.7 }
export const knobSpring = { type: 'spring', stiffness: 520, damping: 32 }

export const enter = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT, delay: 0.06 * i },
  }),
}
