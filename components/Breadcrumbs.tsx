import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/site";
import { getBreadcrumbStructuredData } from "@/lib/site";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = JSON.stringify(getBreadcrumbStructuredData(items)).replace(/</g, "\\u003c");

  return <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-7 print:hidden">
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => <li key={item.href} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          {index === items.length - 1
            ? <span aria-current="page" className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
            : <Link href={item.href} className="hover:text-emerald-700 dark:hover:text-emerald-300">{item.label}</Link>}
        </li>)}
      </ol>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
  </div>;
}
