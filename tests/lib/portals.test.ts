import { PORTALS } from '@/lib/portals'

test('three portals with exact names and homes', () => {
  expect(PORTALS).toEqual({
    patient: { name: 'Patient Portal', home: '/patient' },
    doctor: { name: 'Healthcare Professional Portal', home: '/doctor' },
    org_admin: { name: 'Hospitals & Organizations Portal', home: '/org' },
  })
})
