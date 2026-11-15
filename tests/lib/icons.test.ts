import { ICONS, type IconName } from '@/lib/ui/icons'
import { MODULE_ICONS, ROLE_ICONS } from '@/lib/ui/module-icons'
import { MODULES } from '@/lib/modules'
import { ROLES } from '@/lib/portals'

test('every module has an icon that exists', () => {
  for (const m of MODULES) expect(ICONS[MODULE_ICONS[m.id]], m.id).toBeDefined()
})

test('every portal has an icon that exists', () => {
  for (const role of ROLES) expect(ICONS[ROLE_ICONS[role]], role).toBeDefined()
})

test('modules do not share an icon', () => {
  const used = MODULES.map((m) => MODULE_ICONS[m.id])
  expect(new Set(used).size).toBe(used.length)
})

test('every icon is drawn with at least one shape', () => {
  for (const [name, shapes] of Object.entries(ICONS) as [IconName, readonly unknown[]][]) {
    expect(shapes.length, name).toBeGreaterThan(0)
  }
})
