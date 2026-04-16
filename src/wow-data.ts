export type WowRole = "tank" | "heal" | "dd";

export interface SpecDefinition {
  key: string;
  label: string;
  icon: string;
  role: WowRole;
}

export interface ClassDefinition {
  key: string;
  label: string;
  icon: string;
  specs: SpecDefinition[];
}

export const WOW_CLASSES: ClassDefinition[] = [
  {
    key: "death-knight",
    label: "Death Knight",
    icon: "",
    specs: [
      { key: "blood", label: "Blood", icon: "<:dk_blood:1488218854424449174>", role: "tank", },
      { key: "frost", label: "Frost", icon: "<:dk_frost:1488218880966131824>", role: "dd", },
      { key: "unholy", label: "Unholy", icon: "<:dk_unholy:1488219077406101504>", role: "dd", },
    ],
  },
  {
    key: "demon-hunter",
    label: "Demon Hunter",
    icon: "",
    specs: [
      { key: "havoc", label: "Havoc", icon: "<:dh_havoc:1488218766167769211>", role: "dd" },
      { key: "vengeance", label: "Vengeance", icon: "<:dh_vengeance:1488218819590881290>", role: "tank" },
      { key: "devour", label: "Devour", icon: "<:dh_devour:1490369345262587914>", role: "dd" },
    ],
  },
  {
    key: "druid",
    label: "Druid",
    icon: "",
    specs: [
      { key: "balance", label: "Balance", icon: "<:druid_balance:1488219104644042803>", role: "dd" },
      { key: "feral", label: "Feral", icon: "<:druid_balance:1488219104644042803>", role: "dd" },
      { key: "guardian", label: "Guardian", icon: "<:druid_guardian:1488219318205288598>", role: "tank" },
      { key: "restoration", label: "Restoration", icon: "<:druid_guardian:1488219318205288598>", role: "heal" },
    ],
  },
  {
    key: "evoker",
    label: "Evoker",
    icon: "",
    specs: [
      { key: "augmentation", label: "Augmentation", icon: "<:evo_aug:1490370971910275173>", role: "dd" },
      { key: "devastation", label: "Devastation", icon: "<:evo_deva:1490370910899671180>", role: "dd" },
      { key: "preservation", label: "Preservation", icon: "<:evo_pers:1490371163946487849>", role: "heal" },
    ],
  },
  {
    key: "hunter",
    label: "Hunter",
    icon: "",
    specs: [
      { key: "beast-mastery", label: "Beast Mastery", icon: "<:hunter_bm:1488219369153499336>", role: "dd" },
      { key: "marksmanship", label: "Marksmanship", icon: "<:hunter_mm:1488219389877813474>", role: "dd" },
      { key: "survival", label: "Survival", icon: "<:hunter_survival:1488219413663453294>", role: "dd" },
    ],
  },
  {
    key: "mage",
    label: "Mage",
    icon: "",
    specs: [
      { key: "arcane", label: "Arcane", icon: "<:mage_arcane:1488219435532685442>", role: "dd" },
      { key: "fire", label: "Fire", icon: "<:mage_fire:1488219456843939952>", role: "dd" },
      { key: "frost", label: "Frost", icon: "<:mage_frost:1488219478645936138>", role: "dd" },
    ],
  },
  {
    key: "monk",
    label: "Monk",
    icon: "",
    specs: [
      { key: "brewmaster", label: "Brewmaster", icon: "<:monk_brewmaster:1488219508169638059>", role: "tank" },
      { key: "mistweaver", label: "Mistweaver", icon: "<:monk_mistweaver:1488219533645971597>", role: "heal" },
      { key: "windwalker", label: "Windwalker", icon: "<:monk_ww:1488219554097139867>", role: "dd" },
    ],
  },
  {
    key: "paladin",
    label: "Paladin",
    icon: "",
    specs: [
      { key: "holy", label: "Holy", icon: "<:paladin_holy:1488219583524634756>", role: "heal" },
      { key: "protection", label: "Protection", icon: "<:paladin_protection:1488219609206358057>", role: "tank" },
      { key: "retribution", label: "Retribution", icon: "<:paladin_ret:1488219633751167137>", role: "dd" },
    ],
  },
  {
    key: "priest",
    label: "Priest",
    icon: "",
    specs: [
      { key: "discipline", label: "Discipline", icon: "<:priest_disc:1488219666424795308>", role: "heal" },
      { key: "holy", label: "Holy", icon: "<:priest_holy:1488219727661760563>", role: "heal" },
      { key: "shadow", label: "Shadow", icon: "<:priest_shadow:1488219759228227644>", role: "dd" },
    ],
  },
  {
    key: "rogue",
    label: "Rogue",
    icon: "",
    specs: [
      { key: "assassination", label: "Assassination", icon: "<:rogue_assa:1488219781864886314>", role: "dd" },
      { key: "outlaw", label: "Outlaw", icon: "<:rogue_outlaw:1488219806292250737>", role: "dd" },
      { key: "subtlety", label: "Subtlety", icon: "<:rogue_sub:1488219856917499935>", role: "dd" },
    ],
  },
  {
    key: "shaman",
    label: "Shaman",
    icon: "",
    specs: [
      { key: "elemental", label: "Elemental", icon: "<:shaman_elem:1488219878820151296>", role: "dd" },
      { key: "enhancement", label: "Enhancement", icon: "<:shaman_enhancement:1488219898847957063>", role: "dd" },
      { key: "restoration", label: "Restoration", icon: "<:shaman_resto:1488219919274479756>", role: "heal" },
    ],
  },
  {
    key: "warlock",
    label: "Warlock",
    icon: "",
    specs: [
      { key: "affliction", label: "Affliction", icon: "<:warlock_affli:1488219958897934590>", role: "dd" },
      { key: "demonology", label: "Demonology", icon: "<:warlock_demono:1488219984168751154>", role: "dd" },
      { key: "destruction", label: "Destruction", icon: "<:warlock_destru:1488220043358502922>", role: "dd" },
    ],
  },
  {
    key: "warrior",
    label: "Warrior",
    icon: "",
    specs: [
      { key: "arms", label: "Arms", icon: "<:warrior_arms:1488220060702081094>", role: "dd" },
      { key: "fury", label: "Fury", icon: "<:warrior_fury:1488220086123761768>", role: "dd" },
      { key: "protection", label: "Protection", icon: "<:warrior_prot:1488220104507396228>", role: "tank" },
    ],
  },
];

export const ROLE_META: Record<WowRole, { label: string; icon: string }> = {
  tank: { label: "Tank", icon: "🛡️" },
  heal: { label: "Heal", icon: "💚" },
  dd: { label: "DD", icon: "⚔️" },
};

export function getClassDefinition(
  classKey: string,
): ClassDefinition | undefined {
  return WOW_CLASSES.find((entry) => entry.key === classKey);
}

export function getSpecDefinition(
  classKey: string,
  specKey: string,
): SpecDefinition | undefined {
  return getClassDefinition(classKey)?.specs.find(
    (entry) => entry.key === specKey,
  );
}
