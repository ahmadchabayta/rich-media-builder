"use client";

import BlsProducer from "@src/components/layout/BlsProducer";
import { ErrorBoundary } from "@src/components/modals/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <BlsProducer />
    </ErrorBoundary>
  );
}
