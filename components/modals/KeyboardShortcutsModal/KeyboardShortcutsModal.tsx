"use client";

import { Modal, Table, Text, Kbd, Group } from "@mantine/core";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "Z"], action: "Undo" },
  { keys: ["Ctrl", "Y"], action: "Redo" },
  { keys: ["Ctrl", "D"], action: "Duplicate selected object" },
  { keys: ["Ctrl", "C"], action: "Copy selected object" },
  { keys: ["Ctrl", "V"], action: "Paste object" },
  { keys: ["Delete"], action: "Remove selected object" },
  { keys: ["\u2190 \u2191 \u2192 \u2193"], action: "Nudge object 1 px" },
  {
    keys: ["Shift", "\u2190 \u2191 \u2192 \u2193"],
    action: "Nudge object 10 px",
  },
  { keys: ["Shift", "Drag"], action: "Resize object" },
  { keys: ["Ctrl", "Click"], action: "Multi-select" },
  { keys: ["Double-click"], action: "Inline-edit text" },
];

export function KeyboardShortcutsModal({ opened, onClose }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
    >
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Shortcut</Table.Th>
            <Table.Th>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {shortcuts.map((s, i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <Group gap={4}>
                  {s.keys.map((k, j) => (
                    <span key={j}>
                      {j > 0 && (
                        <Text span size="xs" c="dimmed" mx={2}>
                          +
                        </Text>
                      )}
                      <Kbd size="xs">{k}</Kbd>
                    </span>
                  ))}
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{s.action}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}
