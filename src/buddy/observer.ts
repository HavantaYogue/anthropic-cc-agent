import { feature } from 'bun:bundle'
import { getGlobalConfig } from '../utils/config.js'
import { companionUserId, getCompanion, roll } from './companion.js'

/**
 * After each model turn, maybe surface a short companion quip in the sprite bubble.
 * (Official tree referenced this module from REPL; the leak omitted the file.)
 */
export function fireCompanionObserver(
  _messages: readonly unknown[],
  setReaction: (reaction: string | undefined) => void,
): void {
  if (!feature('BUDDY')) return

  const companion = getCompanion()
  if (!companion || getGlobalConfig().companionMuted) return

  // Low chance so the bubble stays special, not noisy.
  if (Math.random() > 0.1) return

  const { bones } = roll(companionUserId())
  const species = bones.species

  const quips = [
    '*happy wiggle*',
    'Keep going!',
    'You got this.',
    'Nice rhythm.',
    'Bug squash time?',
    `*${species} noises of support*`,
    'Hydrate maybe?',
    'Ship it?',
  ]
  const line = quips[Math.floor(Math.random() * quips.length)]!
  queueMicrotask(() => setReaction(line))
}
