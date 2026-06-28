import type { Vec2 } from '../types/game'

export function vec(x = 0, z = 0): Vec2 {
  return { x, z }
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z }
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, z: a.z - b.z }
}

export function scale(a: Vec2, value: number): Vec2 {
  return { x: a.x * value, z: a.z * value }
}

export function length(a: Vec2): number {
  return Math.hypot(a.x, a.z)
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b))
}

export function normalize(a: Vec2): Vec2 {
  const size = length(a)
  if (size <= 0.0001) return { x: 0, z: 0 }
  return { x: a.x / size, z: a.z / size }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampVecToField(position: Vec2, halfWidth: number, halfDepth: number): Vec2 {
  return {
    x: clamp(position.x, -halfWidth, halfWidth),
    z: clamp(position.z, -halfDepth, halfDepth),
  }
}

export function limit(a: Vec2, max: number): Vec2 {
  const size = length(a)
  if (size <= max) return a
  return scale(normalize(a), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

export function moveToward(current: Vec2, target: Vec2, maxDelta: number): Vec2 {
  const delta = sub(target, current)
  const size = length(delta)
  if (size <= maxDelta || size <= 0.0001) return target
  return add(current, scale(delta, maxDelta / size))
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.z * b.z
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function signedGoalZ(team: 'home' | 'away'): number {
  return team === 'home' ? -1 : 1
}
