import type { MatchBallState, MatchPlayerSim, MatchTeam, Vec2 } from '../types/game'
import type { MatchRatings } from './MatchBalance'
import { applyBallImpulse } from './BallPhysics'
import { FIELD_CONFIG, MATCH_CONFIG } from './MatchConfig'
import { add, clamp, distance, length, normalize, randomRange, scale, sub } from './MatchMath'
import { setTarget } from './PlayerController'

export interface TeamAIResult {
  text?: string
}

export function updateTeamAI(
  players: MatchPlayerSim[],
  ball: MatchBallState,
  ratings: MatchRatings,
  opponentOvr: number,
  dt: number,
): TeamAIResult {
  const owner = ball.ownerId ? players.find((player) => player.id === ball.ownerId) : undefined

  for (const player of players) {
    player.decisionCooldown = Math.max(0, player.decisionCooldown - dt)
  }

  if (!owner) {
    assignLooseBallTargets(players, ball)
    return {}
  }

  const result = owner.team === 'home'
    ? decideHomePossession(owner, players, ball, ratings, opponentOvr)
    : decideAwayPossession(owner, players, ball, ratings, opponentOvr)

  assignSupportRuns(players, owner, ball)
  return result
}

function decideHomePossession(
  owner: MatchPlayerSim,
  players: MatchPlayerSim[],
  ball: MatchBallState,
  ratings: MatchRatings,
  opponentOvr: number,
): TeamAIResult {
  if (owner.decisionCooldown > 0) return {}
  owner.decisionCooldown = MATCH_CONFIG.aiDecisionInterval

  const pressure = nearestOpponentPressure(owner, players)
  const goal = { x: 0, z: -FIELD_CONFIG.depth / 2 }
  const distGoal = distance(owner.position, goal)
  const angleScore = 1 - Math.min(Math.abs(owner.position.x) / (FIELD_CONFIG.width / 2), 1)
  const chanceGoal = clamp((ratings.shot - opponentOvr * 0.55) / 100 + (2.7 - distGoal) * 0.18, 0, 1)
  const passTarget = choosePassTarget(owner, players, ratings)
  const passRisk = passTarget ? interceptionRisk(owner.position, passTarget.position, players, 'away') : 1
  const spaceAhead = clamp((owner.position.z + FIELD_CONFIG.depth / 2) / FIELD_CONFIG.depth, 0, 1)
  const markerGap = clamp(1 - pressure / 1.4, 0, 1)

  const scoreShot =
    chanceGoal * 0.45 +
    angleScore * 0.2 +
    (ratings.shot / 120) * 0.2 +
    markerGap * 0.15 +
    randomRange(-0.04, 0.04)

  const scorePass =
    (passTarget ? 0.3 : 0) +
    (passTarget ? clamp(1 - Math.abs(distance(owner.position, passTarget.position) - 1.7) / 3.2, 0, 1) * 0.2 : 0) +
    (ratings.pass / 120) * 0.2 +
    (1 - passRisk) * 0.2 +
    forwardValue(passTarget?.position ?? owner.position, 'home') * 0.1 +
    randomRange(-0.04, 0.04)

  const scoreDribble =
    spaceAhead * 0.25 +
    (ratings.dribble / 120) * 0.3 +
    (ratings.speed / 120) * 0.15 +
    markerGap * 0.2 +
    randomRange(-0.04, 0.04)

  owner.debug = {
    pass: Math.round(scorePass * 100),
    shot: Math.round(scoreShot * 100),
    dribble: Math.round(scoreDribble * 100),
    reason: 'IA avaliou passe, chute e drible.',
  }

  if (scoreShot > 0.52 && scoreShot >= scorePass && scoreShot >= scoreDribble) {
    shoot(owner, ball, ratings, goal, pressure)
    return { text: `Chute calculado: qualidade ${owner.debug.shot}% rumo ao gol.` }
  }

  if (passTarget && scorePass > 0.48 && scorePass >= scoreDribble) {
    pass(owner, passTarget, ball, ratings, passRisk)
    return { text: `Passe com alvo: ${passTarget.name} recebeu a intenção da jogada.` }
  }

  dribble(owner, ball, ratings, pressure)
  return { text: `Drible escolhido: espaço e controle venceram a pressão.` }
}

function decideAwayPossession(
  owner: MatchPlayerSim,
  players: MatchPlayerSim[],
  ball: MatchBallState,
  ratings: MatchRatings,
  opponentOvr: number,
): TeamAIResult {
  if (owner.decisionCooldown > 0) return {}
  owner.decisionCooldown = MATCH_CONFIG.aiDecisionInterval * 1.3

  const goal = { x: 0, z: FIELD_CONFIG.depth / 2 }
  const pressure = nearestOpponentPressure(owner, players)
  const distGoal = distance(owner.position, goal)
  const scoreShot = clamp((opponentOvr - ratings.defense * 0.45) / 100 + (2.5 - distGoal) * 0.16 - pressure * 0.08, 0, 1)
  const passTarget = choosePassTarget(owner, players, { pass: opponentOvr })

  owner.debug = {
    pass: passTarget ? 52 : 20,
    shot: Math.round(scoreShot * 100),
    dribble: Math.round(clamp((opponentOvr - 35) / 60, 0, 1) * 100),
    reason: 'Rival simplificado decidiu jogada.',
  }

  if (scoreShot > 0.58) {
    shoot(owner, ball, { ...ratings, shot: opponentOvr }, goal, pressure)
    return { text: 'O rival finalizou com direção ao gol.' }
  }

  if (passTarget && Math.random() < 0.56) {
    pass(owner, passTarget, ball, { ...ratings, pass: opponentOvr }, 0.25)
    return { text: 'O rival trocou passe para fugir da marcação.' }
  }

  dribble(owner, ball, { ...ratings, dribble: opponentOvr, speed: opponentOvr }, pressure)
  return { text: 'O rival tentou conduzir por dentro.' }
}

function pass(
  owner: MatchPlayerSim,
  target: MatchPlayerSim,
  ball: MatchBallState,
  ratings: MatchRatings,
  risk: number,
) {
  const lead = add(target.position, scale(target.velocity, 0.34))
  const direction = normalize(sub(lead, owner.position))
  const dist = distance(owner.position, lead)
  const accuracy = clamp((ratings.pass - risk * 30 + ratings.energyNorm * 10 - ratings.fatigue * 0.12) / 100, 0.25, 0.98)
  const error = (1 - accuracy) * randomRange(-0.45, 0.45)
  const impulse = scale({ x: direction.x + error, z: direction.z }, clamp(dist * 0.82, 1.05, 3.2))

  owner.state = 'Passando'
  owner.currentDecision = 'pass'
  target.state = 'Recebendo passe'
  target.target = lead
  ball.ownerId = undefined
  ball.targetPlayerId = target.id
  ball.lastTouchTeam = owner.team
  applyBallImpulse(ball, impulse)
}

function shoot(
  owner: MatchPlayerSim,
  ball: MatchBallState,
  ratings: Pick<MatchRatings, 'shot' | 'fatigue' | 'energyNorm'>,
  goal: Vec2,
  pressure: number,
) {
  const direction = normalize(sub(goal, owner.position))
  const dist = distance(owner.position, goal)
  const quality = clamp((ratings.shot - pressure * 18 - dist * 5 - ratings.fatigue * 0.12 + ratings.energyNorm * 8) / 100, 0.18, 0.98)
  const error = (1 - quality) * randomRange(-0.5, 0.5)
  const force = clamp(2.8 + dist * 0.7 + quality * 2.2, 2.8, 6.8)

  owner.state = 'Chutando'
  owner.currentDecision = 'shoot'
  ball.ownerId = undefined
  ball.targetPlayerId = undefined
  ball.lastTouchTeam = owner.team
  applyBallImpulse(ball, scale({ x: direction.x + error, z: direction.z }, force))
}

function dribble(owner: MatchPlayerSim, ball: MatchBallState, ratings: MatchRatings, pressure: number) {
  const forward = owner.team === 'home' ? -1 : 1
  const side = Math.sign(owner.position.x || randomRange(-1, 1)) * -0.35
  const quality = clamp((ratings.dribble + ratings.control - pressure * 24 - ratings.fatigue * 0.18) / 150, 0.2, 0.95)
  const target = {
    x: owner.position.x + side * (0.4 + quality),
    z: owner.position.z + forward * (0.65 + quality * 0.65),
  }

  owner.currentDecision = 'dribble'
  setTarget(owner, target, 'Driblando')
  ball.ownerId = owner.id
  ball.lastTouchTeam = owner.team
}

function assignLooseBallTargets(players: MatchPlayerSim[], ball: MatchBallState) {
  const sorted = [...players].sort((a, b) => distance(a.position, ball.position) - distance(b.position, ball.position))
  sorted.forEach((player, index) => {
    if (index < 2 || player.role === 'goalkeeper') {
      setTarget(player, predictBall(ball), index === 0 ? 'Tentando desarme' : 'Interceptando passe' as MatchPlayerSim['state'])
      player.currentDecision = 'intercept'
    } else {
      setTarget(player, player.homePosition, 'Posicionando')
    }
  })
}

function assignSupportRuns(players: MatchPlayerSim[], owner: MatchPlayerSim, ball: MatchBallState) {
  for (const player of players) {
    if (player.id === owner.id) continue
    if (player.team !== owner.team) {
      const markTarget = owner.team === 'home' ? owner.position : ball.position
      setTarget(player, markTarget, distance(player.position, ball.position) < 0.7 ? 'Tentando desarme' : 'Marcando')
      player.currentDecision = 'mark'
      continue
    }

    if (player.state === 'Recebendo passe') continue
    const forward = player.team === 'home' ? -1 : 1
    const lane = player.homePosition.x + randomRange(-0.2, 0.2)
    const support = {
      x: lane,
      z: clamp(owner.position.z + forward * randomRange(0.65, 1.4), -FIELD_CONFIG.depth / 2 + 0.4, FIELD_CONFIG.depth / 2 - 0.4),
    }
    setTarget(player, support, 'Correndo para espaço')
  }
}

function choosePassTarget(
  owner: MatchPlayerSim,
  players: MatchPlayerSim[],
  ratings: Pick<MatchRatings, 'pass'>,
): MatchPlayerSim | undefined {
  const teammates = players.filter((player) => player.team === owner.team && player.id !== owner.id && player.role !== 'goalkeeper')

  return teammates
    .map((player) => {
      const dist = distance(owner.position, player.position)
      const forward = forwardValue(player.position, owner.team)
      const risk = interceptionRisk(owner.position, player.position, players, owner.team === 'home' ? 'away' : 'home')
      const score = forward * 0.36 + clamp(1 - Math.abs(dist - 1.7) / 3, 0, 1) * 0.26 + (ratings.pass / 120) * 0.2 - risk * 0.28 + Math.random() * 0.08
      return { player, score }
    })
    .sort((a, b) => b.score - a.score)[0]?.player
}

function interceptionRisk(from: Vec2, to: Vec2, players: MatchPlayerSim[], opponentTeam: MatchTeam) {
  const line = sub(to, from)
  const lineLength = Math.max(length(line), 0.001)
  const dir = normalize(line)

  let risk = 0
  for (const player of players) {
    if (player.team !== opponentTeam) continue
    const rel = sub(player.position, from)
    const t = clamp((rel.x * dir.x + rel.z * dir.z) / lineLength, 0, 1)
    const closest = add(from, scale(line, t))
    const d = distance(player.position, closest)
    if (d < 0.55) risk += (0.55 - d) * 1.5
  }

  return clamp(risk, 0, 1)
}

function nearestOpponentPressure(owner: MatchPlayerSim, players: MatchPlayerSim[]) {
  const opponentTeam = owner.team === 'home' ? 'away' : 'home'
  const nearest = players
    .filter((player) => player.team === opponentTeam)
    .reduce((value, player) => Math.min(value, distance(owner.position, player.position)), 99)
  return clamp(1.4 - nearest, 0, 1.4)
}

function forwardValue(position: Vec2, team: MatchTeam) {
  if (team === 'home') return clamp((FIELD_CONFIG.depth / 2 - position.z) / FIELD_CONFIG.depth, 0, 1)
  return clamp((position.z + FIELD_CONFIG.depth / 2) / FIELD_CONFIG.depth, 0, 1)
}

function predictBall(ball: MatchBallState) {
  return add(ball.position, scale(ball.velocity, 0.32))
}
