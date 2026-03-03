// Re-export the Template type and all templates from their individual files.
// Add new templates by creating a file in the matching category folder and
// importing it here, then appending it to TEMPLATES.

export type { Template } from "./templates/_shared";

import type { Template } from "./templates/_shared";

//  Quiz 
export { cyberPulse } from "./templates/quiz/cyberPulse";
export { neonAurora } from "./templates/quiz/neonAurora";
import { cyberPulse } from "./templates/quiz/cyberPulse";
import { neonAurora } from "./templates/quiz/neonAurora";

//  Sport 
export { sportBlitz } from "./templates/sport/sportBlitz";
import { sportBlitz } from "./templates/sport/sportBlitz";

//  Promo 
export { goldenHour } from "./templates/promo/goldenHour";
import { goldenHour } from "./templates/promo/goldenHour";

//  Poll 
export { arcticPro } from "./templates/poll/arcticPro";
import { arcticPro } from "./templates/poll/arcticPro";

//  News 
export { solarFlare } from "./templates/news/solarFlare";
import { solarFlare } from "./templates/news/solarFlare";

//  Master list (order = gallery display order) 
export const TEMPLATES: Template[] = [
  cyberPulse,
  neonAurora,
  sportBlitz,
  goldenHour,
  arcticPro,
  solarFlare,
];
