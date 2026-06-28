export type Screen =
  | 'home'
  | 'training'
  | 'match'
  | 'career'
  | 'player'
  | 'recovery'
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
  matchBonuses?: Partial<Record<'pass' | 'shot' | 'dribble' | 'control' | 'speed' | 'injuryResistance', number>>
  trainingBonus?: Partial<Record<AttributeKey, number>>
  recoveryBonus?: number
  upgradeBaseCost?: number
  upgradeGrowth?: number
  visual: string
}

export interface TrainingDrillConfig {
  id: string
  name: string
  focus: string
  description: string
  attributes: Partial<Record<AttributeKey, number>>
  energyCost: number
  moneyCost: number
  fatigue: number
  animation: 'shoot' | 'dribble' | 'pass' | 'run' | 'header' | 'defense' | 'tactics' | 'recover'
}

export interface RecoveryOptionConfig {
  id: string
  name: string
  description: string
  cost: number
  energyGain: number
  fatigueReduction: number
  moralGain: number
  injuryRiskReduction: number
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

export interface InjuryState {
  active: boolean
  label?: string
  severity: number
  matchesLeft: number
}

export interface PhysicalState {
  fatigue: number
  injuryRisk: number
  injury: InjuryState
  nextTrainingBoost: number
  recoveryHistory: string[]
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
  kind: 'neutral' | 'good' | 'bad' | 'goal' | 'skill' | 'debug'
}

export type MatchTeam = 'home' | 'away'
export type MatchPlayerRole =
  | 'goalkeeper'
  | 'defender'
  | 'midfielder'
  | 'winger'
  | 'striker'

export type MatchPlayerState =
  | 'Idle'
  | 'Posicionando'
  | 'Correndo para espaço'
  | 'Recebendo passe'
  | 'Conduzindo bola'
  | 'Driblando'
  | 'Preparando passe'
  | 'Passando'
  | 'Preparando chute'
  | 'Chutando'
  | 'Marcando'
  | 'Tentando desarme'
  | 'Interceptando passe'
  | 'Recuando'
  | 'Comemorando'
  | 'Reagindo a gol'
  | 'Recuperando fôlego'

export interface Vec2 {
  x: number
  z: number
}

export interface MatchBallState {
  position: Vec2
  velocity: Vec2
  angularVelocity: number
  ownerId?: string
  targetPlayerId?: string
  lastTouchTeam?: MatchTeam
  outOfBoundsTimer: number
  stuckTimer: number
}

export interface MatchPlayerSim {
  id: string
  name: string
  team: MatchTeam
  role: MatchPlayerRole
  state: MatchPlayerState
  position: Vec2
  velocity: Vec2
  target: Vec2
  homePosition: Vec2
  facing: number
  radius: number
  maxSpeed: number
  stamina: number
  decisionCooldown: number
  currentDecision: 'hold' | 'pass' | 'dribble' | 'shoot' | 'mark' | 'intercept'
  debug: {
    pass: number
    shot: number
    dribble: number
    reason: string
  }
}

export interface MatchEngineDebug {
  ballSpeed: number
  possession: string
  playerState: MatchPlayerState
  decision: string
  passChance: number
  shotChance: number
  dribbleChance: number
  lastError: string
}

export interface MatchEngineState {
  tick: number
  elapsedSeconds: number
  aiTimer: number
  ball: MatchBallState
  players: MatchPlayerSim[]
  debug: MatchEngineDebug
  lastActionText: string
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
  engine: MatchEngineState
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
  fatigue: number
  moral: number
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
  equipmentLevels: Record<string, number>
  equipped: Partial<Record<EquipmentConfig['slot'], string>>
  skillLevels: Record<string, number>
  completedMissions: string[]
  claimedChests: string[]
  activeMatch?: ActiveMatch
  lastResult?: MatchResult
  feed: string[]
  stats: CareerStats
  settings: SettingsState
  physical: PhysicalState
  lastTraining?: {
    drill: string
    quality: 'Normal' | 'Bom' | 'Ótimo' | 'Perfeito'
    xp: number
    fatigue: number
    attributes: Partial<Record<AttributeKey, number>>
    text: string
  }
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
