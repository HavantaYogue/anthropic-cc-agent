import type { LocalCommandResult } from '../../types/command.js'
import type { ToolUseContext } from '../../Tool.js'
import { companionUserId, getCompanion, roll } from '../../buddy/companion.js'
import type { Species } from '../../buddy/types.js'
import { RARITY_STARS } from '../../buddy/types.js'
import { renderSprite } from '../../buddy/sprites.js'
import { saveGlobalConfig } from '../../utils/config.js'

function titleCaseSpecies(s: Species): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

function hatchName(species: Species, seed: number): string {
  const prefixes = ['Lil', 'Sir', 'Lady', 'Tiny', 'Agent', 'Professor', 'Captain']
  const p = prefixes[seed % prefixes.length]!
  return `${p} ${titleCaseSpecies(species)}`
}

function hatchPersonality(species: Species): string {
  return `A cheerful ${species} who lives in the footer and roots for your code.`
}

export async function call(
  args: string,
  context: ToolUseContext,
): Promise<LocalCommandResult> {
  const raw = args.trim()
  const lower = raw.toLowerCase()

  if (lower === 'show') {
    const c = getCompanion()
    if (!c) {
      return {
        type: 'text',
        value: 'No companion yet — run `/buddy` to hatch one first.',
      }
    }
    const { bones } = roll(companionUserId())
    const spriteLines = renderSprite(bones, 0)
    const rarityStars = RARITY_STARS[bones.rarity]
    const stats = Object.entries(c.stats ?? bones.stats)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')

    return {
      type: 'text',
      value: [
        ...spriteLines,
        '',
        `${c.name} (${rarityStars}) — ${bones.species}${bones.shiny ? ' ✨ Shiny!' : ''}`,
        `Personality: ${c.personality}`,
        `Eye: ${bones.eye}  |  Hat: ${bones.hat}  |  Shiny: ${bones.shiny ? 'Yes' : 'No'}`,
        '',
        'Stats:',
        stats,
        '',
        'Try `/buddy pet`, `/buddy mute`, `/buddy reset`.',
      ].join('\n'),
    }
  }

  if (lower === 'pet' || lower === 'pat') {
    const c = getCompanion()
    if (!c) {
      return {
        type: 'text',
        value: 'No companion yet — run `/buddy` to hatch one first.',
      }
    }
    context.setAppState(prev => ({
      ...prev,
      companionPetAt: Date.now(),
    }))
    return { type: 'text', value: `You give ${c.name} some attention. Aww!` }
  }

  if (lower === 'mute') {
    saveGlobalConfig(cur => ({ ...cur, companionMuted: true }))
    return { type: 'text', value: 'Companion hidden (muted). Use `/buddy unmute` to show again.' }
  }

  if (lower === 'unmute') {
    saveGlobalConfig(cur => ({ ...cur, companionMuted: false }))
    return { type: 'text', value: 'Companion visible again.' }
  }

  if (lower === 'reset' || lower === 'release') {
    saveGlobalConfig(cur => {
      const next = { ...cur }
      delete next.companion
      delete next.companionMuted
      return next
    })
    return {
      type: 'text',
      value: 'Companion released. Run `/buddy` to hatch a new one.',
    }
  }

  if (lower === 'help') {
    return {
      type: 'text',
      value: [
        'Usage:',
        '  /buddy           — hatch (if none) or show status',
        '  /buddy show      — show companion sprite and stats',
        '  /buddy pet       — pet your companion',
        '  /buddy mute      — hide sprite',
        '  /buddy unmute    — show sprite',
        '  /buddy reset     — remove companion',
      ].join('\n'),
    }
  }

  const existing = getCompanion()
  if (existing) {
    const stats = Object.entries(existing.stats)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')
    return {
      type: 'text',
      value: [
        `${existing.name} (${existing.rarity}) — ${existing.species}`,
        existing.shiny ? 'Shiny!' : '',
        `Personality: ${existing.personality}`,
        'Stats:',
        stats,
        '',
        'Try `/buddy pet`, `/buddy mute`, `/buddy reset`.',
      ]
        .filter(Boolean)
        .join('\n'),
    }
  }

  const uid = companionUserId()
  const { bones } = roll(uid)
  const seed = bones.stats.CHAOS + bones.stats.SNARK
  const name = hatchName(bones.species, seed)
  const personality = hatchPersonality(bones.species)

  saveGlobalConfig(cur => ({
    ...cur,
    companion: {
      name,
      personality,
      hatchedAt: Date.now(),
    },
  }))

  return {
    type: 'text',
    value: [
      `You hatched ${name} the ${bones.species}!`,
      personality,
      '',
      'They appear beside the input. Use `/buddy pet` or focus the companion pill and press Enter.',
    ].join('\n'),
  }
}
