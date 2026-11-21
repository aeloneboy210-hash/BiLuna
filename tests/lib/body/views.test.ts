import { cameraFor, REGION_FOCUS, VIEW_ANGLES, viewCamera } from '@/lib/body/views'
import { regionAt, type RegionId } from '@/lib/body/regions'

test('every area has a focus point that maps back to the same area', () => {
  for (const [id, f] of Object.entries(REGION_FOCUS) as [RegionId, (typeof REGION_FOCUS)[RegionId]][]) {
    expect(regionAt({ y: f.y, x: f.x, front: f.front })).toBe(id)
  }
})

test('the camera looks at the area from its side, close enough to fill the view', () => {
  const chest = cameraFor('chest')
  expect(chest.target[1]).toBeCloseTo(REGION_FOCUS.chest.y * 2 - 1)
  expect(chest.position[2]).toBeGreaterThan(chest.target[2])
  const back = cameraFor('lowerBack')
  expect(back.position[2]).toBeLessThan(back.target[2])
  const head = cameraFor('head')
  expect(head.position[2] - head.target[2]).toBeLessThan(2)
})

test('the four views put the camera in front, behind and at each side', () => {
  expect(VIEW_ANGLES).toEqual(['front', 'back', 'left', 'right'])
  expect(viewCamera('front', 4).position[2]).toBeCloseTo(4)
  expect(viewCamera('back', 4).position[2]).toBeCloseTo(-4)
  // The patient's left is +x (as seen from the front).
  expect(viewCamera('left', 4).position[0]).toBeCloseTo(4)
  expect(viewCamera('right', 4).position[0]).toBeCloseTo(-4)
})
