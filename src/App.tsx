import {
  Activity,
  Award,
  Check,
  Clock,
  Coins,
  Dumbbell,
  Handshake,
  Heart,
  Home,
  Lock,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import './App.css'
import { BrazukaScene } from './components/BrazukaScene'
import {
  attributesConfig,
  careerStages,
  copaTeams,
  equipment,
  missions,
  opponents,
  playStyles,
  positions,
  recoveryOptions,
  rivals,
  skills,
  sponsors,
  strategies,
  trainingDrills,
} from './data/gameData'
import { useGame } from './hooks/useGame'
import {
  calculateEquipmentBonuses,
  calculateLiveOvr,
  getEffectiveAttributes,
  getEquipmentUpgradeCost,
  getProgressForMission,
  getRecoveryStatus,
  getXpForNextLevel,
} from './utils/gameLogic'
import type {
  CreatePlayerInput,
  GameState,
  Screen,
  StrategyKey,
} from './types/game'

const navItems: { screen: Screen; label: string; icon: LucideIcon }[] = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'training', label: 'Treino', icon: Dumbbell },
  { screen: 'match', label: 'Partida', icon: Play },
  { screen: 'career', label: 'Carreira', icon: Trophy },
  { screen: 'player', label: 'Jogador', icon: User },
  { screen: 'recovery', label: 'Recuperar', icon: Activity },
  { screen: 'shop', label: 'Loja', icon: ShoppingBag },
]

function App() {
  const { state, ovr, baseOvr, actions } = useGame()
  const [screen, setScreen] = useState<Screen>('home')
  const [strategy, setStrategy] = useState<StrategyKey>('balanced')

  if (!state.player.created) {
    return <CreatePlayer actions={actions} />
  }

  return (
    <main className="app-shell">
      <TopHud state={state} ovr={ovr} baseOvr={baseOvr} />
      <BrazukaScene screen={screen} state={state} ovr={ovr} />
      <section className="content-zone">
        {screen === 'home' && (
          <HomeScreen state={state} ovr={ovr} baseOvr={baseOvr} goTo={setScreen} />
        )}
        {screen === 'training' && <TrainingScreen state={state} actions={actions} />}
        {screen === 'match' && (
          <MatchScreen
            state={state}
            ovr={ovr}
            strategy={strategy}
            setStrategy={setStrategy}
            actions={actions}
          />
        )}
        {screen === 'career' && <CareerScreen state={state} ovr={ovr} />}
        {screen === 'player' && <PlayerScreen state={state} ovr={ovr} actions={actions} />}
        {screen === 'recovery' && <RecoveryScreen state={state} actions={actions} />}
        {screen === 'shop' && <ShopScreen state={state} actions={actions} />}
      </section>
      <BottomNav screen={screen} setScreen={setScreen} />
      {state.offlineSummary && <OfflineModal state={state} actions={actions} />}
    </main>
  )
}

function CreatePlayer({ actions }: { actions: ReturnType<typeof useGame>['actions'] }) {
  const [form, setForm] = useState<CreatePlayerInput>({
    name: 'Paulo Brazuka',
    nickname: 'Brazuka',
    number: 10,
    position: 'striker',
    foot: 'Destro',
    style: 'finisher',
    region: 'Litoral Verde',
  })

  return (
    <main className="creator-shell">
      <div className="creator-scene">
        <BrazukaScene
          screen="home"
          ovr={45}
          state={{
            ...createPreviewState(),
            player: { ...createPreviewState().player, ...form, created: true, level: 1, xp: 0 },
          }}
        />
      </div>
      <form
        className="creator-panel"
        onSubmit={(event) => {
          event.preventDefault()
          actions.createPlayer(form)
        }}
      >
        <span className="eyebrow">Copa do Mundo Brazuka</span>
        <h1>Crie seu craque</h1>
        <div className="form-grid">
          <label>
            Nome
            <input
              value={form.name}
              maxLength={28}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label>
            Apelido
            <input
              value={form.nickname}
              maxLength={18}
              onChange={(event) => setForm({ ...form, nickname: event.target.value })}
            />
          </label>
          <label>
            Camisa
            <input
              type="number"
              min={1}
              max={99}
              value={form.number}
              onChange={(event) => setForm({ ...form, number: Number(event.target.value) })}
            />
          </label>
          <label>
            Região
            <input
              value={form.region}
              maxLength={22}
              onChange={(event) => setForm({ ...form, region: event.target.value })}
            />
          </label>
          <label>
            Posição
            <select
              value={form.position}
              onChange={(event) =>
                setForm({ ...form, position: event.target.value as CreatePlayerInput['position'] })
              }
            >
              {positions.map((position) => (
                <option key={position.key} value={position.key}>
                  {position.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pé dominante
            <select
              value={form.foot}
              onChange={(event) =>
                setForm({ ...form, foot: event.target.value as CreatePlayerInput['foot'] })
              }
            >
              <option>Destro</option>
              <option>Canhoto</option>
            </select>
          </label>
          <label className="span-2">
            Estilo
            <select
              value={form.style}
              onChange={(event) =>
                setForm({ ...form, style: event.target.value as CreatePlayerInput['style'] })
              }
            >
              {playStyles.map((style) => (
                <option key={style.key} value={style.key}>
                  {style.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary-action" type="submit">
          <Sparkles size={18} />
          Entrar em campo
        </button>
      </form>
    </main>
  )
}

function createPreviewState(): GameState {
  return {
    version: 1,
    player: {
      created: true,
      name: 'Paulo Brazuka',
      nickname: 'Brazuka',
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
    attributes: Object.fromEntries(attributesConfig.map((item) => [item.key, 40])) as GameState['attributes'],
    careerStage: 0,
    sponsorMatchesLeft: 0,
    ownedEquipment: [],
    equipmentLevels: {},
    equipped: {},
    skillLevels: {},
    completedMissions: [],
    claimedChests: [],
    feed: [],
    stats: {
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
    },
    settings: { music: true, sound: true, graphics: 'Média', language: 'Português' },
    physical: {
      fatigue: 12,
      injuryRisk: 6,
      injury: { active: false, severity: 0, matchesLeft: 0 },
      nextTrainingBoost: 0,
      recoveryHistory: [],
    },
    lastSeen: Date.now(),
    tutorialStep: 0,
  }
}

function TopHud({ state, ovr, baseOvr }: { state: GameState; ovr: number; baseOvr: number }) {
  const xpTarget = getXpForNextLevel(state.player.level)
  const xpPercent = Math.min(100, Math.round((state.player.xp / xpTarget) * 100))
  const recovery = getRecoveryStatus(state)

  return (
    <header className="top-hud">
      <div className="brand-block">
        <span>Copa do Mundo Brazuka</span>
        <strong>{state.player.nickname}</strong>
      </div>
      <div className="hud-scroll">
        <HudPill icon={Award} label="Nível" value={`${state.player.level}`} />
        <HudPill icon={Target} label="OVR Atual" value={`${ovr}`} />
        <HudPill icon={Shield} label="OVR Base" value={`${baseOvr}`} />
        <HudPill icon={Zap} label="Energia" value={`${state.resources.energy}/${state.resources.maxEnergy}`} />
        <HudPill icon={Activity} label="Fadiga" value={`${state.physical.fatigue}%`} />
        <HudPill icon={Heart} label="Condição" value={recovery.label} />
        <HudPill icon={Coins} label="RB" value={formatNumber(state.resources.money)} />
        <HudPill icon={Star} label="Fama" value={formatNumber(state.resources.fame)} />
        <HudPill icon={Heart} label="Torcida" value={formatNumber(state.resources.fans)} />
      </div>
      <div className="xp-line" aria-label="Progresso de experiência">
        <span style={{ width: `${xpPercent}%` }} />
      </div>
    </header>
  )
}

function HudPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="hud-pill">
      <Icon size={16} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function HomeScreen({
  state,
  ovr,
  baseOvr,
  goTo,
}: {
  state: GameState
  ovr: number
  baseOvr: number
  goTo: (screen: Screen) => void
}) {
  const currentStage = careerStages[state.careerStage]
  const nextStage = careerStages[state.careerStage + 1]
  const nextOpponent = getNextOpponent(state)
  const sponsor = sponsors.find((item) => item.id === state.activeSponsorId)
  const recovery = getRecoveryStatus(state)

  return (
    <div className="screen-flow">
      <section className="hero-band">
        <div>
          <span className="eyebrow">{currentStage.label}</span>
          <h2>{state.player.name}</h2>
          <p>
            {getPositionLabel(state.player.position)} de {state.player.region}. Ranking mundial #{getRanking(ovr, state)}.
          </p>
        </div>
        <div className="ovr-badge">
          <span>OVR Atual</span>
          <strong>{ovr}</strong>
          <small>Base {baseOvr}</small>
        </div>
      </section>

      <section className="quick-grid">
        <MetricCard icon={Zap} label="Energia" value={`${state.resources.energy}/${state.resources.maxEnergy}`} />
        <MetricCard icon={Activity} label="Fadiga" value={`${state.physical.fatigue}%`} />
        <MetricCard icon={Shield} label="Condição" value={recovery.label} />
        <MetricCard icon={Heart} label="Risco lesão" value={`${recovery.injuryRisk}%`} />
        <MetricCard icon={Coins} label="Reais Brazuka" value={formatNumber(state.resources.money)} />
        <MetricCard icon={Star} label="Fama" value={formatNumber(state.resources.fame)} />
        <MetricCard icon={Target} label="Recomendação" value={recovery.recommendation} />
        <MetricCard icon={Heart} label="Torcida" value={formatNumber(state.resources.fans)} />
      </section>

      <section className="action-strip">
        <button onClick={() => goTo('training')}>
          <Dumbbell size={18} />
          Treinar
        </button>
        <button onClick={() => goTo('match')}>
          <Play size={18} />
          Jogar
        </button>
        <button onClick={() => goTo('career')}>
          <Trophy size={18} />
          Copa
        </button>
        <button onClick={() => goTo('recovery')}>
          <Activity size={18} />
          Recuperar
        </button>
      </section>

      <section className="two-column">
        <InfoPanel title="Próxima Partida" icon={Play}>
          <div className="matchup">
            <strong>{nextOpponent.name}</strong>
            <span>{nextOpponent.style}</span>
            <div className="mini-row">
              <span>OVR rival {nextOpponent.ovr}</span>
              <span>Prêmio {formatNumber(nextOpponent.reward)} RB</span>
            </div>
          </div>
        </InfoPanel>
        <InfoPanel title="Carreira" icon={Trophy}>
          <div className="stage-snippet">
            <strong>{nextStage ? nextStage.label : 'Lenda do Futebol'}</strong>
            <span>
              {nextStage
                ? `Recomendado OVR ${nextStage.recommendedOvr}`
                : 'Você está perto do topo absoluto.'}
            </span>
            <ProgressBar value={nextStage ? Math.min(100, (ovr / nextStage.recommendedOvr) * 100) : 100} />
          </div>
        </InfoPanel>
      </section>

      <section className="two-column">
        <InfoPanel title="Patrocinador" icon={Handshake}>
          {sponsor ? (
            <div className="stage-snippet">
              <strong>{sponsor.name}</strong>
              <span>{state.sponsorMatchesLeft} partidas restantes</span>
              <span>+{Math.round(sponsor.moneyBonus * 100)}% RB por jogo</span>
            </div>
          ) : (
            <div className="stage-snippet">
              <strong>Contrato aberto</strong>
              <span>Busque fama para fechar uma marca fictícia.</span>
            </div>
          )}
        </InfoPanel>
        <InfoPanel title="Brazuka Feed" icon={Sparkles}>
          <FeedList feed={state.feed.slice(0, 3)} />
        </InfoPanel>
      </section>
    </div>
  )
}

function TrainingScreen({
  state,
  actions,
}: {
  state: GameState
  actions: ReturnType<typeof useGame>['actions']
}) {
  const effective = getEffectiveAttributes(state)
  const bonuses = calculateEquipmentBonuses(state)
  const recovery = getRecoveryStatus(state)

  return (
    <div className="screen-flow">
      <SectionTitle eyebrow="Centro de Treinamento" title="Treinos com resultado real" />
      <section className="quick-grid">
        <MetricCard icon={Zap} label="Energia" value={`${state.resources.energy}/${state.resources.maxEnergy}`} />
        <MetricCard icon={Activity} label="Fadiga" value={`${state.physical.fatigue}%`} />
        <MetricCard icon={Shield} label="Condição" value={recovery.label} />
        <MetricCard icon={Heart} label="Próximo treino" value={state.physical.nextTrainingBoost > 0 ? '+16% nutrição' : recovery.recommendation} />
      </section>

      {state.lastTraining && (
        <section className="training-feedback">
          <strong>{state.lastTraining.text}</strong>
          <span>XP +{state.lastTraining.xp} · Fadiga +{state.lastTraining.fatigue}</span>
        </section>
      )}

      <section className="training-grid">
        {trainingDrills.map((drill) => {
          const disabled =
            state.resources.money < drill.moneyCost ||
            state.resources.energy < drill.energyCost ||
            state.physical.injury.active
          const affected = Object.entries(drill.attributes)
            .map(([key, weight]) => {
              const attribute = attributesConfig.find((item) => item.key === key)
              const bonus = bonuses[key as keyof typeof bonuses] ?? 0
              return `${attribute?.label ?? key} ${effective[key as keyof typeof effective]}${bonus ? ` (+${Math.round(bonus)})` : ''} x${weight}`
            })
            .join(' · ')

          return (
            <article className="training-card drill-card" key={drill.id}>
              <div className="card-head">
                <span className="attribute-chip">
                  {drill.focus.slice(0, 3).toUpperCase()}
                </span>
                <div>
                  <strong>{drill.name}</strong>
                  <span>{drill.description}</span>
                </div>
              </div>
              <p>{affected}</p>
              <div className="cost-row">
                <span>{formatNumber(drill.moneyCost)} RB</span>
                <span>{drill.energyCost} energia</span>
                <span>+{drill.fatigue} fadiga</span>
              </div>
              <button disabled={disabled} onClick={() => actions.trainDrill(drill.id)}>
                <Dumbbell size={16} />
                Treinar
              </button>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function MatchScreen({
  state,
  ovr,
  strategy,
  setStrategy,
  actions,
}: {
  state: GameState
  ovr: number
  strategy: StrategyKey
  setStrategy: (strategy: StrategyKey) => void
  actions: ReturnType<typeof useGame>['actions']
}) {
  const match = state.activeMatch
  const opponent = match
    ? opponents.find((item) => item.id === match.opponentId) ?? opponents[0]
    : getNextOpponent(state)

  if (match?.status === 'finished') {
    return (
      <div className="screen-flow">
        <SectionTitle eyebrow="Resultado" title={`${match.scoreFor} x ${match.scoreAgainst}`} />
        <ResultPanel state={state} actions={actions} />
      </div>
    )
  }

  if (match?.status === 'running') {
    const manualSkills = skills.filter((skill) => skill.type === 'manual')
    const recovery = getRecoveryStatus(state)
    const debug = match.engine.debug

    return (
      <div className="screen-flow">
        <section className="match-hud">
          <div>
            <span>{state.player.nickname}</span>
            <strong>{match.scoreFor}</strong>
          </div>
          <div className="clock-box">
            <Clock size={18} />
            <strong>{match.minute}'</strong>
          </div>
          <div>
            <span>{opponent.name}</span>
            <strong>{match.scoreAgainst}</strong>
          </div>
        </section>

        <section className="match-context">
          <span>Energia {state.resources.energy}/{state.resources.maxEnergy}</span>
          <span>Condição {recovery.label}</span>
          <span>Moral {state.resources.moral}</span>
          <span>Posse {debug.possession}</span>
        </section>

        <section className="skill-dock">
          {manualSkills.map((skill) => {
            const level = state.skillLevels[skill.id] ?? 0
            const cooldown = match.cooldowns[skill.id] ?? 0
            const locked = level <= 0 || state.player.level < skill.unlockLevel

            return (
              <button
                key={skill.id}
                disabled={locked || cooldown > 0}
                title={skill.description}
                onClick={() => actions.useSkill(skill.id)}
              >
                {locked ? <Lock size={16} /> : <Sparkles size={16} />}
                <span>{skill.name}</span>
                <small>{locked ? `Nv ${skill.unlockLevel}` : cooldown > 0 ? `${cooldown}'` : `Nv ${level}`}</small>
              </button>
            )
          })}
        </section>

        <section className="event-feed">
          <div className="event-line debug">
            <span>DBG</span>
            <strong>
              Bola {debug.ballSpeed} · {debug.playerState} · decisão {debug.decision} · passe {debug.passChance}% · chute {debug.shotChance}% · drible {debug.dribbleChance}%
            </strong>
          </div>
          {match.events
            .slice()
            .reverse()
            .map((event, index) => (
              <div key={`${event.minute}-${event.text}-${index}`} className={clsx('event-line', event.kind)}>
                <span>{event.minute}'</span>
                <strong>{event.text}</strong>
              </div>
            ))}
        </section>

        <button className="primary-action" onClick={actions.skipMatch}>
          <Zap size={18} />
          Pular Resultado
        </button>
      </div>
    )
  }

  return (
    <div className="screen-flow">
      <SectionTitle eyebrow="Pré-jogo" title={opponent.name} />
      <section className="prematch-card">
        <div className="matchup-large">
          <div>
            <span>{state.player.nickname}</span>
            <strong>OVR {ovr}</strong>
          </div>
          <b>VS</b>
          <div>
            <span>{opponent.style}</span>
            <strong>OVR {opponent.ovr}</strong>
          </div>
        </div>
        <div className="match-context">
          <span>Fadiga {state.physical.fatigue}%</span>
          <span>Condição {getRecoveryStatus(state).label}</span>
          <span>Risco lesão {getRecoveryStatus(state).injuryRisk}%</span>
        </div>
        <div className="strategy-grid">
          {strategies.map((item) => (
            <button
              key={item.key}
              className={clsx(strategy === item.key && 'selected')}
              onClick={() => setStrategy(item.key)}
            >
              <Shield size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <p className="strategy-copy">{strategies.find((item) => item.key === strategy)?.description}</p>
        <button
          className="primary-action"
          disabled={state.resources.energy < 15 || state.physical.injury.active}
          onClick={() => actions.startMatch(strategy)}
        >
          <Play size={18} />
          Iniciar Partida
        </button>
      </section>
      {state.lastResult && <LastResult result={state.lastResult} />}
    </div>
  )
}

function ResultPanel({
  state,
  actions,
}: {
  state: GameState
  actions: ReturnType<typeof useGame>['actions']
}) {
  const result = state.lastResult
  if (!result) return null

  return (
    <section className="result-panel">
      <div className={clsx('result-stamp', result.outcome)}>
        {result.outcome === 'win' ? 'Vitória' : result.outcome === 'draw' ? 'Empate' : 'Derrota'}
      </div>
      <div className="quick-grid">
        <MetricCard icon={Coins} label="RB" value={`+${formatNumber(result.rewards.money)}`} />
        <MetricCard icon={Award} label="XP" value={`+${formatNumber(result.rewards.xp)}`} />
        <MetricCard icon={Star} label="Fama" value={`+${formatNumber(result.rewards.fame)}`} />
        <MetricCard icon={Heart} label="Torcida" value={`+${formatNumber(result.rewards.fans)}`} />
      </div>
      <div className="event-feed">
        {result.events
          .slice(-5)
          .reverse()
          .map((event, index) => (
            <div key={`${event.minute}-${index}`} className={clsx('event-line', event.kind)}>
              <span>{event.minute}'</span>
              <strong>{event.text}</strong>
            </div>
          ))}
      </div>
      <button className="primary-action" onClick={actions.clearMatch}>
        <Check size={18} />
        Continuar
      </button>
    </section>
  )
}

function CareerScreen({ state, ovr }: { state: GameState; ovr: number }) {
  return (
    <div className="screen-flow">
      <SectionTitle eyebrow="Carreira" title="Do bairro à grande copa" />
      <section className="timeline">
        {careerStages.map((stage, index) => {
          const unlocked = index <= state.careerStage
          const reachable = ovr >= stage.recommendedOvr

          return (
            <article key={stage.id} className={clsx('stage-card', unlocked && 'unlocked')}>
              <div className="stage-icon">{unlocked ? <Trophy size={18} /> : <Lock size={18} />}</div>
              <div>
                <span>Fase {index + 1}</span>
                <strong>{stage.label}</strong>
                <p>{stage.setting}</p>
                <small>{stage.reward}</small>
                {!unlocked && <ProgressBar value={Math.min(100, (ovr / stage.recommendedOvr) * 100)} />}
                {!unlocked && <em>{reachable ? 'Pronto para desbloquear em vitória' : `OVR ${stage.recommendedOvr}`}</em>}
              </div>
            </article>
          )
        })}
      </section>

      <section className="two-column">
        <InfoPanel title="Copa Brazuka" icon={Trophy}>
          <div className="copa-grid">
            {copaTeams.slice(0, 8).map((team, index) => (
              <div key={team}>
                <span>Grupo {index < 4 ? 'A' : 'B'}</span>
                <strong>{team}</strong>
                <small>{team === 'Seleção Brazuka' ? 'Seu time' : `${48 + index * 3} pts força`}</small>
              </div>
            ))}
          </div>
        </InfoPanel>
        <InfoPanel title="Rivais" icon={Target}>
          <div className="rival-list">
            {rivals.map((rival) => (
              <div key={rival.id}>
                <strong>{rival.name}</strong>
                <span>{rival.style} · OVR {rival.ovr}</span>
                <small>{rival.reward}</small>
              </div>
            ))}
          </div>
        </InfoPanel>
      </section>
    </div>
  )
}

function PlayerScreen({
  state,
  ovr,
  actions,
}: {
  state: GameState
  ovr: number
  actions: ReturnType<typeof useGame>['actions']
}) {
  const ownedItems = equipment.filter((item) => state.ownedEquipment.includes(item.id))
  const manualAndPassiveSkills = skills.filter((skill) => state.player.level >= skill.unlockLevel || state.skillLevels[skill.id])

  return (
    <div className="screen-flow">
      <SectionTitle eyebrow="Jogador" title={state.player.nickname} />
      <section className="profile-grid">
        <MetricCard icon={Award} label="OVR" value={ovr.toString()} />
        <MetricCard icon={Play} label="Partidas" value={state.stats.matches.toString()} />
        <MetricCard icon={Target} label="Gols" value={state.stats.goals.toString()} />
        <MetricCard icon={Trophy} label="Vitórias" value={state.stats.wins.toString()} />
        <MetricCard icon={Star} label="Títulos" value={state.stats.titles.toString()} />
        <MetricCard icon={Sparkles} label="Melhor sequência" value={state.stats.bestWinStreak.toString()} />
      </section>

      <section className="two-column">
        <InfoPanel title="Equipamentos" icon={Shirt}>
          <div className="equipment-list">
            {ownedItems.map((item) => {
              const equipped = state.equipped[item.slot] === item.id
              const level = state.equipmentLevels[item.id] ?? 1
              const upgradeCost = getEquipmentUpgradeCost(state, item.id)
              const beforeOvr = calculateLiveOvr(state)
              const previewState = {
                ...state,
                equipmentLevels: {
                  ...state.equipmentLevels,
                  [item.id]: level + 1,
                },
              }
              const afterOvr = calculateLiveOvr(previewState)
              const itemBonuses = Object.entries(item.bonuses)
                .map(([key, value]) => {
                  const attribute = attributesConfig.find((candidate) => candidate.key === key)
                  return `+${Math.round(value * (1 + (level - 1) * (item.upgradeGrowth ?? 0.16)))} ${attribute?.label ?? key}`
                })
                .join(' · ')
              return (
                <article key={item.id} className={clsx('equipment-card', equipped && 'selected')}>
                  <button onClick={() => actions.equipItem(item.id)}>
                    <span>{item.slot} · Nv {level}</span>
                    <strong>{item.name}</strong>
                    <small>{item.rarity}</small>
                  </button>
                  <p>{itemBonuses}</p>
                  <small>OVR ao upar: {beforeOvr} → {afterOvr}</small>
                  <button
                    disabled={state.resources.money < upgradeCost || level >= 10}
                    onClick={() => actions.upgradeEquipment(item.id)}
                  >
                    <Sparkles size={15} />
                    Upar {formatNumber(upgradeCost)}
                  </button>
                </article>
              )
            })}
          </div>
        </InfoPanel>

        <InfoPanel title="Habilidades" icon={Sparkles}>
          <div className="skill-list">
            {manualAndPassiveSkills.map((skill) => {
              const level = state.skillLevels[skill.id] ?? 0
              const cost = Math.round(skill.upgradeCost * (1 + level * 0.55))
              return (
                <div key={skill.id} className="skill-card">
                  <div>
                    <strong>{skill.name}</strong>
                    <span>{skill.description}</span>
                  </div>
                  <button disabled={state.resources.money < cost} onClick={() => actions.upgradeSkill(skill.id)}>
                    <Sparkles size={15} />
                    Nv {level}
                  </button>
                </div>
              )
            })}
          </div>
        </InfoPanel>
      </section>

      <section className="two-column">
        <InfoPanel title="Missões" icon={Check}>
          <MissionList state={state} actions={actions} />
        </InfoPanel>
        <InfoPanel title="Brazuka Feed" icon={Sparkles}>
          <FeedList feed={state.feed} />
        </InfoPanel>
      </section>
    </div>
  )
}

function RecoveryScreen({
  state,
  actions,
}: {
  state: GameState
  actions: ReturnType<typeof useGame>['actions']
}) {
  const recovery = getRecoveryStatus(state)

  return (
    <div className="screen-flow">
      <SectionTitle eyebrow="Recuperação" title="Condição física" />
      <section className="quick-grid">
        <MetricCard icon={Zap} label="Energia" value={`${state.resources.energy}/${state.resources.maxEnergy}`} />
        <MetricCard icon={Activity} label="Fadiga" value={`${state.physical.fatigue}%`} />
        <MetricCard icon={Shield} label="Condição" value={recovery.label} />
        <MetricCard icon={Heart} label="Risco de lesão" value={`${recovery.injuryRisk}%`} />
      </section>

      <section className="recovery-alert">
        <strong>{recovery.recommendation}</strong>
        <span>Recuperação natural estimada: {recovery.estimatedNaturalMinutes} min de jogo offline.</span>
        {state.physical.injury.active && (
          <span>Lesão ativa: {state.physical.injury.label} · severidade {state.physical.injury.severity}</span>
        )}
      </section>

      <section className="recovery-grid">
        {recoveryOptions.map((option) => (
          <article className="recovery-card" key={option.id}>
            <div>
              <strong>{option.name}</strong>
              <span>{option.description}</span>
            </div>
            <div className="cost-row">
              <span>{formatNumber(option.cost)} RB</span>
              <span>+{option.energyGain} energia</span>
              <span>-{option.fatigueReduction} fadiga</span>
            </div>
            <button disabled={state.resources.money < option.cost} onClick={() => actions.recover(option.id)}>
              <Activity size={16} />
              Aplicar
            </button>
          </article>
        ))}
      </section>

      <InfoPanel title="Histórico" icon={Clock}>
        <FeedList feed={state.physical.recoveryHistory.length ? state.physical.recoveryHistory : ['Nenhuma recuperação feita ainda.']} />
      </InfoPanel>
    </div>
  )
}

function ShopScreen({
  state,
  actions,
}: {
  state: GameState
  actions: ReturnType<typeof useGame>['actions']
}) {
  return (
    <div className="screen-flow">
      <SectionTitle eyebrow="Loja e contratos" title="Estrutura Brazuka" />
      <section className="two-column">
        <InfoPanel title="Equipamentos" icon={ShoppingBag}>
          <div className="shop-list">
            {equipment.map((item) => {
              const owned = state.ownedEquipment.includes(item.id)
              return (
                <article key={item.id} className="shop-item">
                  <div>
                    <span>{item.slot} · {item.rarity}</span>
                    <strong>{item.name}</strong>
                    <small>{item.visual}</small>
                  </div>
                  <button disabled={owned || state.resources.money < item.cost} onClick={() => actions.buyEquipment(item.id)}>
                    {owned ? <Check size={16} /> : <Coins size={16} />}
                    {owned ? 'Ok' : formatNumber(item.cost)}
                  </button>
                </article>
              )
            })}
          </div>
        </InfoPanel>

        <InfoPanel title="Patrocinadores" icon={Handshake}>
          <div className="shop-list">
            {sponsors.map((sponsor) => {
              const signed = state.activeSponsorId === sponsor.id
              const locked = state.resources.fame < sponsor.fameRequired
              return (
                <article key={sponsor.id} className="shop-item">
                  <div>
                    <span>{sponsor.tier} · fama {formatNumber(sponsor.fameRequired)}</span>
                    <strong>{sponsor.name}</strong>
                    <small>
                      +{Math.round(sponsor.moneyBonus * 100)}% RB · +{Math.round(sponsor.xpBonus * 100)}% XP
                    </small>
                  </div>
                  <button disabled={signed || locked} onClick={() => actions.signSponsor(sponsor.id)}>
                    {locked ? <Lock size={16} /> : signed ? <Check size={16} /> : <Handshake size={16} />}
                    {signed ? 'Ativo' : locked ? 'Fama' : 'Assinar'}
                  </button>
                </article>
              )
            })}
          </div>
        </InfoPanel>
      </section>

      <section className="two-column">
        <InfoPanel title="Baús" icon={Award}>
          <div className="chest-grid">
            {['Baú de Bairro', 'Baú Regional', 'Baú Nacional', 'Baú da Copa'].map((chest, index) => (
              <button key={chest} disabled={state.resources.stars < index * 4}>
                <Award size={18} />
                <strong>{chest}</strong>
                <span>{index * 4} estrelas</span>
              </button>
            ))}
          </div>
        </InfoPanel>

        <InfoPanel title="Configurações" icon={Settings}>
          <div className="settings-list">
            <button onClick={actions.toggleMusic}>
              Música
              <strong>{state.settings.music ? 'On' : 'Off'}</strong>
            </button>
            <button onClick={actions.toggleSound}>
              Sons
              <strong>{state.settings.sound ? 'On' : 'Off'}</strong>
            </button>
            <div className="quality-row">
              {(['Baixa', 'Média', 'Alta'] as const).map((quality) => (
                <button
                  key={quality}
                  className={clsx(state.settings.graphics === quality && 'selected')}
                  onClick={() => actions.setGraphics(quality)}
                >
                  {quality}
                </button>
              ))}
            </div>
            <button
              className="danger"
              onClick={() => {
                if (window.confirm('Resetar todo o progresso local?')) actions.reset()
              }}
            >
              <RotateCcw size={16} />
              Resetar progresso
            </button>
            <small>Versão 0.1.0 · créditos fictícios Brazuka Studio</small>
          </div>
        </InfoPanel>
      </section>
    </div>
  )
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Menu principal">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.screen}
            className={clsx(screen === item.screen && 'active')}
            onClick={() => setScreen(item.screen)}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function InfoPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section className="info-panel">
      <div className="panel-title">
        <Icon size={18} />
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <article className="metric-card">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function FeedList({ feed }: { feed: string[] }) {
  return (
    <div className="feed-list">
      {feed.map((item, index) => (
        <p key={`${item}-${index}`}>{item}</p>
      ))}
    </div>
  )
}

function MissionList({
  state,
  actions,
}: {
  state: GameState
  actions: ReturnType<typeof useGame>['actions']
}) {
  return (
    <div className="mission-list">
      {missions.map((mission) => {
        const progress = getProgressForMission(state, mission.metric)
        const completed = progress >= mission.target
        const claimed = state.completedMissions.includes(mission.id)
        return (
          <div key={mission.id} className="mission-card">
            <div>
              <strong>{mission.label}</strong>
              <span>
                {Math.min(progress, mission.target)} / {mission.target}
              </span>
              <ProgressBar value={(Math.min(progress, mission.target) / mission.target) * 100} />
            </div>
            <button disabled={!completed || claimed} onClick={() => actions.claimMission(mission.id)}>
              {claimed ? <Check size={15} /> : <Award size={15} />}
              {claimed ? 'Ok' : 'Receber'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function LastResult({ result }: { result: NonNullable<GameState['lastResult']> }) {
  return (
    <section className="last-result">
      <span>Último jogo</span>
      <strong>
        {result.scoreFor} x {result.scoreAgainst} contra {result.opponent}
      </strong>
    </section>
  )
}

function OfflineModal({
  state,
  actions,
}: {
  state: GameState
  actions: ReturnType<typeof useGame>['actions']
}) {
  const summary = state.offlineSummary
  if (!summary) return null

  return (
    <div className="modal-backdrop">
      <section className="offline-modal">
        <span className="eyebrow">Enquanto você estava fora</span>
        <h2>{formatOfflineTime(summary.minutes)}</h2>
        <div className="quick-grid">
          <MetricCard icon={Coins} label="RB" value={`+${formatNumber(summary.money)}`} />
          <MetricCard icon={Award} label="XP" value={`+${formatNumber(summary.xp)}`} />
          <MetricCard icon={Zap} label="Energia" value={`+${formatNumber(summary.energy)}`} />
          <MetricCard icon={Activity} label="Fadiga" value={`-${formatNumber(summary.fatigue)}`} />
          <MetricCard icon={Heart} label="Moral" value={`+${formatNumber(summary.moral)}`} />
          <MetricCard icon={Star} label="Fama" value={`+${formatNumber(summary.fame)}`} />
        </div>
        <button className="primary-action" onClick={actions.dismissOffline}>
          <Check size={18} />
          Receber
        </button>
      </section>
    </div>
  )
}

function getNextOpponent(state: GameState) {
  const stageOpponents = opponents.filter((opponent) => opponent.stage <= state.careerStage)
  const list = stageOpponents.length ? stageOpponents : opponents
  return list[state.stats.matches % list.length]
}

function getPositionLabel(position: GameState['player']['position']) {
  return positions.find((item) => item.key === position)?.label ?? 'Atacante'
}

function getRanking(ovr: number, state: GameState) {
  return Math.max(1, 940 - ovr * 8 - state.stats.titles * 25 - Math.floor(state.resources.fame / 120))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

function formatOfflineTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours <= 0) return `${rest} min`
  return `${hours}h ${rest}min`
}

export default App
