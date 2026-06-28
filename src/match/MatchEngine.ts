import type {
  ActiveMatch,
  GameState,
  MatchEngineState,
  MatchEvent,
  MatchPlayerRole,
  MatchPlayerSim,
  MatchTeam,
  OpponentConfig,
} from '../types/game'
import { updateBall, createBall, resetBall } from './BallPhysics'
import { calculateMatchRatings } from './MatchBalance'
import { AWAY_SHAPE, HOME_SHAPE, MATCH_CONFIG, PLAYER_CONFIG } from './MatchConfig'
import { distance, length, randomRange } from './MatchMath'
import { updateTeamAI } from './PlayerAI'
import { updatePlayers } from './PlayerController'

export function createMatchEngine(state: GameState, opponent: OpponentConfig): MatchEngineState {
  const players = createPlayers(state, opponent)
  const ball = createBall()
  ball.ownerId = 'home-striker'
  ball.lastTouchTeam = 'home'

  return {
    tick: 0,
    elapsedSeconds: 0,
    aiTimer: 0,
    ball,
    players,
    debug: {
      ballSpeed: 0,
      possession: state.player.nickname,
      playerState: 'Conduzindo bola',
      decision: 'hold',
      passChance: 0,
      shotChance: 0,
      dribbleChance: 0,
      lastError: '',
    },
    lastActionText: 'Saída controlada: bola no pé do craque.',
  }
}

export function stepMatchEngine(
  state: GameState,
  match: ActiveMatch,
  opponent: OpponentConfig,
): { match: ActiveMatch; events: MatchEvent[] } {
  const events: MatchEvent[] = []
  const ratings = calculateMatchRatings(state)
  const engine = match.engine
  const steps = Math.max(1, Math.round(MATCH_CONFIG.secondsPerTick / MATCH_CONFIG.fixedDt))

  for (let i = 0; i < steps; i += 1) {
    updatePlayers(engine.players, MATCH_CONFIG.fixedDt)
    const ai = updateTeamAI(engine.players, engine.ball, ratings, opponent.ovr, MATCH_CONFIG.fixedDt)

    if (ai.text && ai.text !== engine.lastActionText) {
      engine.lastActionText = ai.text
      events.push({
        minute: match.minute,
        text: ai.text,
        kind: ai.text.includes('rival') ? 'bad' : 'good',
      })
    }

    const ballResult = updateBall(engine.ball, engine.players, MATCH_CONFIG.fixedDt)
    if (ballResult.goal) {
      handleGoal(match, ballResult.goal, state, events)
      resetAfterGoal(engine, ballResult.goal)
    }
    if (ballResult.resetReason) {
      engine.debug.lastError = ballResult.resetReason
      events.push({ minute: match.minute, text: ballResult.resetReason, kind: 'debug' })
    }

    engine.elapsedSeconds += MATCH_CONFIG.fixedDt
    engine.tick += 1
  }

  match.minute = Math.min(90, Math.floor(engine.elapsedSeconds / MATCH_CONFIG.secondsPerMatchMinute))
  updateDebug(engine, state)
  recoverPossessionIfNeeded(engine)

  return { match, events }
}

export function applyManualSkillToEngine(match: ActiveMatch, skillId: string): string {
  const owner = findHomeBallCarrier(match.engine)
  if (!owner) return 'Habilidade ativada, mas a bola está em disputa.'

  if (skillId === 'chute-canarinho') {
    owner.state = 'Preparando chute'
    owner.debug.reason = 'Chute Canarinho aumentou qualidade da finalização.'
    match.momentum += 10
    return 'Chute Canarinho carregado: próximo chute ganha força e precisão.'
  }

  if (skillId === 'drible-rua') {
    owner.state = 'Driblando'
    owner.debug.reason = 'Drible de Rua reduziu pressão do marcador.'
    match.momentum += 7
    return 'Drible de Rua abriu espaço e protegeu a posse.'
  }

  if (skillId === 'passe-maestro') {
    owner.state = 'Preparando passe'
    owner.debug.reason = 'Passe de Maestro melhora alvo e força do passe.'
    match.momentum += 8
    return 'Passe de Maestro ativado: companheiro livre procurado.'
  }

  if (skillId === 'raca-brazuka') {
    for (const player of match.engine.players.filter((item) => item.team === 'home')) {
      player.stamina = Math.min(100, player.stamina + 12)
    }
    match.momentum += 5
    return 'Raça Brazuka levantou o fôlego do time.'
  }

  return 'Habilidade ativada.'
}

function createPlayers(state: GameState, opponent: OpponentConfig): MatchPlayerSim[] {
  const homeNames = [
    state.player.nickname,
    'Neto Raiz',
    'Tico Passe',
    'Duda Vento',
    'Miro Muralha',
  ]
  const awayNames = [
    'Goleiro Rival',
    'Zaga Forte',
    'Meia Rival',
    'Ponta Rival',
    opponent.name.split(' ')[0] ?? 'Rival',
  ]

  const homePlayers = HOME_SHAPE.map((shape, index) =>
    createPlayer(`home-${shape.role}`, homeNames[index], 'home', shape.role, shape.x, shape.z, 44 + state.careerStage * 4),
  )
  const awayPlayers = AWAY_SHAPE.map((shape, index) =>
    createPlayer(`away-${shape.role}`, awayNames[index], 'away', shape.role, shape.x, shape.z, opponent.ovr),
  )

  return [...homePlayers, ...awayPlayers]
}

function createPlayer(
  id: string,
  name: string,
  team: MatchTeam,
  role: MatchPlayerRole,
  x: number,
  z: number,
  ovr: number,
): MatchPlayerSim {
  const maxSpeed = role === 'goalkeeper'
    ? PLAYER_CONFIG.goalkeeperSpeed
    : PLAYER_CONFIG.maxSpeed * (0.82 + Math.min(ovr, 95) / 240)

  return {
    id,
    name,
    team,
    role,
    state: role === 'striker' && team === 'home' ? 'Conduzindo bola' : 'Posicionando',
    position: { x, z },
    velocity: { x: 0, z: 0 },
    target: { x, z },
    homePosition: { x, z },
    facing: 0,
    radius: role === 'goalkeeper' ? 0.25 : PLAYER_CONFIG.radius,
    maxSpeed,
    stamina: 100,
    decisionCooldown: randomRange(0, MATCH_CONFIG.aiDecisionInterval),
    currentDecision: 'hold',
    debug: {
      pass: 0,
      shot: 0,
      dribble: 0,
      reason: 'Aguardando leitura de jogo.',
    },
  }
}

function handleGoal(
  match: ActiveMatch,
  scoringTeam: MatchTeam,
  state: GameState,
  events: MatchEvent[],
) {
  if (scoringTeam === 'home') {
    match.scoreFor += 1
    events.push({
      minute: match.minute,
      text: `Bola cruzou a linha dentro do gol. GOOOOL de ${state.player.nickname}!`,
      kind: 'goal',
    })
  } else {
    match.scoreAgainst += 1
    events.push({
      minute: match.minute,
      text: 'A bola entrou no gol após chute rival. Hora de reagir.',
      kind: 'bad',
    })
  }
}

function resetAfterGoal(engine: MatchEngineState, scoringTeam: MatchTeam) {
  for (const player of engine.players) {
    player.position = { ...player.homePosition }
    player.velocity = { x: 0, z: 0 }
    player.target = { ...player.homePosition }
    player.state = scoringTeam === player.team ? 'Comemorando' : 'Reagindo a gol'
    player.currentDecision = 'hold'
  }

  const restart = engine.players.find((player) =>
    scoringTeam === 'home' ? player.id === 'away-striker' : player.id === 'home-striker',
  )
  resetBall(engine.ball, restart?.id)
  engine.ball.lastTouchTeam = restart?.team
}

function updateDebug(engine: MatchEngineState, state: GameState) {
  const owner = engine.ball.ownerId
    ? engine.players.find((player) => player.id === engine.ball.ownerId)
    : undefined
  const focus = owner ?? engine.players.find((player) => player.id === 'home-striker') ?? engine.players[0]

  engine.debug = {
    ballSpeed: Number(length(engine.ball.velocity).toFixed(2)),
    possession: owner?.name ?? 'Bola livre',
    playerState: focus.state,
    decision: focus.currentDecision,
    passChance: focus.debug.pass,
    shotChance: focus.debug.shot,
    dribbleChance: focus.debug.dribble,
    lastError: focus.debug.reason || engine.debug.lastError,
  }

  if (state.settings.graphics === 'Baixa') {
    engine.players = engine.players.map((player) => ({ ...player, debug: player.debug }))
  }
}

function recoverPossessionIfNeeded(engine: MatchEngineState) {
  if (engine.ball.ownerId) return
  const nearest = engine.players.reduce((best, player) =>
    distance(player.position, engine.ball.position) < distance(best.position, engine.ball.position)
      ? player
      : best,
  )

  if (distance(nearest.position, engine.ball.position) < PLAYER_CONFIG.receiveDistance) {
    engine.ball.ownerId = nearest.id
    engine.ball.lastTouchTeam = nearest.team
    nearest.state = 'Conduzindo bola'
  }
}

function findHomeBallCarrier(engine: MatchEngineState) {
  const owner = engine.ball.ownerId
    ? engine.players.find((player) => player.id === engine.ball.ownerId)
    : undefined
  return owner?.team === 'home' ? owner : undefined
}
