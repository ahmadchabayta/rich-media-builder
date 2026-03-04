import { defineField, defineType } from "sanity";

const STATUS_OPTIONS = [
  { title: "Draft", value: "draft" },
  { title: "In Review", value: "in-review" },
  { title: "Approved", value: "approved" },
  { title: "Published", value: "published" },
  { title: "Paused", value: "paused" },
  { title: "Archived", value: "archived" },
];

const FORMAT_OPTIONS = [
  { title: "Quiz", value: "quiz" },
  { title: "Poll", value: "poll" },
  { title: "Survey", value: "survey" },
  { title: "Countdown", value: "countdown" },
  { title: "Promo", value: "promo" },
  { title: "News / Live", value: "news" },
];

const PLATFORM_OPTIONS = [
  { title: "DV360", value: "dv360" },
  { title: "CM360", value: "cm360" },
  { title: "Xandr", value: "xandr" },
  { title: "The Trade Desk", value: "ttd" },
  { title: "Meta", value: "meta" },
  { title: "TikTok", value: "tiktok" },
  { title: "AppNexus", value: "appnexus" },
  { title: "Amazon DSP", value: "amazon" },
];

const DEVICE_OPTIONS = [
  { title: "Mobile", value: "mobile" },
  { title: "Desktop", value: "desktop" },
  { title: "Tablet", value: "tablet" },
  { title: "CTV", value: "ctv" },
];

const AGE_OPTIONS = [
  { title: "13–17", value: "13-17" },
  { title: "18–24", value: "18-24" },
  { title: "25–34", value: "25-34" },
  { title: "35–44", value: "35-44" },
  { title: "45–54", value: "45-54" },
  { title: "55+", value: "55+" },
  { title: "18+", value: "18+" },
];

export const adProject = defineType({
  name: "adProject",
  title: "Ad Project",
  type: "document",
  icon: () => "🎯",
  groups: [
    { name: "overview", title: "Overview", default: true },
    { name: "schedule", title: "Schedule" },
    { name: "targeting", title: "Targeting" },
    { name: "data", title: "Project Data" },
  ],
  fields: [
    // ─── Overview ─────────────────────────────────────────────────────────────
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "overview",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      group: "overview",
      options: { hotspot: true },
    }),
    defineField({
      name: "previewImages",
      title: "Ad Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: false } }],
      group: "overview",
      readOnly: true,
      description:
        "Auto-populated when the project is saved — shows all images used in the ad.",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "overview",
      options: {
        list: STATUS_OPTIONS,
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "draft",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "format",
      title: "Format",
      type: "string",
      group: "overview",
      options: { list: FORMAT_OPTIONS },
    }),
    defineField({
      name: "client",
      title: "Client / Brand",
      type: "string",
      group: "overview",
    }),
    defineField({
      name: "campaign",
      title: "Campaign",
      type: "reference",
      to: [{ type: "campaign" }],
      group: "overview",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      group: "overview",
      options: { layout: "tags" },
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      rows: 3,
      group: "overview",
    }),
    // ─── Schedule ─────────────────────────────────────────────────────────────
    defineField({
      name: "publishDate",
      title: "Publish Date",
      type: "datetime",
      group: "schedule",
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "datetime",
      group: "schedule",
    }),
    defineField({
      name: "platforms",
      title: "DSP Platforms",
      type: "array",
      of: [{ type: "string" }],
      group: "schedule",
      options: { list: PLATFORM_OPTIONS, layout: "grid" },
    }),
    // ─── Targeting ────────────────────────────────────────────────────────────
    defineField({
      name: "audience",
      title: "Audience",
      type: "object",
      group: "targeting",
      fields: [
        {
          name: "ageRanges",
          title: "Age Ranges",
          type: "array",
          of: [{ type: "string" }],
          options: { list: AGE_OPTIONS, layout: "grid" },
        },
        {
          name: "gender",
          title: "Gender",
          type: "string",
          options: {
            list: [
              { title: "All", value: "all" },
              { title: "Male", value: "male" },
              { title: "Female", value: "female" },
              { title: "Non-binary", value: "nonbinary" },
            ],
            layout: "radio",
            direction: "horizontal",
          },
          initialValue: "all",
        },
        {
          name: "devices",
          title: "Devices",
          type: "array",
          of: [{ type: "string" }],
          options: { list: DEVICE_OPTIONS, layout: "grid" },
        },
        {
          name: "interests",
          title: "Interests / Keywords",
          type: "array",
          of: [{ type: "string" }],
          options: { layout: "tags" },
        },
        {
          name: "regions",
          title: "Regions / Geo",
          type: "array",
          of: [{ type: "string" }],
          options: { layout: "tags" },
        },
      ],
    }),
    // ─── Project Data (hidden from editors, used by the producer app) ─────────
    defineField({
      name: "adSizeW",
      title: "Ad Width (px)",
      type: "number",
      group: "data",
      readOnly: true,
    }),
    defineField({
      name: "adSizeH",
      title: "Ad Height (px)",
      type: "number",
      group: "data",
      readOnly: true,
    }),
    defineField({
      name: "snapshotVersion",
      title: "Snapshot Version",
      type: "number",
      group: "data",
      readOnly: true,
      initialValue: 1,
    }),
    defineField({
      name: "snapshotJson",
      title: "Project Snapshot (JSON)",
      type: "text",
      group: "data",
      readOnly: true,
      hidden: true, // hidden in Studio UI — managed by the producer app
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "thumbnail",
      status: "status",
      format: "format",
      w: "adSizeW",
      h: "adSizeH",
    },
    prepare({ title, media, status, format, w, h }) {
      const dim = w && h ? ` · ${w}×${h}` : "";
      const statusEmoji: Record<string, string> = {
        draft: "✏️",
        "in-review": "🔍",
        approved: "✅",
        published: "🟢",
        paused: "⏸️",
        archived: "🗄️",
      };
      const badge = statusEmoji[status as string] ?? "";
      return {
        title: `${badge} ${title ?? "Untitled"}`,
        subtitle: [format, dim].filter(Boolean).join(" "),
        media,
      };
    },
  },
});
