"use client";

import { Tabs, ScrollArea, Stack, Divider } from "@mantine/core";
import { IconStack2, IconAdjustments } from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import { useState } from "react";
import { ObjectEditorSection } from "@src/components/sidebar/ObjectEditorSection";
import { BgImageSection } from "@src/components/sidebar/BgImageSection";
import { LayersTab } from "./LayersTab";

function PropertiesTab() {
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  return (
    <ScrollArea h="100%" type="auto">
      {selectedObjectId ? (
        <ObjectEditorSection />
      ) : (
        <Stack p="md" gap="lg">
          <BgImageSection />
        </Stack>
      )}
    </ScrollArea>
  );
}

export function RightPanel() {
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  const [activeTab, setActiveTab] = useState<string | null>("layers");
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);

  if (selectedObjectId !== prevSelectedId) {
    setPrevSelectedId(selectedObjectId);
    if (selectedObjectId) {
      setActiveTab("properties");
    }
  }

  return (
    <Tabs
      value={activeTab}
      onChange={setActiveTab}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      styles={{
        root: { height: "100%" },
        panel: { flex: 1, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Tabs.List>
        <Tabs.Tab value="layers" leftSection={<IconStack2 size={13} />}>
          Layers
        </Tabs.Tab>
        <Tabs.Tab
          value="properties"
          leftSection={<IconAdjustments size={13} />}
        >
          Properties
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="layers" style={{ height: "100%", overflow: "hidden" }}>
        <LayersTab />
      </Tabs.Panel>
      <Tabs.Panel
        value="properties"
        style={{ height: "100%", overflow: "hidden" }}
      >
        <PropertiesTab />
      </Tabs.Panel>
    </Tabs>
  );
}
