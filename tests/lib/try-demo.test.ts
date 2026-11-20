import { tryDemo } from '@/lib/auth/try-demo'

function deps(password: string | undefined, ok = true) {
  const calls: { email: string; password: string }[] = []
  return {
    calls,
    d: {
      password,
      signIn: async (email: string, pw: string) => {
        calls.push({ email, password: pw })
        return ok
      },
    },
  }
}

test('each role signs in to its own demo account and goes to its portal', async () => {
  for (const [role, email, home] of [
    ['patient', 'patient@biluna.demo', '/patient'],
    ['doctor', 'doctor@biluna.demo', '/doctor'],
    ['org_admin', 'hospital@biluna.demo', '/org'],
  ] as const) {
    const { calls, d } = deps('secret-pass')
    expect(await tryDemo(role, d)).toEqual({ ok: true, home })
    expect(calls).toEqual([{ email, password: 'secret-pass' }])
  }
})

test('an unknown role never signs in', async () => {
  const { calls, d } = deps('secret-pass')
  expect(await tryDemo('admin', d)).toEqual({ ok: false, reason: 'failed' })
  expect(calls).toHaveLength(0)
})

test('without the server password the buttons are not ready', async () => {
  const { calls, d } = deps(undefined)
  expect(await tryDemo('patient', d)).toEqual({ ok: false, reason: 'notReady' })
  expect(calls).toHaveLength(0)
})

test('a refused sign-in is failed', async () => {
  const { d } = deps('wrong', false)
  expect(await tryDemo('patient', d)).toEqual({ ok: false, reason: 'failed' })
})
