import type { ComponentProps } from "react";

const fieldClassName =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

function mergeClassName(extra: string | undefined) {
  return extra ? `${fieldClassName} ${extra}` : fieldClassName;
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={mergeClassName(className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={mergeClassName(className)} />;
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {children}
    </button>
  );
}
