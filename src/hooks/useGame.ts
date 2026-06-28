import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  advanceMatch,
  buyEquipment,
  calculateOvr,
  claimMissionReward,
  clearFinishedMatch,
  createInitialGame,
  dismissOfflineSummary,
  equipItem,
  resetProgress,
  restPlayer,
  signSponsor,
  skipMatch,
  startMatch,
  trainAttribute,
  upgradeSkill,
  applyMatchSkill,
} from '../utils/gameLogic'
import { clearSave, loadGame, saveGame } from '../utils/storage'
import type {
  AttributeKey,
  CreatePlayerInput,
  GameState,
  StrategyKey,
} from '../types/game'

export function useGame() {
  const [state, setState] = useState<GameState>(() => loadGame())

  useEffect(() => {
    saveGame(state)
  }, [state])

  useEffect(() => {
    if (state.activeMatch?.status !== 'running') return
    const timer = window.setInterval(() => {
      setState((current) => advanceMatch(current))
    }, 1250)

    return () => window.clearInterval(timer)
  }, [state.activeMatch?.status, state.activeMatch?.id])

  const ovr = useMemo(() => calculateOvr(state), [state])

  const actions = useMemo(
    () => ({
      createPlayer(input: CreatePlayerInput) {
        setState(createInitialGame(input))
      },
      train(key: AttributeKey, times: number | 'max') {
        setState((current) => trainAttribute(current, key, times))
      },
      rest() {
        setState((current) => restPlayer(current))
      },
      startMatch(strategy: StrategyKey) {
        setState((current) => startMatch(current, strategy))
      },
      useSkill(skillId: string) {
        setState((current) => applyMatchSkill(current, skillId))
      },
      skipMatch() {
        setState((current) => skipMatch(current))
      },
      clearMatch() {
        setState((current) => clearFinishedMatch(current))
      },
      buyEquipment(itemId: string) {
        setState((current) => buyEquipment(current, itemId))
      },
      equipItem(itemId: string) {
        setState((current) => equipItem(current, itemId))
      },
      signSponsor(sponsorId: string) {
        setState((current) => signSponsor(current, sponsorId))
      },
      upgradeSkill(skillId: string) {
        setState((current) => upgradeSkill(current, skillId))
      },
      claimMission(missionId: string) {
        setState((current) => claimMissionReward(current, missionId))
      },
      dismissOffline() {
        setState((current) => dismissOfflineSummary(current))
      },
      toggleMusic() {
        setState((current) => ({
          ...current,
          settings: { ...current.settings, music: !current.settings.music },
        }))
      },
      toggleSound() {
        setState((current) => ({
          ...current,
          settings: { ...current.settings, sound: !current.settings.sound },
        }))
      },
      setGraphics(graphics: GameState['settings']['graphics']) {
        setState((current) => ({
          ...current,
          settings: { ...current.settings, graphics },
        }))
      },
      reset() {
        clearSave()
        setState(resetProgress())
      },
    }),
    [],
  )

  const setStateSafely = useCallback((next: GameState) => {
    setState(next)
  }, [])

  return { state, ovr, actions, setState: setStateSafely }
}
