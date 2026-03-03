import { defineField, defineType } from "sanity";

export const campaign = defineType({
  name: "campaign",
  title: "Campaign",
  type: "document",
  icon: () => "📣",
  fields: [
    defineField({
      name: "name",
      title: "Campaign Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "client",
      title: "Client / Brand",
      type: "string",
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "datetime",
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "datetime",
    }),
    defineField({
      name: "budget",
      title: "Budget (USD)",
      type: "number",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "client" },
  },
});
