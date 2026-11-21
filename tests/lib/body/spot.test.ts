import { spotName, type Spot } from '@/lib/body/spot'
import type { AnatomyPart } from '@/lib/body/anatomy'

const part = (name: string, layer: AnatomyPart['layer'] = 'organs', group = 'Digestive system'): AnatomyPart => ({
  id: name.toLowerCase(),
  name,
  side: null,
  group,
  layer,
  file: 'organs-v1',
})
const cerebrum = part('Cerebrum', 'organs', 'Brain')
// u: -1 patient's right … 1 patient's left; v: 0 bottom … 1 top; w: 0 back … 1 front
const at = (u: number, v: number, w: number): Spot => ({ u, v, w })

test('the cerebrum names its lobe and side', () => {
  expect(spotName(cerebrum, at(0.5, 0.6, 0.85), 'en')).toBe('left frontal lobe')
  expect(spotName(cerebrum, at(-0.5, 0.8, 0.5), 'en')).toBe('right parietal lobe')
  expect(spotName(cerebrum, at(0.6, 0.3, 0.5), 'en')).toBe('left temporal lobe')
  expect(spotName(cerebrum, at(-0.2, 0.5, 0.1), 'en')).toBe('right occipital lobe')
  expect(spotName(cerebrum, at(0.5, 0.6, 0.85), 'bn')).toBe('বাম ফ্রন্টাল লোব (সম্মুখ অংশ)')
})

test('the cerebellum names its half', () => {
  expect(spotName(part('Cerebellum', 'organs', 'Brain'), at(0.4, 0.5, 0.5), 'en')).toBe('left half')
})

test('other parts name the area of the part', () => {
  expect(spotName(part('Liver'), at(-0.6, 0.8, 0.5), 'en')).toBe('upper right part')
  expect(spotName(part('Liver'), at(0, 0.5, 0.5), 'en')).toBe('middle part')
  expect(spotName(part('Femur', 'skeleton'), at(0, 0.1, 0.5), 'en')).toBe('lower part')
  expect(spotName(part('Liver'), at(0.6, 0.2, 0.5), 'bn')).toBe('নিচের বাম অংশ')
})
