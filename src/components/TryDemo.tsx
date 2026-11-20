import { startDemo } from '@/app/(site)/sign-in/actions'
import { buttonClass } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { ROLES, type Role } from '@/lib/portals'
import { ROLE_ICONS } from '@/lib/ui/module-icons'

/** A one-tap button that opens a portal with its shared demo account. Works without JavaScript. */
export function TryDemoButton({
  role,
  dict,
  variant = 'primary',
  className = '',
}: {
  role: Role
  dict: Dictionary
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  return (
    <form action={startDemo} data-page-loader="">
      <input type="hidden" name="role" value={role} />
      <button type="submit" className={buttonClass(variant, className)}>
        <Icon name={ROLE_ICONS[role]} className="h-5 w-5" />
        {dict.signIn.try[role]}
      </button>
    </form>
  )
}

/** All three "Try as…" buttons. */
export function TryDemoButtons({ dict }: { dict: Dictionary }) {
  return (
    <div className="flex flex-col gap-2">
      {ROLES.map((role, i) => (
        <TryDemoButton key={role} role={role} dict={dict} variant={i === 0 ? 'primary' : 'secondary'} className="w-full" />
      ))}
    </div>
  )
}
