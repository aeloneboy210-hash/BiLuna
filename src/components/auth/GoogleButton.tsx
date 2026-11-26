import { signInWithGoogle } from '@/app/(site)/sign-in/actions'
import { buttonClass } from '@/components/ui/Button'

/** Sign in or sign up with Google, one tap. Works without JavaScript (a plain form). */
export function GoogleButton({ label }: { label: string }) {
  return (
    <form action={signInWithGoogle} data-page-loader="">
      <button type="submit" className={buttonClass('secondary', 'w-full')}>
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-sm font-bold text-ink">
          G
        </span>
        {label}
      </button>
    </form>
  )
}
