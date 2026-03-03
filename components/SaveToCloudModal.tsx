"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  TextInput,
  Select,
  MultiSelect,
  Textarea,
  Group,
  Button,
  Text,
  Divider,
  Badge,
  TagsInput,
} from "@mantine/core";
import { DatePickerInput, type DateValue } from "@mantine/dates";
import { IconCloudUpload, IconExternalLink } from "@tabler/icons-react";
import { useSanityCloud } from "@src/hooks/useSanityCloud";
import { useQuizStore } from "@src/store/quizStore";
import "dayjs/locale/en";

const STATUS_OPTIONS = [
  { value: "draft", label: "✏️ Draft" },
  { value: "in-review", label: "🔍 In Review" },
  { value: "approved", label: "✅ Approved" },
  { value: "published", label: "🟢 Published" },
  { value: "paused", label: "⏸️ Paused" },
  { value: "archived", label: "🗄️ Archived" },
];

const FORMAT_OPTIONS = [
  { value: "quiz", label: "Quiz" },
  { value: "poll", label: "Poll" },
  { value: "survey", label: "Survey" },
  { value: "countdown", label: "Countdown" },
  { value: "promo", label: "Promo" },
  { value: "news", label: "News / Live" },
];

const PLATFORM_OPTIONS = [
  { value: "dv360", label: "DV360" },
  { value: "cm360", label: "CM360" },
  { value: "xandr", label: "Xandr" },
  { value: "ttd", label: "The Trade Desk" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "appnexus", label: "AppNexus" },
  { value: "amazon", label: "Amazon DSP" },
];

const DEVICE_OPTIONS = [
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "ctv", label: "CTV" },
];

const AGE_OPTIONS = [
  { value: "13-17", label: "13–17" },
  { value: "18-24", label: "18–24" },
  { value: "25-34", label: "25–34" },
  { value: "35-44", label: "35–44" },
  { value: "45-54", label: "45–54" },
  { value: "55+", label: "55+" },
];

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function SaveToCloudModal({ opened, onClose }: Props) {
  const { saveToCloud, saving } = useSanityCloud();
  const cloudProjectId = useQuizStore((s) => s.cloudProjectId);
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [format, setFormat] = useState<string | null>(null);
  const [client, setClient] = useState("");
  const [notes, setNotes] = useState("");
  const [publishDate, setPublishDate] = useState<DateValue>(null);
  const [endDate, setEndDate] = useState<DateValue>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [ageRanges, setAgeRanges] = useState<string[]>([]);
  const [gender, setGender] = useState<string | null>("all");
  const [devices, setDevices] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  const handleSave = async () => {
    if (!title.trim()) return;
    const id = await saveToCloud({
      title: title.trim(),
      status,
      format: format ?? undefined,
      client: client || undefined,
      notes: notes || undefined,
      publishDate: publishDate
        ? new Date(publishDate).toISOString()
        : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      platforms,
      tags,
      audience: {
        ageRanges,
        gender: gender ?? "all",
        devices,
        interests,
        regions,
      },
    });
    if (id) onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCloudUpload size={16} />
          <Text fw={700}>
            {cloudProjectId ? "Update Cloud Project" : "Save to Cloud"}
          </Text>
          <Badge size="xs" color="gray" variant="light">
            {defaultW}×{defaultH}
          </Badge>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* ── Overview ── */}
        <TextInput
          label="Project Title"
          placeholder="e.g. Summer 2026 Quiz — Mobile"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
          data-autofocus
        />

        <Group grow>
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v ?? "draft")}
          />
          <Select
            label="Format"
            data={FORMAT_OPTIONS}
            placeholder="Pick format"
            value={format}
            onChange={setFormat}
            clearable
          />
        </Group>

        <TextInput
          label="Client / Brand"
          placeholder="e.g. Nike"
          value={client}
          onChange={(e) => setClient(e.currentTarget.value)}
        />

        <Divider label="📅 Schedule" labelPosition="left" />

        <Group grow>
          <DatePickerInput
            label="Publish Date"
            placeholder="Pick date"
            value={publishDate}
            onChange={setPublishDate}
            clearable
          />
          <DatePickerInput
            label="End Date"
            placeholder="Pick date"
            value={endDate}
            onChange={setEndDate}
            clearable
            minDate={publishDate ? new Date(publishDate) : undefined}
          />
        </Group>

        <MultiSelect
          label="DSP Platforms"
          data={PLATFORM_OPTIONS}
          value={platforms}
          onChange={setPlatforms}
          placeholder="Select platforms"
        />

        <Divider label="🎯 Targeting" labelPosition="left" />

        <Group grow align="flex-start">
          <MultiSelect
            label="Age Ranges"
            data={AGE_OPTIONS}
            value={ageRanges}
            onChange={setAgeRanges}
            placeholder="Any age"
          />
          <Select
            label="Gender"
            data={[
              { value: "all", label: "All" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "nonbinary", label: "Non-binary" },
            ]}
            value={gender}
            onChange={setGender}
          />
        </Group>

        <MultiSelect
          label="Devices"
          data={DEVICE_OPTIONS}
          value={devices}
          onChange={setDevices}
          placeholder="All devices"
        />

        <TagsInput
          label="Interests / Keywords"
          placeholder="Type and press Enter"
          value={interests}
          onChange={setInterests}
        />

        <TagsInput
          label="Regions / Geo"
          placeholder="e.g. US, EU, MENA"
          value={regions}
          onChange={setRegions}
        />

        <TagsInput
          label="Tags"
          placeholder="Tag & press Enter"
          value={tags}
          onChange={setTags}
        />

        <Divider label="📝 Notes" labelPosition="left" />

        <Textarea
          label="Internal Notes"
          placeholder="Any info for the team…"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={3}
        />

        <Divider />

        <Group justify="space-between">
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconExternalLink size={12} />}
            component="a"
            href="/studio"
            target="_blank"
          >
            Open Studio
          </Button>
          <Group>
            <Button variant="default" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              leftSection={<IconCloudUpload size={14} />}
              onClick={handleSave}
              loading={saving}
              disabled={!title.trim()}
            >
              {cloudProjectId ? "Update" : "Save to Cloud"}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
