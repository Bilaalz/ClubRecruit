"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import type { ComponentProps } from "react";

/** Submit button that shows a pending label while its parent form action runs. */
export function SubmitButton({ pendingLabel, children, disabled, ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
