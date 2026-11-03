import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // React Router rejects an action (400 "Bad Request") whose Origin header doesn't match
  // request.url's origin. Behind the ingress, TLS ends before the pod and react-router-serve
  // doesn't trust X-Forwarded-Proto, so request.url is http:// while the browser sends
  // Origin: https://: every form submit and fetcher action fails. These are the public hosts
  // (deploy APP_HOST values in the proxmox repo). The list only matches hosts, so a cross-site
  // request from anywhere else is still refused. Local dev is plain http on both sides and needs
  // no entry.
  allowedActionOrigins: [
    "clutterstock.wsh.no",
    "clutterstock.test.wsh.no",
    "*.preview.wsh.no", // clutterstock-<PR>.preview.wsh.no
  ],
} satisfies Config;
