import Link from "next/link";

export default function CrmLayout({ children }: LayoutProps<"/crm">) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Meta Agent
          </p>
          <p className="text-xs text-zinc-500">MVP · Nivel 1</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/crm"
            className="rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Leads y CRM
          </Link>
          <Link
            href="/crm/campaigns"
            className="rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Campañas
          </Link>
          <span className="cursor-not-allowed rounded-md px-3 py-2 text-zinc-400">
            Reportes (próximamente)
          </span>
        </nav>
      </aside>
      <main className="flex-1 bg-white p-6 dark:bg-black">{children}</main>
    </div>
  );
}
