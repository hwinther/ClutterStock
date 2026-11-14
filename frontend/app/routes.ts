import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('auth/callback', 'routes/auth.callback.tsx'),
  route('auth/signin', 'routes/auth.signin.tsx'),
  route('auth/signout', 'routes/auth.signout.tsx'),
  route('csp-report', 'routes/csp-report.tsx'),
  route('healthz', 'routes/healthz.tsx', [
    index('routes/healthz._index.tsx'),
    route('live', 'routes/healthz.live.tsx'),
    route('ready', 'routes/healthz.ready.tsx'),
  ]),
  route('debug/config', 'routes/debug.config.tsx'),
  route('debug/connectivity', 'routes/debug.connectivity.tsx'),
  route('debug/sse-ping', 'routes/debug.sse-ping.tsx'),
  route('sse/items', 'routes/sse.items.tsx'),
] satisfies RouteConfig
