"use client";

import { useState, useEffect } from "react";
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
  LoadingOverlay,
} from "@mantine/core";
import { DatePickerInput, type DateValue } from "@mantine/dates";
import { IconCloudUpload, IconExternalLink } from "@tabler/icons-react";
import { useSanityCloud } from "@src/hooks/useSanityCloud";
import { useQuizStore } from "@src/store/quizStore";
import "dayjs/locale/en";

import {
  STATUS_OPTIONS,
  FORMAT_OPTIONS,
  PLATFORM_OPTIONS,
  DEVICE_OPTIONS,
  AGE_OPTIONS,
} from "./cloudFormConstants";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function SaveToCloudModal({ opened, onClose }: Props) {
  const { saveToCloud, saving } = useSanityCloud();
  const cloudProjectId = useQuizStore((s) => s.cloudProjectId);
  const setCloudProjectId = useQuizStore((s) => s.setCloudProjectId);
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);

  const [metaLoading, setMetaLoading] = useState(false);
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

  // When modal opens with an existing project — fetch its metadata from Sanity
  useEffect(() => {
    if (!opened) return;
    if (!cloudProjectId) return;
    setMetaLoading(true);
    fetch(`/api/cloud/projects/${cloudProjectId}`)
      .then((r) => r.json())
      .then((doc) => {
        if (!doc || doc.error) return;
        setTitle(doc.title ?? "");
        setStatus(doc.status ?? "draft");
        setFormat(doc.format ?? null);
        setClient(doc.client ?? "");
        setNotes(doc.notes ?? "");
        setPublishDate(doc.publishDate ? new Date(doc.publishDate) : null);
        setEndDate(doc.endDate ? new Date(doc.endDate) : null);
        setPlatforms(doc.platforms ?? []);
        setTags(doc.tags ?? []);
        setAgeRanges(doc.audience?.ageRanges ?? []);
        setGender(doc.audience?.gender ?? "all");
        setDevices(doc.audience?.devices ?? []);
        setInterests(doc.audience?.interests ?? []);
        setRegions(doc.audience?.regions ?? []);
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => setMetaLoading(false));
  }, [opened, cloudProjectId]);

  const buildMeta = () => ({
    title: title.trim(),
    status,
    format: format ?? undefined,
    client: client || undefined,
    notes: notes || undefined,
    publishDate: publishDate ? new Date(publishDate).toISOString() : undefined,
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

  const handleSave = async () => {
    if (!title.trim()) return;
    const id = await saveToCloud(buildMeta());
    if (id) onClose();
  };

  const handleSaveAsNew = async () => {
    if (!title.trim()) return;
    setCloudProjectId(null);
    await new Promise((r) => setTimeout(r, 0));
    const id = await saveToCloud(buildMeta());
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
      <LoadingOverlay visible={metaLoading} overlayProps={{ blur: 1 }} />
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
            {cloudProjectId && (
              <Button
                variant="light"
                color="teal"
                leftSection={<IconCloudUpload size={14} />}
                onClick={handleSaveAsNew}
                loading={saving}
                disabled={!title.trim()}
              >
                Save as New
              </Button>
            )}
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
