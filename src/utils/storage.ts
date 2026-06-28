import { applyOfflineProgress, createEmptyGame, SAVE_VERSION } from './gameLogic'
import type { GameState } from '../types/game'

const SAVE_KEY = 'copa-brazuka-save-v1'

export function loadGame(): GameState {
  if (typeof window === 'undefined') return createEmptyGame()

  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return createEmptyGame()
    const parsed = JSON.parse(raw) as GameState

    if (parsed.version !== SAVE_VERSION) {
      return createEmptyGame()
    }

    return applyOfflineProgress(parsed)
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
