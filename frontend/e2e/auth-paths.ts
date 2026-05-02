import { fileURLToPath } from "node:url";

export const authFile = fileURLToPath(
  new URL("../playwright/.auth/user.json", import.meta.url),
);

export const sessionFile = fileURLToPath(
  new URL("../playwright/.auth/session-storage.json", import.meta.url),
);

export const authDir = fileURLToPath(
  new URL("../playwright/.auth", import.meta.url),
);
