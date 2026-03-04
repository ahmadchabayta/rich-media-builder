// Re-export the Template type and all templates from their individual files.
// Add new templates by creating a file in the matching category folder and
// importing it here, then appending it to TEMPLATES.

export type { Template } from "./templates/_shared";

import type { Template } from "./templates/_shared";

import { cosmos } from "./templates/quiz/cosmos";
export { cosmos } from "./templates/quiz/cosmos";

//  Master list (order = gallery display order)
export const TEMPLATES: Template[] = [cosmos];
