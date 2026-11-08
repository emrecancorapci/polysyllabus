/// <reference types="astro/client" />

// Allow importing .astro components from TypeScript modules. tsc and
// typescript-eslint have no built-in knowledge of .astro files; `astro check`
// type-checks the .astro files themselves.
declare module "*.astro" {
  import type { AstroComponentFactory } from "astro/runtime/server/index";

  const component: AstroComponentFactory;
  export default component;
}
