import type { MatchBallState, MatchPlayerSim, MatchTeam, Vec2 } from '../types/game'
import { BALL_CONFIG, FIELD_CONFIG, PLAYER_CONFIG } from './MatchConfig'
import { add, clamp, distance, length, normalize, scale, sub } from './MatchMath'

export function createBall(): MatchBallState {
  return {
    position: { x: 0, z: 0 },
    velocity: { x: 0, z: 0 },
    angularVelocity: 0,
    outOfBoundsTimer: 0,
    stuckTimer: 0,
  }
}

export function applyBallImpulse(ball: MatchBallState, impulse: Vec2) {
  const velocity = add(ball.velocity, scale(impulse, 1 / BALL_CONFIG.mass))
  const speed = length(velocity)
  ball.velocity =
    speed > BALL_CONFIG.maxSpeed ? scale(normalize(velocity), BALL_CONFIG.maxSpeed) : velocity
  ball.angularVelocity = clamp(ball.angularVelocity + speed * 0.22, -12, 12)
  ball.ownerId = undefined
}

export function updateBall(
  ball: MatchBallState,
  players: MatchPlayerSim[],
  dt: number,
): { goal?: MatchTeam; resetReason?: string } {
  const owner = ball.ownerId ? players.find((player) => player.id === ball.ownerId) : undefined

  if (owner) {
    const footOffset = {
      x: Math.sin(owner.facing) * 0.26,
      z: Math.cos(owner.facing) * 0.26 * (owner.team === 'home' ? -1 : 1),
    }
    const desired = add(owner.position, footOffset)
    const delta = sub(desired, ball.position)
    ball.velocity = add(scale(ball.velocity, 0.68), scale(delta, 11 * dt))
    ball.position = add(ball.position, scale(ball.velocity, dt))
  } else {
    ball.position = add(ball.position, scale(ball.velocity, dt))
    ball.velocity = scale(ball.velocity, Math.pow(BALL_CONFIG.groundDrag, dt * 60))
    ball.velocity = scale(ball.velocity, Math.max(0, 1 - BALL_CONFIG.linearDamping * dt))
    ball.angularVelocity *= Math.max(0, 1 - BALL_CONFIG.angularDamping * dt)
  }

  resolvePlayerTouches(ball, players)

  const goal = detectGoal(ball)
  if (goal) return { goal }

  const halfWidth = FIELD_CONFIG.width / 2
  const halfDepth = FIELD_CONFIG.depth / 2

  if (Math.abs(ball.position.x) > halfWidth + 0.45 || Math.abs(ball.position.z) > halfDepth + 0.55) {
    ball.outOfBoundsTimer += dt
    if (ball.outOfBoundsTimer >= BALL_CONFIG.outOfBoundsResetDelay) {
      resetBall(ball)
      return { resetReason: 'Bola saiu do campo e voltou ao centro.' }
    }
  } else {
    ball.outOfBoundsTimer = 0
  }

  if (length(ball.velocity) < BALL_CONFIG.stuckVelocityThreshold && !ball.ownerId) {
    ball.stuckTimer += dt
    if (ball.stuckTimer > 2.2) {
      const nearest = nearestPlayer(players, ball.position)
      ball.ownerId = nearest?.id
      ball.lastTouchTeam = nearest?.team
      ball.stuckTimer = 0
      return { resetReason: 'Bola presa: posse devolvida ao jogador mais próximo.' }
    }
  } else {
    ball.stuckTimer = 0
  }

  ball.position.x = clamp(ball.position.x, -halfWidth - 0.35, halfWidth + 0.35)
  ball.position.z = clamp(ball.position.z, -halfDepth - 0.45, halfDepth + 0.45)

  return {}
}

export function resetBall(ball: MatchBallState, ownerId?: string) {
  ball.position = { x: 0, z: 0 }
  ball.velocity = { x: 0, z: 0 }
  ball.angularVelocity = 0
  ball.ownerId = ownerId
  ball.targetPlayerId = undefined
  ball.outOfBoundsTimer = 0
  ball.stuckTimer = 0
}

export function detectGoal(ball: MatchBallState): MatchTeam | undefined {
  const goalLine = FIELD_CONFIG.depth / 2
  const insideGoal = Math.abs(ball.position.x) <= FIELD_CONFIG.goalWidth / 2

  if (!insideGoal) return undefined
  if (ball.position.z < -goalLine) return 'home'
  if (ball.position.z > goalLine) return 'away'
  return undefined
}

function resolvePlayerTouches(ball: MatchBallState, players: MatchPlayerSim[]) {
  if (ball.ownerId) return

  for (const player of players) {
    const dist = distance(player.position, ball.position)
    if (dist > player.radius + BALL_CONFIG.radius + 0.04) continue

    const away = normalize(sub(ball.position, player.position))
    const overlap = player.radius + BALL_CONFIG.radius + 0.04 - dist
    ball.position = add(ball.position, scale(away, overlap))
    ball.velocity = add(scale(ball.velocity, BALL_CONFIG.restitution), scale(away, 0.25))

    if (
      ball.targetPlayerId === player.id ||
      dist < PLAYER_CONFIG.ballControlDistance ||
      length(ball.velocity) < 1.4
    ) {
      ball.ownerId = player.id
      ball.lastTouchTeam = player.team
      ball.targetPlayerId = undefined
      player.state = 'Conduzindo bola'
    }
  }
}

function nearestPlayer(players: MatchPlayerSim[], position: Vec2): MatchPlayerSim | undefined {
  return players.reduce<MatchPlayerSim | undefined>((nearest, player) => {
    if (!nearest) return player
    return distance(player.position, position) < distance(nearest.position, position) ? player : nearest
  }, undefined)
}
