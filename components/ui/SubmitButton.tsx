"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "./Spinner";

// For forms that post straight to a Server Action with no useActionState —
// useFormStatus is the only way those know they are busy.
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
