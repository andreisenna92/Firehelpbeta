import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import type { FireMapProps } from "./FireMapImpl";

const FireMapImpl = lazy(() => import("./FireMapImpl"));

export type { MapPoint } from "./FireMapImpl";

export function FireMap(props: FireMapProps) {
  const fallback = <Skeleton className="size-full rounded-none" />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <FireMapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}
