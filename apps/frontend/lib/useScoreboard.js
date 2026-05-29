'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSocket } from './socket'
import { SOCKET_EVENTS } from '@scoreboard/shared'
import { MOCK_TEAMS, MOCK_EVENT } from './mockData'

function sortTeams(teams) {
  return [...teams].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

export function useScoreboard({ mock = false } = {}) {
  const [teams, setTeams]   = useState(() => (mock ? sortTeams(MOCK_TEAMS) : []))
  const [event, setEvent]   = useState(() => (mock ? MOCK_EVENT : null))
  const [connected, setConnected]       = useState(false)
  const [reconnecting, setReconnecting] = useState(false)

  // Id of the team whose score last changed — cleared after 2 s.
  // Useful for admin highlight animations without extra API calls.
  const [lastChangedTeamId, setLastChangedTeamId] = useState(null)
  const highlightTimerRef = useRef(null)

  const socketRef = useRef(null)

  const setHighlight = useCallback((teamId) => {
    setLastChangedTeamId(teamId)
    clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => setLastChangedTeamId(null), 2_000)
  }, [])

  useEffect(() => {
    if (mock) {
      setConnected(true)
      return
    }

    const socket = getSocket()
    if (!socket) return
    socketRef.current = socket

    // ── Connection lifecycle ───────────────────────────────────────────────
    const onConnect = () => {
      setConnected(true)
      setReconnecting(false)
    }

    const onDisconnect = () => {
      setConnected(false)
    }

    const onReconnectAttempt = () => {
      setReconnecting(true)
    }

    const onReconnectFailed = () => {
      // All attempts exhausted (Infinity → never fires, but guard anyway)
      setReconnecting(false)
    }

    // ── State events ──────────────────────────────────────────────────────
    const onState = ({ teams: t, event: e }) => {
      // scoreboard:state includes ranks (added by broadcaster)
      setTeams(t)
      if (e) setEvent(e)
    }

    // ranking.updated: full sorted list with rank property, no event title
    const onRankingUpdated = ({ teams: t }) => {
      setTeams(t)
    }

    // score.updated: one team's score changed — use for highlight only
    const onScoreUpdated = ({ teamId }) => {
      setHighlight(teamId)
    }

    // team.updated: name / color changed — patch in place (no re-sort needed)
    const onTeamUpdated = ({ team }) => {
      setTeams((prev) => prev.map((t) => (t.id === team.id ? { ...t, ...team } : t)))
    }

    // game.updated: game status/name changed — consumers can subscribe directly
    // via getSocket().on('game.updated', ...) if needed

    socket.on('connect',                 onConnect)
    socket.on('disconnect',              onDisconnect)
    socket.on('reconnect_attempt',       onReconnectAttempt)
    socket.on('reconnect_failed',        onReconnectFailed)
    socket.on(SOCKET_EVENTS.SCOREBOARD_STATE, onState)
    socket.on(SOCKET_EVENTS.RANKING_UPDATED,  onRankingUpdated)
    socket.on(SOCKET_EVENTS.SCORE_UPDATED,    onScoreUpdated)
    socket.on(SOCKET_EVENTS.TEAM_UPDATED,     onTeamUpdated)

    if (socket.connected) {
      setConnected(true)
      setReconnecting(false)
    }

    return () => {
      socket.off('connect',                 onConnect)
      socket.off('disconnect',              onDisconnect)
      socket.off('reconnect_attempt',       onReconnectAttempt)
      socket.off('reconnect_failed',        onReconnectFailed)
      socket.off(SOCKET_EVENTS.SCOREBOARD_STATE, onState)
      socket.off(SOCKET_EVENTS.RANKING_UPDATED,  onRankingUpdated)
      socket.off(SOCKET_EVENTS.SCORE_UPDATED,    onScoreUpdated)
      socket.off(SOCKET_EVENTS.TEAM_UPDATED,     onTeamUpdated)
      clearTimeout(highlightTimerRef.current)
    }
  }, [mock, setHighlight])

  // Emit to server (admin actions)
  const emit = useCallback((eventName, data) => {
    const socket = socketRef.current ?? getSocket()
    socket?.emit(eventName, data)
  }, [])

  // Request a full state re-push (call after manual tab focus, etc.)
  const requestSync = useCallback(() => {
    const socket = socketRef.current ?? getSocket()
    socket?.emit(SOCKET_EVENTS.STATE_REQUEST)
  }, [])

  return {
    teams,
    setTeams,
    event,
    connected,
    reconnecting,
    lastChangedTeamId,
    emit,
    requestSync,
  }
}
