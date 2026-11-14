import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { getDict } from '@/lib/i18n/server'
import { MODULES, moduleStatusKey, type BiLunaModule } from '@/lib/modules'

export const metadata: Metadata = { title: 'Roadmap' }

function ModuleList({ title, modules, dict }: { title: string; modules: BiLunaModule[]; dict: Dictionary }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modules.map((m) => (
          <li key={m.id} id={m.id} className="scroll-mt-6">
            <Card className="flex h-full flex-col gap-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{m.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    m.status === 'working' ? 'bg-brand text-white' : 'bg-soft text-body'
                  }`}
                >
                  {dict.moduleStatus[moduleStatusKey(m)]}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-body">{dict.moduleBlurbs[m.id]}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function RoadmapPage() {
  const { dict } = await getDict()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.roadmap.title}</h1>
        <p className="leading-relaxed text-body">{dict.roadmap.intro}</p>
      </div>
      <ModuleList title={dict.roadmap.inDemo} modules={MODULES.filter((m) => m.scope === 'demo')} dict={dict} />
      <ModuleList title={dict.roadmap.later} modules={MODULES.filter((m) => m.scope === 'roadmap')} dict={dict} />
    </div>
  )
}
