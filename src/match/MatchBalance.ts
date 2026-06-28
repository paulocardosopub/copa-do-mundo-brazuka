import { equipment, positions, skills } from '../data/gameData'
import type { AttributeKey, GameState } from '../types/game'
import { clamp } from './MatchMath'

export interface MatchRatings {
  pass: number
  shot: number
  dribble: number
  control: number
  speed: number
  defense: number
  currentOvr: number
  baseOvr: number
  equipment: {
    pass: number
    shot: number
    dribble: number
    control: number
    speed: number
    injuryResistance: number
  }
  conditionPenalty: number
  fatigue: number
  energyNorm: number
}

export function getEquipmentLevel(state: GameState, itemId: string): number {
  return Math.max(1, state.equipmentLevels?.[itemId] ?? 1)
}

export function getLeveledAttributeBonus(
  state: GameState,
  itemId: string,
  key: AttributeKey,
): number {
  const item = equipment.find((candidate) => candidate.id === itemId)
  const base = item?.bonuses[key] ?? 0
  if (!item || base <= 0) return 0
  return base * getLevelMultiplier(state, item.id, item.upgradeGrowth)
}

export function getLevelMultiplier(state: GameState, itemId: string, growth = 0.16): number {
  return 1 + (getEquipmentLevel(state, itemId) - 1) * growth
}

export function calculateEquipmentMatchBonuses(state: GameState): MatchRatings['equipment'] {
  const totals: MatchRatings['equipment'] = {
    pass: 0,
    shot: 0,
    dribble: 0,
    control: 0,
    speed: 0,
    injuryResistance: 0,
  }

  Object.values(state.equipped).forEach((itemId) => {
    const item = equipment.find((candidate) => candidate.id === itemId)
    if (!item) return
    const multiplier = getLevelMultiplier(state, item.id, item.upgradeGrowth)

    for (const [key, value] of Object.entries(item.matchBonuses ?? {}) as [
      keyof MatchRatings['equipment'],
      number,
    ][]) {
      totals[key] += value * multiplier
    }
  })

  return totals
}

export function calculateBaseOvr(state: GameState): number {
  const position = positions.find((item) => item.key === state.player.position) ?? positions[0]
  let weighted = 0
  let totalWeight = 0

  for (const key of Object.keys(state.attributes) as AttributeKey[]) {
    const value = state.attributes[key] + getEquippedAttributeBonus(state, key)
    const weight = position.weights[key] ?? 0.86
    weighted += value * weight
    totalWeight += weight
  }

  const passiveBonus = Object.entries(state.skillLevels).reduce((bonus, [skillId, level]) => {
    const skill = skills.find((item) => item.id === skillId)
    if (!skill || skill.type !== 'passive') return bonus
    return bonus + skill.effect * level
  }, 0)

  return Math.round(clamp(weighted / Math.max(totalWeight, 1) + passiveBonus, 1, 99))
}

export function calculateCurrentOvr(state: GameState): number {
  const base = calculateBaseOvr(state)
  const physical = getPhysicalCondition(state)
  const energyNorm = state.resources.energy / Math.max(state.resources.maxEnergy, 1)
  const fatiguePenalty = state.physical.fatigue * 0.09
  const injuryPenalty = state.physical.injury.active ? 8 + state.physical.injury.severity * 0.25 : 0
  const moraleBonus = (state.resources.moral - 55) * 0.045
  const energyPenalty = Math.max(0, 0.55 - energyNorm) * 12
  const conditionBonus = physical.label === 'Excelente' ? 2 : physical.label === 'Boa' ? 0.6 : 0

  return Math.round(
    clamp(base + moraleBonus + conditionBonus - fatiguePenalty - energyPenalty - injuryPenalty, 1, 99),
  )
}

export function getEffectiveAttributesWithEquipment(state: GameState): Record<AttributeKey, number> {
  const next = { ...state.attributes }
  for (const key of Object.keys(next) as AttributeKey[]) {
    next[key] = clamp(next[key] + getEquippedAttributeBonus(state, key), 1, 120)
  }
  return next
}

export function getEquippedAttributeBonus(state: GameState, key: AttributeKey): number {
  return Object.values(state.equipped).reduce((sum, itemId) => {
    if (!itemId) return sum
    return sum + getLeveledAttributeBonus(state, itemId, key)
  }, 0)
}

export function calculateMatchRatings(state: GameState): MatchRatings {
  const attributes = getEffectiveAttributesWithEquipment(state)
  const equipmentBonus = calculateEquipmentMatchBonuses(state)
  const energyNorm = state.resources.energy / Math.max(state.resources.maxEnergy, 1)
  const fatigue = state.physical.fatigue
  const moral = state.resources.moral
  const conditionPenalty =
    fatigue * 0.15 +
    Math.max(0, 0.55 - energyNorm) * 25 +
    (state.physical.injury.active ? 14 : 0)

  const pass =
    attributes.passing * 0.35 +
    attributes.vision * 0.2 +
    attributes.ballControl * 0.15 +
    attributes.tacticalIntelligence * 0.1 +
    equipmentBonus.pass * 1.8 +
    moral * 0.05 +
    energyNorm * 10 -
    fatigue * 0.15

  const shot =
    attributes.finishing * 0.3 +
    attributes.shooting * 0.25 +
    attributes.composure * 0.15 +
    attributes.ballControl * 0.1 +
    equipmentBonus.shot * 1.8 +
    moral * 0.05 +
    energyNorm * 10 -
    fatigue * 0.15

  const dribble =
    attributes.dribbling * 0.3 +
    attributes.ballControl * 0.25 +
    attributes.acceleration * 0.15 +
    attributes.speed * 0.1 +
    equipmentBonus.dribble * 1.8 +
    moral * 0.05 +
    energyNorm * 10 -
    fatigue * 0.15

  const control =
    attributes.ballControl * 0.35 +
    attributes.dribbling * 0.25 +
    attributes.speed * 0.1 +
    attributes.tacticalIntelligence * 0.1 +
    moral * 0.1 +
    energyNorm * 10 +
    equipmentBonus.control * 1.5 -
    fatigue * 0.15

  return {
    pass: clamp(pass, 1, 120),
    shot: clamp(shot, 1, 120),
    dribble: clamp(dribble, 1, 120),
    control: clamp(control, 1, 120),
    speed: clamp(attributes.speed * 0.55 + attributes.acceleration * 0.35 + equipmentBonus.speed * 2 - conditionPenalty * 0.35, 1, 120),
    defense: clamp(attributes.marking * 0.4 + attributes.tackling * 0.35 + attributes.positioning * 0.25, 1, 120),
    currentOvr: calculateCurrentOvr(state),
    baseOvr: calculateBaseOvr(state),
    equipment: equipmentBonus,
    conditionPenalty,
    fatigue,
    energyNorm,
  }
}

export function getPhysicalCondition(state: GameState): {
  label: 'Excelente' | 'Boa' | 'Regular' | 'Cansado' | 'Exausto' | 'Lesionado'
  penalty: number
  injuryRisk: number
  recommendation: string
} {
  const fatigue = state.physical.fatigue
  const energyNorm = state.resources.energy / Math.max(state.resources.maxEnergy, 1)
  const risk = calculateInjuryRisk(state)

  if (state.physical.injury.active) {
    return {
      label: 'Lesionado',
      penalty: 0.45,
      injuryRisk: risk,
      recommendation: 'Use tratamento especial antes da próxima partida.',
    }
  }

  if (fatigue >= 82 || energyNorm < 0.22) {
    return {
      label: 'Exausto',
      penalty: 0.34,
      injuryRisk: risk,
      recommendation: 'Recupere agora: sono completo ou banho de gelo.',
    }
  }

  if (fatigue >= 62 || energyNorm < 0.42) {
    return {
      label: 'Cansado',
      penalty: 0.22,
      injuryRisk: risk,
      recommendation: 'Faça recuperação antes da próxima partida.',
    }
  }

  if (fatigue >= 38 || energyNorm < 0.64) {
    return {
      label: 'Regular',
      penalty: 0.1,
      injuryRisk: risk,
      recommendation: 'Treino leve ou descanso curto é uma boa.',
    }
  }

  if (fatigue <= 15 && energyNorm > 0.85 && state.resources.moral >= 68) {
    return {
      label: 'Excelente',
      penalty: -0.04,
      injuryRisk: risk,
      recommendation: 'Momento ótimo para jogo importante.',
    }
  }

  return {
    label: 'Boa',
    penalty: 0,
    injuryRisk: risk,
    recommendation: 'Condição estável para treinar ou jogar.',
  }
}

export function calculateInjuryRisk(state: GameState): number {
  const equipmentProtection = calculateEquipmentMatchBonuses(state).injuryResistance
  const energyNorm = state.resources.energy / Math.max(state.resources.maxEnergy, 1)
  const fatigueRisk = state.physical.fatigue * 0.55
  const energyRisk = Math.max(0, 0.5 - energyNorm) * 55
  const base = state.physical.injuryRisk + fatigueRisk + energyRisk - equipmentProtection * 2
  return Math.round(clamp(base, 2, 95))
}
