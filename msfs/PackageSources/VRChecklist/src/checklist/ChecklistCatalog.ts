import airbusA400mData from "../../../../../checklists/data/airbus-a400m.json";
import airbusH125Data from "../../../../../checklists/data/airbus-h125.json";
import beechcraftBonanzaG36Data from "../../../../../checklists/data/beechcraft-bonanza-g36.json";
import diamondDa42Data from "../../../../../checklists/data/diamond-da42.json";
import hughesOh6a500cData from "../../../../../checklists/data/hughes-oh6a-500c.json";
import sikorskyMh60Data from "../../../../../checklists/data/sikorsky-mh-60.json";
import { Checklist } from "./ChecklistModel";

/*
 * Every checklist shipped with the app. The JSON files under
 * checklists/data/ are the only source of checklist content.
 */
export const checklists: readonly Checklist[] = [
  airbusA400mData as Checklist,
  airbusH125Data as Checklist,
  beechcraftBonanzaG36Data as Checklist,
  diamondDa42Data as Checklist,
  hughesOh6a500cData as Checklist,
  sikorskyMh60Data as Checklist,
];
