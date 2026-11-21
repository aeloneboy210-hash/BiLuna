import type { RegionId } from './regions'

type Vec = [number, number, number]
export type CameraGoal = { position: Vec; target: Vec }

/**
 * Where each area is on the body (y: 0 feet to 1 top of head; x: -1 patient's right to 1 patient's left),
 * which side to look from, and how close. Used by the area buttons to fly the camera there.
 */
export const REGION_FOCUS: Record<RegionId, { y: number; x: number; front: boolean; distance: number }> = {
  head: { y: 0.94, x: 0, front: true, distance: 1.1 },
  neck: { y: 0.85, x: 0, front: true, distance: 1.1 },
  chest: { y: 0.75, x: 0, front: true, distance: 1.5 },
  upperBack: { y: 0.75, x: 0, front: false, distance: 1.5 },
  upperAbdomen: { y: 0.63, x: 0, front: true, distance: 1.4 },
  lowerAbdomen: { y: 0.53, x: 0, front: true, distance: 1.4 },
  lowerBack: { y: 0.58, x: 0, front: false, distance: 1.4 },
  leftArm: { y: 0.62, x: 0.75, front: true, distance: 1.9 },
  rightArm: { y: 0.62, x: -0.75, front: true, distance: 1.9 },
  leftLeg: { y: 0.25, x: 0.3, front: true, distance: 2.2 },
  rightLeg: { y: 0.25, x: -0.3, front: true, distance: 2.2 },
}

/** The body is 2 units tall, feet at y = -1; x spans about ±0.4. */
export function focusPoint(region: RegionId): Vec {
  const f = REGION_FOCUS[region]
  return [f.x * 0.4, f.y * 2 - 1, 0]
}

export function cameraFor(region: RegionId): CameraGoal {
  const f = REGION_FOCUS[region]
  const target = focusPoint(region)
  return { target, position: [target[0], target[1] + 0.05, f.front ? f.distance : -f.distance] }
}

export const VIEW_ANGLES = ['front', 'back', 'left', 'right'] as const
export type ViewAngle = (typeof VIEW_ANGLES)[number]

/** The whole body from one side, at the given distance. */
export function viewCamera(view: ViewAngle, distance: number): CameraGoal {
  const target: Vec = [0, 0.1, 0]
  const y = 0.15
  const position: Vec =
    view === 'front' ? [0, y, distance] : view === 'back' ? [0, y, -distance] : view === 'left' ? [distance, y, 0] : [-distance, y, 0]
  return { position, target }
}
