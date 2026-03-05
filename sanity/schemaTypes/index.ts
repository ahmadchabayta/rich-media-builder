import { type SchemaTypeDefinition } from "sanity";
import { adProject } from "@src/lib/sanity/schema/adProject";
import { campaign } from "@src/lib/sanity/schema/campaign";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [adProject, campaign],
};
