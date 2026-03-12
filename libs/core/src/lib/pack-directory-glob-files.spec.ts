/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory } from "@lerna/test-helpers";
import { packDirectory } from "./pack-directory";
import { getPackages } from "./project";

require("@lerna/test-helpers/src/lib/silence-logging");

jest.unmock("./run-lifecycle");

const npmConf = require("./npm-conf");

const initFixture = initFixtureFactory(__dirname);

describe("pack-directory glob files", () => {
  it("includes files matched by glob patterns even when .gitignore excludes them", async () => {
    const cwd = await initFixture("pack-directory-glob-files");
    const conf = npmConf({ prefix: cwd }).snapshot;
    const pkgs = await getPackages(cwd);

    // Pack the package (like lerna publish does)
    const results = await Promise.all(pkgs.map((pkg) => packDirectory(pkg, pkg.location, conf)));

    expect(results).toHaveLength(1);
    const result = results[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packedFiles = (result.files as any[]).map((f: { path: string }) => f.path).sort();

    // Verify glob-matched .mjs files are included (src/**/*.mjs) despite .gitignore excluding them
    expect(packedFiles).toContain("src/index.mjs");
    expect(packedFiles).toContain("src/fields/fixed-fields.mjs");
    expect(packedFiles).toContain("src/identity/errors/ElementIdentityError.mjs");

    // Verify glob-matched .cjs files are included (src/**/*.cjs) despite .gitignore excluding them
    expect(packedFiles).toContain("src/index.cjs");
    expect(packedFiles).toContain("src/fields/fixed-fields.cjs");
    expect(packedFiles).toContain("src/identity/errors/ElementIdentityError.cjs");

    // Verify directory entry files are included (dist/)
    expect(packedFiles).toContain("dist/index.js");

    // Verify individual file entry is included
    expect(packedFiles).toContain("types/glob-pkg.d.ts");

    // Verify package.json is always included
    expect(packedFiles).toContain("package.json");

    // Verify .ts files are NOT included (not in files field, excluded by .gitignore)
    expect(packedFiles).not.toContain("src/index.ts");

    // 11 .mjs + 11 .cjs + 1 dist/index.js + 1 types/glob-pkg.d.ts + 1 package.json = 25
    const mjsFiles = packedFiles.filter((f: string) => f.endsWith(".mjs"));
    const cjsFiles = packedFiles.filter((f: string) => f.endsWith(".cjs"));
    expect(mjsFiles).toHaveLength(11);
    expect(cjsFiles).toHaveLength(11);
    expect(result.entryCount).toBe(25);
  }, 30000);
});
