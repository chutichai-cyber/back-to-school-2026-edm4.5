export const SOCKET_EVENTS = {
  // ── Server → client (broadcast) ────────────────────────────────────────────
  SCOREBOARD_STATE: 'scoreboard:state',  // full snapshot (connect + reset)
  SCORE_UPDATED:    'score.updated',     // one team's score changed
  RANKING_UPDATED:  'ranking.updated',   // sorted ranking list (any score change)
  TEAM_UPDATED:     'team.updated',      // team name / color changed
  GAME_UPDATED:     'game.updated',      // game status / name changed

  // ── Client → server (admin actions) ────────────────────────────────────────
  SCORE_UPDATE:  'score:update',   // delta-based score change
  SCORE_SET:     'score:set',      // exact score set
  SCORE_RESET:   'score:reset',    // reset all scores to 0
  TEAM_ADD:      'team:add',       // add a new team
  TEAM_REMOVE:   'team:remove',    // delete a team
  EVENT_UPDATE:  'event:update',   // rename the active event
  STATE_REQUEST: 'state:request',  // request a full state re-push (reconnect)
}
