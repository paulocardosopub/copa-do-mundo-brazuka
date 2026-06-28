export type Screen =
  | 'home'
  | 'training'
  | 'match'
  | 'career'
  | 'player'
  | 'shop'

export type AttributeKey =
  | 'shooting'
  | 'finishing'
  | 'shotPower'
  | 'heading'
  | 'dribbling'
  | 'ballControl'
  | 'passing'
  | 'vision'
  | 'crossing'
  | 'setPieces'
  | 'speed'
  | 'acceleration'
  | 'stamina'
  | 'strength'
  | 'jumping'
  | 'marking'
  | 'tackling'
  | 'positioning'
  | 'combativeness'
  | 'leadership'
  | 'composure'
  | 'charisma'
  | 'tacticalIntelligence'

export type PositionKey =
  | 'striker'
  | 'winger'
  | 'midfielder'
  | 'holding'
  | 'defender'
  | 'fullback'

export type PlayStyleKey =
  | 'finisher'
  | 'dribbler'
  | 'maestro'
  | 'gritty'
  | 'sprinter'
  | 'stopper'
  | 'captain'
  | 'showman'

export type StrategyKey =
  | 'balanced'
  | 'offensive'
  | 'defensive'
  | 'counter'
  | 'possession'
  | 'pressing'

export type Rarity =
  | 'Comum'
  | 'Incomum'
  | 'Raro'
  | 'Épico'
  | 'Lendário'
  | 'Brazuka Mítico'

export interface AttributeConfig {
  key: AttributeKey
  label: string
  short: string
  group: 'Ataque' | 'Criação' | 'Físico' | 'Defesa' | 'Mental'
  description: string
  baseCost: number
  energyCost: number
  color: string
}

export interface PositionConfig {
  key: PositionKey
  label: string
  recommendedSkills: string[]
  weights: Partial<Record<AttributeKey, number>>
  startingBoosts: Partial<Record<AttributeKey, number>>
}

export interface PlayStyleConfig {
  key: PlayStyleKey
  label: string
  boosts: Partial<Record<AttributeKey, number>>
}

export interface StrategyConfig {
  key: StrategyKey
  label: string
  attack: number
  defense: number
  energy: number
  risk: number
  description: string
}

export interface OpponentConfig {
  id: string
  name: string
  ovr: number
  style: string
  attack: number
  defense: number
  reward: number
  fame: number
  stage: number
}

export interface CareerStageConfig {
  id: string
  label: string
  setting: string
  recommendedOvr: number
  reward: string
  unlocks: string[]
}

export interface SponsorConfig {
  id: string
  name: string
  tier: string
  fameRequired: number
  moneyBonus: number
  xpBonus: number
  goalBonus: number
  duration: number
  exclusiveItem?: string
}

export interface EquipmentConfig {
  id: string
  name: string
  slot: 'Chuteira' | 'Camisa' | 'Short' | 'Meião' | 'Caneleira' | 'Faixa' | 'Bola' | 'Amuleto'
  rarity: Rarity
  cost: number
  bonuses: Partial<Record<AttributeKey, number>>
  visual: string
}

export interface SkillConfig {
  id: string
  name: string
  type: 'manual' | 'passive'
  cooldown: number
  unlockLevel: number
  upgradeCost: number
  effect: number
  description: string
}

export interface MissionConfig {
  id: string
  label: string
  target: number
  kind: 'daily' | 'weekly' | 'career'
  metric:
    | 'trainings'
    | 'matches'
    | 'goals'
    | 'wins'
    | 'skillsUsed'
    | 'moneyEarned'
    | 'fameEarned'
    | 'titles'
  reward: Partial<Resources> & { xp?: number; chest?: string }
}

export interface RivalConfig {
  id: string
  name: string
  style: string
  ovr: number
  personality: string
  reward: string
}

export interface Resources {
  energy: number
  maxEnergy: number
  money: number
  stars: number
  fame: number
  fans: number
  moral: number
}

export interface PlayerProfile {
  created: boolean
  name: string
  nickname: string
  number: number
  position: PositionKey
  foot: 'Destro' | 'Canhoto'
  style: PlayStyleKey
  level: number
  xp: number
  region: string
}

export interface MatchEvent {
  minute: number
  text: string
  kind: 'neutral' | 'good' | 'bad' | 'goal' | 'skill'
}

export interface ActiveMatch {
  id: string
  opponentId: string
  strategy: StrategyKey
  minute: number
  scoreFor: number
  scoreAgainst: number
  events: MatchEvent[]
  status: 'running' | 'finished'
  cooldowns: Record<string, number>
  momentum: number
  skillsUsed: number
  startedAt: number
}

export interface MatchResult {
  opponent: string
  scoreFor: number
  scoreAgainst: number
  outcome: 'win' | 'draw' | 'loss'
  rewards: {
    money: number
    xp: number
    fame: number
    fans: number
  }
  events: MatchEvent[]
}

export interface CareerStats {
  matches: number
  wins: number
  draws: number
  losses: number
  goals: number
  assists: number
  titles: number
  finals: number
  finalGoals: number
  penalties: number
  bestWinStreak: number
  currentWinStreak: number
  biggestWin: number
  trainings: number
  skillsUsed: number
  moneyEarned: number
  fameEarned: number
}

export interface SettingsState {
  music: boolean
  sound: boolean
  graphics: 'Baixa' | 'Média' | 'Alta'
  language: 'Português'
}

export interface OfflineSummary {
  minutes: number
  money: number
  xp: number
  energy: number
  fame: number
  fans: number
}

export interface GameState {
  version: number
  player: PlayerProfile
  resources: Resources
  attributes: Record<AttributeKey, number>
  careerStage: number
  activeSponsorId?: string
  sponsorMatchesLeft: number
  ownedEquipment: string[]
  equipped: Partial<Record<EquipmentConfig['slot'], string>>
  skillLevels: Record<string, number>
  completedMissions: string[]
  claimedChests: string[]
  activeMatch?: ActiveMatch
  lastResult?: MatchResult
  feed: string[]
  stats: CareerStats
  settings: SettingsState
  lastSeen: number
  tutorialStep: number
  offlineSummary?: OfflineSummary
}

export interface CreatePlayerInput {
  name: string
  nickname: string
  number: number
  position: PositionKey
  foot: 'Destro' | 'Canhoto'
  style: PlayStyleKey
  region: string
}
