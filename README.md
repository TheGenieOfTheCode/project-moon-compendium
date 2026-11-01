# Genie's Project Moon Compendium

Homebrew and automated official effects for the Project Moon TTRPG Foundry system (`projectmoonttrpg`). Everything is
built with the system's own Easy Effects, so it behaves like the official items and can be edited the same way.

## Install

In Foundry, open **Add-on Modules → Install Module** and paste this into **Manifest URL**:

```
https://github.com/TheGenieOfTheCode/project-moon-compendium/releases/latest/download/module.json
```

Then enable **Genie's Project Moon Compendium** in your world.

## What's inside

### Boi's Homebrew (from *Boi's Homebrew Effects List*)

| Item | Type | What it does |
| --- | --- | --- |
| Vengeance's Mark | Status | Picks itself: the enemy who dealt the most damage to your side last round. One at a time. |
| Marked For Vengeance | Augment effect | Turns Vengeance's Mark on for your side. |
| Vengeance Tattoo | Augment effect | +N attack Dice Power against the marked target (max 2). |
| Checking The Book | Skill effect | On a clash win against the marked target: 2N Tremor and N Frostbite next round. |
| Chains Of Loyalty | Skill effect | Against the marked target: N Strength and N Endurance next round to an ally you pick. |

Vengeance's Mark needs a few lines in the world's Easy Effects script. The **Homebrew Setup** journal has them, with
install steps and the one setting: whether the mark re-picks every round, re-picks and clears, or stays put until its
holder can't fight (the default).

### Official Rows (Automated)

The system ships these "give to another character" effects without automation. This pack has working copies with the
same names; the player picks the character from a list. The pack gets priority 10 the first time a GM loads the module,
so the compendium browser shows these copies instead of the originals.

- Give Poise, Give Critical, Give Haste, Give Strength, Give Endurance, Give Protection, Give Stagger Protection,
  Give [Type] Protection
- Charge - Protection, Charge - Stagger Protection, Charge - Type Protection, Charge - Charge Barrier,
  Charge - Strength, Charge - Endurance, Charge - Haste (these also offer yourself)

### For your own effects

Any Easy Effects script can open the same picker:

```
proc "Give Ally: (N) Strength, (N) Endurance next round";
proc "Give Self Or Ally: (N*2) Protection next round";
```

## Development

- Sources: `src/<pack>/*.json` and `world-scripts/vengeances-mark.txt`.
- `node tools/build.mjs` builds `packs/` (the setup journal gets the world script inlined).
- `node tools/deploy.mjs` copies the module into Foundry's `Data/modules`.
- Run both with the Foundry server stopped.
- Publishing a GitHub release builds `module.zip` and the release's `module.json`.
