import { BODY_PARTS, regionAt } from '@/lib/body/regions'

// regionAt takes a tap on the body in normalised coordinates:
// y from 0 (feet) to 1 (top of head); x from -1 (patient's right) to 1 (patient's left); front = facing the viewer.
test.each([
  [0.95, 0, true, 'head'],
  [0.86, 0, true, 'neck'],
  [0.74, 0.2, true, 'chest'],
  [0.74, 0.2, false, 'upperBack'],
  [0.63, 0, true, 'upperAbdomen'],
  [0.55, 0, true, 'lowerAbdomen'],
  [0.55, 0, false, 'lowerBack'],
  [0.68, 0.85, true, 'leftArm'],
  [0.68, -0.85, true, 'rightArm'],
  [0.3, 0.3, true, 'leftLeg'],
  [0.3, -0.3, false, 'rightLeg'],
] as const)('y=%s x=%s front=%s is %s', (y, x, front, region) => {
  expect(regionAt({ y, x, front })).toBe(region)
})

test('every part and region has English and Bangla names', () => {
  for (const p of Object.values(BODY_PARTS)) {
    expect(p.en.length).toBeGreaterThan(2)
    expect(p.bn).toMatch(/[ঀ-৿]/)
  }
})
