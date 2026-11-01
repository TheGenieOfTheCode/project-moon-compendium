import { promptChoiceDialog } from "/systems/projectmoonttrpg/module/easy-effects/choice-dialog.js";
import { runAsOwnerOrGM } from "/systems/projectmoonttrpg/module/easy-effects/gm-route.js";
import { CompendiumFlags } from "/systems/projectmoonttrpg/module/homebrew/compendium/compendium-flags.js";

export const MODULE_ID = "project-moon-compendium";
const ITEM_PACK = `${MODULE_ID}.official-automated`;

// `proc "Give Ally: (2) Strength, (2) Endurance next round"` from any Easy Effects script;
// "Give Self Or Ally:" also offers the giver. Easy Effects can't list characters, so the
// system's own choice dialog does the picking.
const GIVE_ALLY = /^Give (Self Or )?Ally:\s*(.+?)(?:\s+next\s+(round|turn))?\s*$/i;
const GRANT = /^\(?([\d\s+\-*/().]+?)\)?\s+(.+)$/;

// Our automated copies keep the official names; priority 10 is what the system gives a homebrew
// pack so same-name entries win. Only set once, so a GM's own choice in the Homebrew menu stays.
Hooks.once("ready", async () => {
  if (!game.user.isGM || !game.packs.get(ITEM_PACK)) return;
  const stored = game.settings.get("projectmoonttrpg", "compendiumPackConfigs") ?? {};
  if (stored[ITEM_PACK]) return;
  await CompendiumFlags.set(ITEM_PACK, { priority: 10 });
});

Hooks.on("pmttrpg.procTriggered", (payload) => {
  void onProcTriggered(payload);
});

async function onProcTriggered({ procName, proccer, focus } = {}) {
  const match = GIVE_ALLY.exec(String(procName ?? "").trim());
  if (!match) return;

  const giver = proccer ?? focus;
  if (!giver) return;
  const grants = parseGrants(match[2]);
  if (!grants.length) {
    console.warn(`${MODULE_ID} | Could not read the statuses in proc '${procName}'`);
    return;
  }
  const includeSelf = !!match[1];
  const arrival = match[3]?.toLowerCase() ?? null;

  const allies = [...(includeSelf ? [giver] : []), ...alliesOf(giver)];
  const what = grants.map((g) => `${g.amount} ${g.status}`).join(" and ");
  const when = arrival ? ` next ${arrival}` : "";
  if (!allies.length) {
    ui.notifications?.info(game.i18n.format("PMCOMP.GiveAlly.NoAllies", { what, name: giver.name }));
    return;
  }

  const choices = allies.map((actor, i) => ({
    id: `ally${i}`,
    label: actor === giver ? game.i18n.format("PMCOMP.GiveAlly.Self", { name: actor.name }) : actor.name,
  }));
  const picked = await promptChoiceDialog({
    prompt: game.i18n.format("PMCOMP.GiveAlly.Prompt", { what, when }),
    choices,
    actor: giver,
  });
  const index = choices.findIndex((c) => c.id === picked);
  if (index < 0) return;

  const ally = allies[index];
  for (const grant of grants) {
    if (arrival) {
      await runAsOwnerOrGM(ally, "addPendingStatusStacks", {
        statusName: grant.status,
        amount: grant.amount,
        arrival,
        originUuid: giver.uuid,
      });
    } else {
      await runAsOwnerOrGM(ally, "addStatusStacks", {
        statusName: grant.status,
        amount: grant.amount,
        originUuid: giver.uuid,
      });
    }
  }
}

function parseGrants(text) {
  const grants = [];
  for (const part of String(text).split(",")) {
    const m = GRANT.exec(part.trim());
    if (!m) continue;
    let amount;
    try {
      amount = Math.trunc(Roll.safeEval(m[1]));
    } catch {
      continue;
    }
    if (amount > 0) grants.push({ amount, status: m[2].trim() });
  }
  return grants;
}

// Same rule as the system's `allies`: same token disposition, never the giver.
function alliesOf(giver) {
  const disposition = dispositionOf(giver);
  if (disposition == null) return [];
  const pool = game.combat
    ? game.combat.combatants.map((c) => c.actor)
    : (canvas.scene?.tokens.map((t) => t.actor) ?? []);
  const seen = new Set([giver.uuid]);
  const out = [];
  for (const actor of pool) {
    if (!actor || seen.has(actor.uuid)) continue;
    seen.add(actor.uuid);
    if (dispositionOf(actor) !== disposition) continue;
    if ((actor.getStatusStacks?.("Defeated") ?? 0) > 0) continue;
    out.push(actor);
  }
  return out;
}

function dispositionOf(actor) {
  if (actor.isToken) return actor.token?.disposition ?? null;
  return actor.getActiveTokens?.(true)?.[0]?.document?.disposition ?? null;
}
