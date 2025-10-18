export const PLAYER_TYPE_VALUES = ["npc", "player"] as const;
export type PlayerType = (typeof PLAYER_TYPE_VALUES)[number];

export const PLAYER_TYPE_OPTIONS: ReadonlyArray<{ value: PlayerType; label: string }> = [
  { value: "npc", label: "NPC" },
  { value: "player", label: "Player Character" },
] as const;

export const RACE_OPTIONS = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Dragonborn",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
] as const;

export const CLASS_OPTIONS = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;

export const LOCATION_SUGGESTIONS = [
  "Baldur's Gate",
  "Neverwinter",
  "Waterdeep",
  "Silverymoon",
  "Candlekeep",
  "Elven Enclave",
  "Dwarven Stronghold",
  "Hidden Hideout",
  "Capital City",
  "Unknown",
] as const;
