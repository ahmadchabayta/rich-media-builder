"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  TextInput,
  Code,
} from "@mantine/core";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  requireText?: string;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const closeWith = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpened(false);
    setOptions(null);
    setConfirmText("");
  }, []);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }

    setOptions(nextOptions);
    setConfirmText("");
    setOpened(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const needsTypedConfirm = !!options?.requireText;
  const typedOk =
    !needsTypedConfirm ||
    confirmText.trim().toLowerCase() ===
      options.requireText!.trim().toLowerCase();

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      <Modal
        opened={opened}
        onClose={() => closeWith(false)}
        title={options?.title ?? "Confirm"}
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">{options?.message}</Text>

          {needsTypedConfirm && (
            <>
              <Text size="xs" c="dimmed">
                Type <Code>{options?.requireText}</Code> to confirm.
              </Text>
              <TextInput
                size="xs"
                value={confirmText}
                onChange={(e) => setConfirmText(e.currentTarget.value)}
                placeholder={options?.requireText}
                autoFocus
              />
            </>
          )}

          <Group justify="flex-end" gap={8}>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => closeWith(false)}
            >
              {options?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              size="xs"
              color={options?.confirmColor ?? "red"}
              disabled={!typedOk}
              onClick={() => closeWith(true)}
            >
              {options?.confirmLabel ?? "Confirm"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error(
      "useConfirmDialog must be used inside ConfirmDialogProvider",
    );
  }
  return ctx;
}
