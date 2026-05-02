// Allure 3 config. Recognized filename per @allurereport/core (allurerc.{js,mjs,cjs,json,yaml,yml}).
// historyPath is a single JSONL file (Allure 3's per-run history is appended one line at a time);
// store outside the report dir so we can ship it as its own GHCR image without dragging the rest.
// Other settings (output, name, plugins) use Allure 3 defaults — the awesome plugin is bundled.
export default {
  historyPath: "./allure-history.jsonl",
};
