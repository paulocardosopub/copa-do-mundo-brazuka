import {
  attributesConfig,
  careerStages,
  defaultAttributeValues,
  equipment,
  matchEvents,
  missions,
  narrationPool,
  opponents,
  playStyles,
  positions,
  skills,
  sponsors,
  strategies,
} from '../data/gameData'
import type {
  AttributeKey,
  CareerStats,
  CreatePlayerInput,
  EquipmentConfig,
  GameState,
  MatchEvent,
  MatchResult,
  OfflineSummary,
  Resources,
} from '../types/game'

export const SAVE_VERSION = 1

const emptyStats: CareerStats = {
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals: 0,
  assists: 0,
  titles: 0,
  finals: 0,
  finalGoals: 0,
  penalties: 0,
  bestWinStreak: 0,
  currentWinStreak: 0,
  biggestWin: 0,
  trainings: 0,
  skillsUsed: 0,
  moneyEarned: 0,
  fameEarned: 0,
}

export function createEmptyGame(): GameState {
  return {
    version: SAVE_VERSION,
    player: {
      created: false,
      name: '',
      nickname: '',
      number: 10,
      position: 'striker',
      foot: 'Destro',
      style: 'finisher',
      level: 1,
      xp: 0,
      region: 'Litoral Verde',
    },
    resources: {
      energy: 100,
      maxEnergy: 100,
      money: 500,
      stars: 0,
      fame: 0,
      fans: 10,
      moral: 62,
    },
    attributes: { ...defaultAttributeValues },
    careerStage: 0,
    sponsorMatchesLeft: 0,
    ownedEquipment: ['chuteira-bairro', 'camisa-treino'],
    equipped: {
      Chuteira: 'chuteira-bairro',
      Camisa: 'camisa-treino',
    },
    skillLevels: {
      'chute-canarinho': 1,
      'drible-rua': 1,
    },
    completedMissions: [],
    claimedChests: [],
    feed: [
      'Brazuka Feed: novo talento visto treinando no campo de bairro.',
      'Torcida local já canta o apelido do craque antes da estreia.',
    ],
    stats: { ...emptyStats },
    settings: {
      music: true,
      sound: true,
      graphics: 'Média',
      language: 'Português',
    },
    lastSeen: Date.now(),
    tutorialStep: 0,
  }
}

export function createInitialGame(input: CreatePlayerInput): GameState {
  const base = createEmptyGame()
  const position = positions.find((item) => item.key === input.position) ?? positions[0]
  const style = playStyles.find((item) => item.key === input.style) ?? playStyles[0]
  const attributes = { ...defaultAttributeValues }

  applyBoosts(attributes, position.startingBoosts)
  applyBoosts(attributes, style.boosts)

  return {
    ...base,
    player: {
      created: true,
      name: input.name.trim() || 'Craque Brazuka',
      nickname: input.nickname.trim() || 'Brazuka',
      number: clamp(Math.round(input.number), 1, 99),
      position: input.position,
      foot: input.foot,
      style: input.style,
      level: 1,
      xp: 0,
      region: input.region.trim() || 'Litoral Verde',
    },
    attributes,
    feed: [
      `Brazuka Feed: ${input.nickname || input.name || 'Brazuka'} assinou a primeira ficha da carreira.`,
      'Torcedores do bairro prometem lotar o alambrado na estreia.',
    ],
  }
}

function applyBoosts(
  attributes: Record<AttributeKey, number>,
  boosts: Partial<Record<AttributeKey, number>>,
) {
  for (const [key, value] of Object.entries(boosts) as [AttributeKey, number][]) {
    attributes[key] = clamp((attributes[key] ?? 35) + value, 1, 99)
  }
}

export function calculateEquipmentBonuses(
  state: GameState,
): Partial<Record<AttributeKey, number>> {
  const bonuses: Partial<Record<AttributeKey, number>> = {}

  Object.values(state.equipped).forEach((equipmentId) => {
    const item = equipment.find((candidate) => candidate.id === equipmentId)
    if (!item) return

    for (const [key, value] of Object.entries(item.bonuses) as [AttributeKey, number][]) {
      bonuses[key] = (bonuses[key] ?? 0) + value
    }
  })

  return bonuses
}

export function getEffectiveAttributes(state: GameState): Record<AttributeKey, number> {
  const bonuses = calculateEquipmentBonuses(state)
  const next = { ...state.attributes }

  for (const key of Object.keys(next) as AttributeKey[]) {
    next[key] = clamp(next[key] + (bonuses[key] ?? 0), 1, 99)
  }

  return next
}

export function calculateOvr(state: GameState): number {
  const position = positions.find((item) => item.key === state.player.position) ?? positions[0]
  const attributes = getEffectiveAttributes(state)
  let weighted = 0
  let totalWeight = 0

  for (const config of attributesConfig) {
    const weight = position.weights[config.key] ?? 0.86
    weighted += attributes[config.key] * weight
    totalWeight += weight
  }

  const passiveBonus = Object.entries(state.skillLevels).reduce((bonus, [skillId, level]) => {
    const skill = skills.find((item) => item.id === skillId)
    if (!skill || skill.type !== 'passive') return bonus
    return bonus + skill.effect * level
  }, 0)

  return Math.round(clamp(weighted / totalWeight + passiveBonus, 1, 99))
}

export function getXpForNextLevel(level: number): number {
  return Math.round(120 + level * 85 + level ** 1.35 * 35)
}

export function addXp(state: GameState, amount: number): GameState {
  const next = structuredClone(state)
  next.player.xp += Math.max(0, Math.round(amount))

  let needed = getXpForNextLevel(next.player.level)
  while (next.player.xp >= needed) {
    next.player.xp -= needed
    next.player.level += 1
    next.resources.maxEnergy += 3
    next.resources.energy = Math.min(next.resources.maxEnergy, next.resources.energy + 18)
    next.feed = addFeed(
      next.feed,
      `Subiu para o nível ${next.player.level}. A torcida sentiu o salto.`,
    )
    needed = getXpForNextLevel(next.player.level)
  }

  return next
}

export function getTrainingCost(state: GameState, key: AttributeKey): number {
  const attribute = attributesConfig.find((item) => item.key === key)
  const value = state.attributes[key]
  const stageDiscount = Math.min(state.careerStage * 0.025, 0.15)
  const cost = (attribute?.baseCost ?? 50) * (1 + Math.max(value - 35, 0) * 0.105)
  return Math.max(12, Math.round(cost * (1 - stageDiscount)))
}

export function trainAttribute(
  state: GameState,
  key: AttributeKey,
  requestedTimes: number | 'max',
): GameState {
  const next = structuredClone(state)
  const config = attributesConfig.find((item) => item.key === key)
  if (!config) return state

  let times = requestedTimes === 'max' ? 999 : Math.max(1, requestedTimes)
  let trained = 0
  let xp = 0

  while (times > 0 && next.attributes[key] < 99) {
    const cost = getTrainingCost(next, key)
    if (next.resources.money < cost || next.resources.energy < config.energyCost) break

    next.resources.money -= cost
    next.resources.energy -= config.energyCost
    next.attributes[key] = clamp(next.attributes[key] + 1, 1, 99)
    next.stats.trainings += 1
    trained += 1
    xp += 18 + Math.round(next.attributes[key] * 0.12)
    times -= 1
  }

  if (trained === 0) return state

  next.resources.moral = clamp(next.resources.moral + Math.ceil(trained / 3), 0, 100)
  next.tutorialStep = Math.max(next.tutorialStep, 1)
  next.feed = addFeed(
    next.feed,
    `${config.label} evoluiu ${trained}x no treino. O CT ficou barulhento hoje.`,
  )

  return addXp(next, xp)
}

export function restPlayer(state: GameState): GameState {
  const next = structuredClone(state)
  const price = Math.max(40, Math.round((next.resources.maxEnergy - next.resources.energy) * 1.8))
  if (next.resources.energy >= next.resources.maxEnergy || next.resources.money < price) return state
  next.resources.money -= price
  next.resources.energy = next.resources.maxEnergy
  next.resources.moral = clamp(next.resources.moral + 4, 0, 100)
  next.feed = addFeed(next.feed, 'Sessão de recuperação completa. Pernas leves de novo.')
  return next
}

export function buyEquipment(state: GameState, itemId: string): GameState {
  const item = equipment.find((candidate) => candidate.id === itemId)
  if (!item || state.ownedEquipment.includes(itemId) || state.resources.money < item.cost) {
    return state
  }

  const next = structuredClone(state)
  next.resources.money -= item.cost
  next.ownedEquipment.push(item.id)
  next.equipped[item.slot] = item.id
  next.feed = addFeed(next.feed, `${item.name} entrou no armário do craque.`)
  return next
}

export function equipItem(state: GameState, itemId: string): GameState {
  const item = equipment.find((candidate) => candidate.id === itemId)
  if (!item || !state.ownedEquipment.includes(itemId)) return state

  const next = structuredClone(state)
  next.equipped[item.slot] = item.id
  return next
}

export function signSponsor(state: GameState, sponsorId: string): GameState {
  const sponsor = sponsors.find((candidate) => candidate.id === sponsorId)
  if (!sponsor || state.resources.fame < sponsor.fameRequired) return state

  const next = structuredClone(state)
  next.activeSponsorId = sponsor.id
  next.sponsorMatchesLeft = sponsor.duration
  next.feed = addFeed(next.feed, `${sponsor.name} fechou contrato com a promessa Brazuka.`)

  const item = equipment.find((candidate) => candidate.name === sponsor.exclusiveItem)
  if (item && !next.ownedEquipment.includes(item.id)) {
    next.ownedEquipment.push(item.id)
  }

  return next
}

export function upgradeSkill(state: GameState, skillId: string): GameState {
  const skill = skills.find((candidate) => candidate.id === skillId)
  if (!skill || state.player.level < skill.unlockLevel) return state
  const currentLevel = state.skillLevels[skillId] ?? 0
  const cost = Math.round(skill.upgradeCost * (1 + currentLevel * 0.55))
  if (state.resources.money < cost) return state

  const next = structuredClone(state)
  next.resources.money -= cost
  next.skillLevels[skillId] = currentLevel + 1
  next.feed = addFeed(next.feed, `${skill.name} ganhou nível ${currentLevel + 1}.`)
  return next
}

export function startMatch(state: GameState, strategyKey: string): GameState {
  if (state.activeMatch?.status === 'running') return state

  const strategy = strategies.find((item) => item.key === strategyKey) ?? strategies[0]
  const matchEnergyCost = Math.round((state.careerStage >= 4 ? 25 : 15) * strategy.energy)
  if (state.resources.energy < matchEnergyCost) return state

  const next = structuredClone(state)
  const opponent = pickOpponent(next)
  next.resources.energy -= matchEnergyCost
  next.resources.moral = clamp(next.resources.moral - 1, 0, 100)
  next.activeMatch = {
    id: crypto.randomUUID(),
    opponentId: opponent.id,
    strategy: strategy.key,
    minute: 0,
    scoreFor: 0,
    scoreAgainst: 0,
    status: 'running',
    events: [
      {
        minute: 0,
        text: `${randomItem(narrationPool)} ${opponent.name} do outro lado.`,
        kind: 'neutral',
      },
    ],
    cooldowns: {},
    momentum: 0,
    skillsUsed: 0,
    startedAt: Date.now(),
  }
  next.tutorialStep = Math.max(next.tutorialStep, 2)
  return next
}

export function applyMatchSkill(state: GameState, skillId: string): GameState {
  if (!state.activeMatch || state.activeMatch.status !== 'running') return state
  const skill = skills.find((candidate) => candidate.id === skillId)
  if (!skill || skill.type !== 'manual') return state
  if ((state.skillLevels[skillId] ?? 0) <= 0 || state.player.level < skill.unlockLevel) return state
  if ((state.activeMatch.cooldowns[skillId] ?? 0) > 0) return state

  const next = structuredClone(state)
  const level = next.skillLevels[skillId] ?? 1
  next.activeMatch!.momentum += skill.effect * (1 + (level - 1) * 0.18)
  next.activeMatch!.cooldowns[skillId] = skill.cooldown
  next.activeMatch!.skillsUsed += 1
  next.stats.skillsUsed += 1

  if (skillId === 'raca-brazuka') {
    next.resources.moral = clamp(next.resources.moral + 6 + level, 0, 100)
  }

  next.activeMatch!.events = pushEvent(next.activeMatch!.events, {
    minute: next.activeMatch!.minute,
    text: `${skill.name} ativado. A arquibancada veio junto!`,
    kind: 'skill',
  })

  return next
}

export function advanceMatch(state: GameState): GameState {
  const active = state.activeMatch
  if (!active || active.status !== 'running') return state

  const next = structuredClone(state)
  const match = next.activeMatch!
  const opponent = opponents.find((item) => item.id === match.opponentId) ?? opponents[0]
  const strategy = strategies.find((item) => item.key === match.strategy) ?? strategies[0]
  const ovr = calculateOvr(next)
  const energyFactor = next.resources.energy / Math.max(next.resources.maxEnergy, 1)
  const moraleFactor = (next.resources.moral - 50) * 0.16
  const stagePressure = next.careerStage >= 4 ? -2 : 0
  const teamSupport = 12 + next.careerStage * 2
  const balance =
    ovr +
    teamSupport +
    strategy.attack +
    strategy.defense +
    match.momentum +
    moraleFactor +
    energyFactor * 8 +
    stagePressure -
    opponent.ovr

  const minuteJump = randomInt(7, 12)
  match.minute = Math.min(90, match.minute + minuteJump)
  match.momentum = Math.max(0, match.momentum - 2.8)

  for (const key of Object.keys(match.cooldowns)) {
    match.cooldowns[key] = Math.max(0, match.cooldowns[key] - minuteJump)
  }

  const chanceFor = clamp(0.2 + balance / 175 + strategy.attack / 220, 0.08, 0.72)
  const chanceAgainst = clamp(0.18 - balance / 210 + strategy.risk, 0.06, 0.68)
  const roll = Math.random()

  if (roll < chanceFor * 0.5) {
    match.scoreFor += 1
    match.events = pushEvent(match.events, {
      minute: match.minute,
      text: randomItem(matchEvents.goal),
      kind: 'goal',
    })
  } else if (roll < chanceFor) {
    match.events = pushEvent(match.events, {
      minute: match.minute,
      text: randomItem(matchEvents.good),
      kind: 'good',
    })
    if (Math.random() < 0.26) {
      next.stats.assists += 1
    }
  } else if (roll < chanceFor + chanceAgainst * 0.42) {
    match.scoreAgainst += 1
    match.events = pushEvent(match.events, {
      minute: match.minute,
      text: `${opponent.name} achou espaço e marcou.`,
      kind: 'bad',
    })
  } else if (roll < chanceFor + chanceAgainst) {
    match.events = pushEvent(match.events, {
      minute: match.minute,
      text: randomItem(matchEvents.bad),
      kind: 'bad',
    })
  } else {
    match.events = pushEvent(match.events, {
      minute: match.minute,
      text: randomItem(matchEvents.neutral),
      kind: 'neutral',
    })
  }

  if (match.minute >= 90) {
    return finishMatch(next)
  }

  return next
}

export function skipMatch(state: GameState): GameState {
  let next = state
  while (next.activeMatch?.status === 'running') {
    next = advanceMatch(next)
  }
  return next
}

function finishMatch(state: GameState): GameState {
  const next = structuredClone(state)
  const match = next.activeMatch
  if (!match) return state

  const opponent = opponents.find((item) => item.id === match.opponentId) ?? opponents[0]
  const outcome =
    match.scoreFor > match.scoreAgainst ? 'win' : match.scoreFor === match.scoreAgainst ? 'draw' : 'loss'
  const goals = match.scoreFor
  const sponsor = sponsors.find((candidate) => candidate.id === next.activeSponsorId)
  const moneyMultiplier = 1 + (sponsor?.moneyBonus ?? 0)
  const xpMultiplier = 1 + (sponsor?.xpBonus ?? 0)
  const passiveFameMultiplier = 1 + ((next.skillLevels['idolo-torcida'] ?? 0) * 0.08)
  const outcomeMoney = outcome === 'win' ? opponent.reward : outcome === 'draw' ? opponent.reward * 0.55 : opponent.reward * 0.28
  const baseXp = outcome === 'win' ? 105 : outcome === 'draw' ? 70 : 48
  const money = Math.round((outcomeMoney + goals * (60 + (sponsor?.goalBonus ?? 0))) * moneyMultiplier)
  const xp = Math.round((baseXp + goals * 35 + match.skillsUsed * 12) * xpMultiplier)
  const fame = Math.round((opponent.fame * (outcome === 'win' ? 1.35 : 0.55) + goals * 18) * passiveFameMultiplier)
  const fans = Math.max(1, Math.round((outcome === 'win' ? 18 : outcome === 'draw' ? 8 : 3) + goals * 5))

  next.resources.money += money
  next.resources.fame += fame
  next.resources.fans += fans
  next.resources.moral = clamp(
    next.resources.moral + (outcome === 'win' ? 8 : outcome === 'draw' ? 2 : -7) + goals,
    0,
    100,
  )
  next.stats.matches += 1
  next.stats.goals += goals
  next.stats.moneyEarned += money
  next.stats.fameEarned += fame

  if (outcome === 'win') {
    next.stats.wins += 1
    next.stats.currentWinStreak += 1
    next.stats.bestWinStreak = Math.max(next.stats.bestWinStreak, next.stats.currentWinStreak)
    next.stats.biggestWin = Math.max(next.stats.biggestWin, match.scoreFor - match.scoreAgainst)
  } else if (outcome === 'draw') {
    next.stats.draws += 1
    next.stats.currentWinStreak = 0
  } else {
    next.stats.losses += 1
    next.stats.currentWinStreak = 0
  }

  if (next.sponsorMatchesLeft > 0) {
    next.sponsorMatchesLeft -= 1
    if (next.sponsorMatchesLeft === 0) {
      next.activeSponsorId = undefined
    }
  }

  if (outcome === 'win' && calculateOvr(next) >= careerStages[next.careerStage + 1]?.recommendedOvr) {
    next.careerStage = Math.min(next.careerStage + 1, careerStages.length - 1)
    next.stats.titles += next.careerStage === 4 ? 1 : 0
    next.feed = addFeed(
      next.feed,
      `Nova fase desbloqueada: ${careerStages[next.careerStage].label}.`,
    )
  }

  const result: MatchResult = {
    opponent: opponent.name,
    scoreFor: match.scoreFor,
    scoreAgainst: match.scoreAgainst,
    outcome,
    rewards: { money, xp, fame, fans },
    events: pushEvent(match.events, {
      minute: 90,
      text:
        outcome === 'win'
          ? 'Apito final. Vitória com festa verde-amarela!'
          : outcome === 'draw'
            ? 'Apito final. Empate suado até o último lance.'
            : 'Apito final. Derrota, treino e volta por cima.',
      kind: outcome === 'win' ? 'good' : outcome === 'draw' ? 'neutral' : 'bad',
    }),
  }

  next.lastResult = result
  next.activeMatch = { ...match, status: 'finished', events: result.events }
  next.tutorialStep = Math.max(next.tutorialStep, 3)
  next.feed = addFeed(
    next.feed,
    `${next.player.nickname} ${formatOutcome(outcome)} contra ${opponent.name}: ${match.scoreFor}x${match.scoreAgainst}.`,
  )

  return addXp(next, xp)
}

export function clearFinishedMatch(state: GameState): GameState {
  if (state.activeMatch?.status !== 'finished') return state
  const next = structuredClone(state)
  delete next.activeMatch
  return next
}

export function applyOfflineProgress(state: GameState, now = Date.now()): GameState {
  const minutes = Math.max(0, Math.floor((now - state.lastSeen) / 60000))
  if (minutes < 5) {
    return { ...state, lastSeen: now }
  }

  const cappedMinutes = Math.min(minutes, 8 * 60)
  const sponsor = sponsors.find((candidate) => candidate.id === state.activeSponsorId)
  const summary: OfflineSummary = {
    minutes,
    money: Math.round(cappedMinutes * (2.2 + state.careerStage * 0.8) * (1 + (sponsor?.moneyBonus ?? 0))),
    xp: Math.round(cappedMinutes * 0.85),
    energy: Math.round(cappedMinutes * 0.8),
    fame: Math.round(cappedMinutes * (sponsor ? 0.4 : 0.08)),
    fans: Math.round(cappedMinutes * ((state.skillLevels['idolo-torcida'] ?? 0) > 0 ? 0.22 : 0.07)),
  }

  const next = structuredClone(state)
  next.resources.money += summary.money
  next.resources.energy = Math.min(next.resources.maxEnergy, next.resources.energy + summary.energy)
  next.resources.fame += summary.fame
  next.resources.fans += summary.fans
  next.stats.moneyEarned += summary.money
  next.stats.fameEarned += summary.fame
  next.offlineSummary = summary
  next.lastSeen = now

  return addXp(next, summary.xp)
}

export function dismissOfflineSummary(state: GameState): GameState {
  if (!state.offlineSummary) return state
  const next = structuredClone(state)
  delete next.offlineSummary
  return next
}

export function resetProgress(): GameState {
  return createEmptyGame()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getProgressForMission(state: GameState, metric: string): number {
  switch (metric) {
    case 'trainings':
      return state.stats.trainings
    case 'matches':
      return state.stats.matches
    case 'goals':
      return state.stats.goals
    case 'wins':
      return state.stats.wins
    case 'skillsUsed':
      return state.stats.skillsUsed
    case 'moneyEarned':
      return state.stats.moneyEarned
    case 'fameEarned':
      return state.stats.fameEarned
    case 'titles':
      return state.stats.titles
    default:
      return 0
  }
}

export function claimMissionReward(state: GameState, missionId: string): GameState {
  const mission = missions.find((item) => item.id === missionId)
  if (!mission || state.completedMissions.includes(missionId)) return state
  if (getProgressForMission(state, mission.metric) < mission.target) return state

  let next = structuredClone(state)
  next.completedMissions.push(missionId)
  next.resources = addResources(next.resources, mission.reward)
  if (mission.reward.chest) next.claimedChests.push(mission.reward.chest)
  next.feed = addFeed(next.feed, `Missão concluída: ${mission.label}. Recompensa recebida.`)
  if (mission.reward.xp) next = addXp(next, mission.reward.xp)
  return next
}

function addResources(resources: Resources, reward: Partial<Resources>): Resources {
  return {
    ...resources,
    energy: Math.min(resources.maxEnergy, resources.energy + (reward.energy ?? 0)),
    money: resources.money + (reward.money ?? 0),
    stars: resources.stars + (reward.stars ?? 0),
    fame: resources.fame + (reward.fame ?? 0),
    fans: resources.fans + (reward.fans ?? 0),
    moral: clamp(resources.moral + (reward.moral ?? 0), 0, 100),
  }
}

function pickOpponent(state: GameState) {
  const stageOpponents = opponents.filter((opponent) => opponent.stage <= state.careerStage)
  const list = stageOpponents.length ? stageOpponents : opponents
  return list[state.stats.matches % list.length]
}

function addFeed(feed: string[], text: string): string[] {
  return [text, ...feed].slice(0, 12)
}

function pushEvent(events: MatchEvent[], event: MatchEvent): MatchEvent[] {
  return [...events, event].slice(-8)
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatOutcome(outcome: MatchResult['outcome']) {
  if (outcome === 'win') return 'venceu'
  if (outcome === 'draw') return 'empatou'
  return 'perdeu'
}

export function getEquipmentBySlot(
  state: GameState,
  slot: EquipmentConfig['slot'],
): EquipmentConfig[] {
  return equipment.filter((item) => item.slot === slot && state.ownedEquipment.includes(item.id))
}
