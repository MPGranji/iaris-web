import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer, type ViteDevServer } from "vite";
import { defaultSections } from "../../shared/site-settings";

let server: ViteDevServer;
let context: Awaited<ReturnType<ViteDevServer["ssrLoadModule"]>>;
before(async () => {
  server = await createServer({
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    configFile: false,
    server: { middlewareMode: true },
    appType: "custom",
  });
  context = await server.ssrLoadModule("/src/hooks/useSiteSection.ts");
});
after(async () => {
  await server?.close();
});

test("all editable website sections render API content as escaped text", async () => {
  const cases = [
    ["components/Hero", "Hero", "hero", { laws: [] }],
    ["sections/About", "About", "about", {}],
    ["sections/About", "About", "partners", {}],
    ["sections/Courses", "Courses", "academy", { courses: [], tiers: [] }],
    ["sections/Media", "Media", "media", { media: [] }],
    ["sections/Contact", "Contact", "contact", { tiers: [], prefill: null }],
    ["components/Footer", "Footer", "footer", {}],
  ] as const;
  for (const [modulePath, name, id, props] of cases) {
    const module = await server.ssrLoadModule(`/src/${modulePath}.tsx`);
    const section = {
      ...defaultSections.find((s) => s.id === id),
      title: `Changed ${id} title`,
      subtitle: `Changed ${id} subtitle`,
      body: `Changed ${id} body <script>unsafe</script>`,
      phone: "+84 123456789",
      email: "sandbox@example.com",
      address: "Sandbox address",
      legalEntity: "Sandbox legal entity",
      buttonLabel: "Changed action",
    };
    const markup = renderToStaticMarkup(
      createElement(
        context.SiteSettingsContext.Provider,
        { value: { [id]: section } },
        createElement(module[name], props),
      ),
    );
    assert.ok(markup.includes(`Changed ${id} title`), id);
    assert.ok(markup.includes(`Changed ${id} subtitle`), id);
    if (id !== "contact") {
      assert.ok(markup.includes(`Changed ${id} body`), id);
      assert.ok(markup.includes("&lt;script&gt;unsafe&lt;/script&gt;"), id);
      assert.ok(!markup.includes("<script>unsafe</script>"), id);
    } else {
      for (const value of [
        "+84 123456789",
        "sandbox@example.com",
        "Sandbox address",
        "Sandbox legal entity",
      ])
        assert.ok(markup.includes(value));
    }
    if (id === "hero" || id === "academy")
      assert.ok(markup.includes("Changed action"), id);
  }
});
