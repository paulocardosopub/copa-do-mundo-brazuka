import type { MatchPlayerSim, Vec2 } from '../types/game'
import { FIELD_CONFIG, PLAYER_CONFIG } from './MatchConfig'
import {
  add,
  clamp,
  clampVecToField,
  distance,
  length,
  limit,
  moveToward,
  normalize,
  scale,
  sub,
} from './MatchMath'

export function updatePlayers(players: MatchPlayerSim[], dt: number) {
  for (const player of players) {
    const desired = getDesiredVelocity(player)
    const acceleration = PLAYER_CONFIG.acceleration * dt
    player.velocity = moveToward(player.velocity, desired, acceleration)
    player.velocity = add(player.velocity, separation(player, players, dt))
    player.velocity = limit(player.velocity, player.maxSpeed)

    if (length(player.velocity) < 0.025 && distance(player.position, player.target) < 0.1) {
      player.velocity = { x: 0, z: 0 }
      if (player.state !== 'Conduzindo bola') player.state = 'Posicionando'
    }

    player.position = add(player.position, scale(player.velocity, dt))
    player.position = clampVecToField(
      player.position,
      FIELD_CONFIG.width / 2 - player.radius,
      FIELD_CONFIG.depth / 2 - player.radius,
    )

    const speed = length(player.velocity)
    if (speed > 0.05) {
      const targetFacing = Math.atan2(player.velocity.x, Math.abs(player.velocity.z) + 0.0001)
      player.facing = clampAngle(
        player.facing,
        targetFacing,
        PLAYER_CONFIG.turnRate * dt,
      )
    }

    player.stamina = clamp(player.stamina - speed * dt * 0.18, 0, 100)
  }
}

export function setTarget(player: MatchPlayerSim, target: Vec2, state: MatchPlayerSim['state']) {
  player.target = clampVecToField(
    target,
    FIELD_CONFIG.width / 2 - player.radius,
    FIELD_CONFIG.depth / 2 - player.radius,
  )
  player.state = state
}

function getDesiredVelocity(player: MatchPlayerSim): Vec2 {
  const toTarget = sub(player.target, player.position)
  const dist = length(toTarget)
  if (dist <= 0.05) return { x: 0, z: 0 }

  const arriveRadius = player.role === 'goalkeeper' ? 0.3 : 0.55
  const speedFactor = clamp(dist / arriveRadius, 0.2, 1)
  return scale(normalize(toTarget), player.maxSpeed * speedFactor)
}

function separation(player: MatchPlayerSim, players: MatchPlayerSim[], dt: number): Vec2 {
  let force = { x: 0, z: 0 }

  for (const other of players) {
    if (other.id === player.id) continue
    const dist = distance(player.position, other.position)
    if (dist <= 0.001 || dist > PLAYER_CONFIG.separationRadius) continue
    const push = scale(normalize(sub(player.position, other.position)), (PLAYER_CONFIG.separationRadius - dist) * 2.4)
    force = add(force, push)
  }

  return scale(force, dt)
}

function clampAngle(current: number, target: number, maxDelta: number): number {
  let delta = target - current
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return current + clamp(delta, -maxDelta, maxDelta)
}
