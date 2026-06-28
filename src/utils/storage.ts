import {
  applyOfflineProgress,
  createDefaultPhysicalState,
  createEmptyGame,
  SAVE_VERSION,
} from './gameLogic'
import type { GameState } from '../types/game'

const SAVE_KEY = 'copa-brazuka-save-v1'

export function loadGame(): GameState {
  if (typeof window === 'undefined') return createEmptyGame()

  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return createEmptyGame()
    const parsed = JSON.parse(raw) as GameState

    return applyOfflineProgress(migrateGame(parsed))
  } catch {
    return createEmptyGame()
  }
}

export function saveGame(state: GameState) {
  if (typeof window === 'undefined') return
  const next = { ...state, lastSeen: Date.now() }
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(next))
}

export function clearSave() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SAVE_KEY)
}

function migrateGame(state: Partial<GameState>): GameState {
  const fallback = createEmptyGame()
  const next = {
    ...fallback,
    ...state,
    version: SAVE_VERSION,
    player: { ...fallback.player, ...state.player },
    resources: { ...fallback.resources, ...state.resources },
    attributes: { ...fallback.attributes, ...state.attributes },
    stats: { ...fallback.stats, ...state.stats },
    settings: { ...fallback.settings, ...state.settings },
    physical: {
      ...createDefaultPhysicalState(),
      ...state.physical,
      injury: {
        ...createDefaultPhysicalState().injury,
        ...state.physical?.injury,
      },
      recoveryHistory: state.physical?.recoveryHistory ?? [],
    },
    equipmentLevels: {
      ...Object.fromEntries((state.ownedEquipment ?? fallback.ownedEquipment).map((id) => [id, 1])),
      ...state.equipmentLevels,
    },
    equipped: { ...fallback.equipped, ...state.equipped },
    skillLevels: { ...fallback.skillLevels, ...state.skillLevels },
  }

  if (next.activeMatch && !next.activeMatch.engine) {
    delete next.activeMatch
  }

  return next as GameState
}
