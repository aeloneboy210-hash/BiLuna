import { Card } from '@/components/ui/Card'
import type { LegalPage as Page } from '@/lib/legal/content'

/** The Privacy Policy or the Terms, in the site's language. */
export function LegalPage({ page, updatedLabel, updated }: { page: Page; updatedLabel: string; updated: string }) {
  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <p className="text-sm text-muted">
          {updatedLabel}: {updated}
        </p>
        <p className="leading-relaxed text-body">{page.intro}</p>
      </div>
      {page.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-ink">{section.heading}</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-body">
            {section.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="border-t border-line pt-4 text-sm text-muted">{page.notLawyer}</p>
    </Card>
  )
}
