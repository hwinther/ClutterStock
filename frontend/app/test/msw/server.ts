import { setupServer } from "msw/node";
import { defaultApiHandlers } from "./handlers";

export const testApiServer = setupServer(...defaultApiHandlers);
