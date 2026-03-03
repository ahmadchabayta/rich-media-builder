"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { adProject } from "@src/lib/sanity/schema/adProject";
import { campaign } from "@src/lib/sanity/schema/campaign";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

export default defineConfig({
  name: "bls-producer",
  title: "BLS Ad Producer",
  projectId,
  dataset,
  apiVersion,
  basePath: "/studio",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("📋 All Ad Projects")
              .child(S.documentTypeList("adProject").title("All Ad Projects")),
            S.listItem()
              .title("✏️ Drafts")
              .child(
                S.documentTypeList("adProject")
                  .title("Drafts")
                  .filter('_type == "adProject" && status == "draft"'),
              ),
            S.listItem()
              .title("🔍 In Review")
              .child(
                S.documentTypeList("adProject")
                  .title("In Review")
                  .filter('_type == "adProject" && status == "in-review"'),
              ),
            S.listItem()
              .title("✅ Approved")
              .child(
                S.documentTypeList("adProject")
                  .title("Approved")
                  .filter('_type == "adProject" && status == "approved"'),
              ),
            S.listItem()
              .title("🟢 Published")
              .child(
                S.documentTypeList("adProject")
                  .title("Published")
                  .filter('_type == "adProject" && status == "published"'),
              ),
            S.listItem()
              .title("⏸️ Paused")
              .child(
                S.documentTypeList("adProject")
                  .title("Paused")
                  .filter('_type == "adProject" && status == "paused"'),
              ),
            S.listItem()
              .title("🗄️ Archived")
              .child(
                S.documentTypeList("adProject")
                  .title("Archived")
                  .filter('_type == "adProject" && status == "archived"'),
              ),
            S.divider(),
            S.listItem()
              .title("📣 Campaigns")
              .child(S.documentTypeList("campaign").title("Campaigns")),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],

  schema: {
    types: [adProject, campaign],
  },
});
