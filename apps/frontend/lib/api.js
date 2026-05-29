const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

async function request(method, path, body) {
  const opts = { method, headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

const qs = (params) =>
  params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''

export const api = {
  teams: {
    list:   ()        => request('GET',    '/api/teams'),
    create: (body)    => request('POST',   '/api/teams', body),
    update: (id, b)   => request('PATCH',  `/api/teams/${id}`, b),
    delete: (id)      => request('DELETE', `/api/teams/${id}`),
  },
  games: {
    list:   (q)       => request('GET',    `/api/games${qs(q)}`),
    create: (body)    => request('POST',   '/api/games', body),
    update: (id, b)   => request('PATCH',  `/api/games/${id}`, b),
    delete: (id)      => request('DELETE', `/api/games/${id}`),
  },
  events: {
    active: ()        => request('GET',    '/api/events/active'),
    update: (id, b)   => request('PATCH',  `/api/events/${id}`, b),
  },
  scores: {
    list:   (q)       => request('GET',    `/api/scores${qs(q)}`),
    upsert: (body)    => request('POST',   '/api/scores', body),
    delete: (id)      => request('DELETE', `/api/scores/${id}`),
  },
}
