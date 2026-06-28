export const FIELD_CONFIG = {
  width: 8.6,
  depth: 6.35,
  goalWidth: 1.75,
  goalDepth: 0.35,
}

export const BALL_CONFIG = {
  radius: 0.22,
  mass: 0.45,
  friction: 0.75,
  restitution: 0.25,
  linearDamping: 0.35,
  angularDamping: 0.45,
  maxSpeed: 7.8,
  groundDrag: 0.985,
  stuckVelocityThreshold: 0.05,
  outOfBoundsResetDelay: 1.5,
}

export const PLAYER_CONFIG = {
  radius: 0.22,
  maxSpeed: 2.45,
  goalkeeperSpeed: 2.05,
  acceleration: 8.6,
  deceleration: 10.4,
  turnRate: 9,
  separationRadius: 0.62,
  ballControlDistance: 0.43,
  tackleDistance: 0.48,
  receiveDistance: 0.48,
}

export const MATCH_CONFIG = {
  fixedDt: 1 / 30,
  secondsPerTick: 0.28,
  secondsPerMatchMinute: 2.15,
  aiDecisionInterval: 0.25,
  maxEvents: 9,
}

export const HOME_SHAPE = [
  { role: 'goalkeeper', x: 0, z: 2.88 },
  { role: 'defender', x: -1.45, z: 1.75 },
  { role: 'midfielder', x: 0.15, z: 0.55 },
  { role: 'winger', x: 1.65, z: 0.1 },
  { role: 'striker', x: -0.25, z: -1.15 },
] as const

export const AWAY_SHAPE = [
  { role: 'goalkeeper', x: 0, z: -2.88 },
  { role: 'defender', x: 1.45, z: -1.75 },
  { role: 'midfielder', x: -0.15, z: -0.55 },
  { role: 'winger', x: -1.65, z: -0.1 },
  { role: 'striker', x: 0.25, z: 1.15 },
] as const
