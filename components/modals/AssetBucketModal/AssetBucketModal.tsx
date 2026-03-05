"use client";
import { useRef } from "react";
import {
  Modal,
  Group,
  Text,
  Button,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Box,
  FileButton,
} from "@mantine/core";
import {
  IconPhoto,
  IconTrash,
  IconUpload,
  IconPlus,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type { AssetItem } from "@src/store/types";

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Called when user clicks "Use" on an asset – inserts into current frame */
  onUseAsset?: (asset: AssetItem) => void;
}

export function AssetBucketModal({ opened, onClose, onUseAsset }: Props) {
  const assets = useQuizStore((s) => s.assets);
  const addAsset = useQuizStore((s) => s.addAsset);
  const removeAsset = useQuizStore((s) => s.removeAsset);

  const handleUpload = (files: File[]) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        addAsset({
          id: String(Date.now() + Math.random()),
          name: file.name,
          src,
          addedAt: Date.now(),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        <Group gap="sm">
          <IconPhoto size={16} color="var(--mantine-color-blue-4)" />
          <Text fw={700} size="sm">
            Asset Bucket
          </Text>
          <Text size="xs" c="dimmed">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </Text>
        </Group>
      }
      styles={{
        header: {
          background: "var(--mantine-color-dark-7)",
          borderBottom: "1px solid var(--mantine-color-dark-5)",
        },
        body: {
          background: "var(--mantine-color-dark-8)",
          padding: 16,
        },
      }}
    >
      {/* Upload button */}
      <Group mb="md" gap="xs">
        <FileButton multiple accept="image/*" onChange={handleUpload}>
          {(props) => (
            <Button
              {...props}
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconUpload size={13} />}
            >
              Upload images
            </Button>
          )}
        </FileButton>
        <Text size="xs" c="dimmed">
          Drag an asset onto the canvas or click &ldquo;Use&rdquo; to insert it.
        </Text>
      </Group>

      {assets.length === 0 ? (
        <Box
          style={{
            border: "2px dashed var(--mantine-color-dark-4)",
            borderRadius: 8,
            padding: 48,
            textAlign: "center",
          }}
        >
          <IconPlus size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
          <Text size="sm" c="dimmed">
            No assets yet. Upload images to build your asset library.
          </Text>
        </Box>
      ) : (
        <SimpleGrid cols={4} spacing="sm">
          {assets.map((asset) => (
            <Box
              key={asset.id}
              style={{
                position: "relative",
                background: "var(--mantine-color-dark-6)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <img
                src={asset.src}
                alt={asset.name}
                style={{
                  width: "100%",
                  height: 90,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <Box p={4}>
                <Text
                  size="xs"
                  c="dimmed"
                  truncate
                  title={asset.name}
                  style={{ fontSize: 10 }}
                >
                  {asset.name}
                </Text>
              </Box>
              <Group
                gap={4}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                }}
              >
                {onUseAsset && (
                  <Tooltip label="Insert into frame" withArrow>
                    <Button
                      size="compact-xs"
                      variant="filled"
                      color="blue"
                      onClick={() => {
                        onUseAsset(asset);
                        onClose();
                      }}
                    >
                      Use
                    </Button>
                  </Tooltip>
                )}
                <Tooltip label="Remove from bucket" withArrow>
                  <ActionIcon
                    size={20}
                    color="red"
                    variant="filled"
                    onClick={() => removeAsset(asset.id)}
                  >
                    <IconTrash size={11} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Modal>
  );
}
