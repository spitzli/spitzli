import assert from "node:assert/strict";
import fs from "node:fs";
import gettext from "gettext-parser";

for (const locale of ["en", "de"]) {
  const po = gettext.po.parse(fs.readFileSync(`locales/${locale}.po`));
  const messages = {};
  for (const entry of Object.values(po.translations[""] || {})) {
    if (!entry.msgid) continue;
    assert.ok(!entry.comments?.flag?.includes("fuzzy"), `Fuzzy translation: ${entry.msgid}`);
    assert.equal(entry.msgstr.length, entry.msgid_plural ? 2 : 1);
    for (const text of entry.msgstr) {
      assert.ok(text.trim(), `Missing ${locale} translation: ${entry.msgid}`);
      assert.deepEqual(
        [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort(),
        [...entry.msgid.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort(),
        `Placeholder mismatch: ${entry.msgid}`,
      );
    }
    messages[entry.msgid] = entry.msgstr;
  }
  const output = `${JSON.stringify(messages, null, 2)}\n`;
  const destination = `src/i18n/messages/${locale}.json`;
  if (process.argv.includes("--check"))
    assert.equal(
      fs.readFileSync(destination, "utf8"),
      output,
      `Run npm run i18n:compile (${locale}).`,
    );
  else fs.writeFileSync(destination, output);
}
console.log("Gettext catalogs validated: en, de.");
