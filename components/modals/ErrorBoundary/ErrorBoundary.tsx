"use client";

import { Component, type ReactNode } from "react";
import { Button, Stack, Text, Title, Paper } from "@mantine/core";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper
          p="xl"
          m="xl"
          radius="md"
          withBorder
          style={{
            maxWidth: 520,
            margin: "80px auto",
            textAlign: "center",
          }}
        >
          <Stack align="center" gap="md">
            <Title order={3} c="red">
              Something went wrong
            </Title>
            <Text size="sm" c="dimmed">
              {this.state.error?.message || "An unexpected error occurred."}
            </Text>
            <Button
              variant="light"
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
            >
              Try again
            </Button>
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </Stack>
        </Paper>
      );
    }
    return this.props.children;
  }
}
