'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { partsFor, type AnatomyPart } from '@/lib/body/anatomy'
import { regionAt, type RegionId } from '@/lib/body/regions'
import type { Spot } from '@/lib/body/spot'
import { cameraFor, viewCamera, VIEW_ANGLES, type CameraGoal, type ViewAngle } from '@/lib/body/views'

export type BodyLayers = { skeleton: boolean; organs: boolean }
export type BodyPick = { region: RegionId; part: AnatomyPart | null; spot: Spot | null }
/** Labels for the on-body buttons; when given, the buttons are shown. */
export type BodyControlLabels = Record<ViewAngle | 'zoomIn' | 'zoomOut' | 'reset' | 'up' | 'down', string>

const BASE = '/models/anatomy/'
/** Loaded in this order: bones first for the body shape, then organs, then the separately licensed kidneys. */
const FILES = ['skeleton-v1', 'organs-v1', 'kidneys-nc-v1']

const COLORS = {
  bone: 0xc4d3e6,
  organ: 0x8fb9ee,
  lymph: 0xc9dcf5,
  faded: 0xdde8f6,
  glow: 0x2580eb,
  marker: 0x0c2a5c,
  hover: 0x5aa2f0,
}

let partsCache: Promise<AnatomyPart[]> | null = null
/** The list of all bones and organs, fetched once per page. */
export function loadParts(): Promise<AnatomyPart[]> {
  partsCache ??= fetch(`${BASE}parts-v1.json`).then((r) => r.json() as Promise<AnatomyPart[]>)
  return partsCache
}

/** Thin linings around organs that patients would not recognise as a place that hurts. */
const THIN = new Set(['pleura', 'greater-omentum', 'lesser-omentum'])

type Entry = { mesh: THREE.Mesh; part: AnatomyPart; mat: THREE.MeshStandardMaterial }

function baseColor(p: AnatomyPart) {
  if (p.layer === 'skeleton') return COLORS.bone
  return p.group === 'Lymphoid system' ? COLORS.lymph : COLORS.organ
}

/**
 * The real-anatomy 3D body (Z-Anatomy, CC BY-SA). Drag to turn, tap a bone or organ to pick it;
 * `highlight` (an organ name such as "lungs", or one part id) lights it up as "may be involved".
 */
export function BodyViewer({
  highlight,
  layers,
  onPick,
  onLoaded,
  label,
  compact = false,
  loadingText = 'Loading 3D body…',
  failedText = '3D could not start on this device.',
  picker = false,
  focus = null,
  controlLabels,
}: {
  highlight: string | null
  layers: BodyLayers
  onPick?: (pick: BodyPick) => void
  onLoaded?: (info: { ms: number; bytes: number; parts: number }) => void
  label: string
  compact?: boolean
  loadingText?: string
  failedText?: string
  /** Choosing where it hurts: no spinning, organs win over the bones in front of them, hover shows the part. */
  picker?: boolean
  /** Fly the camera to an area; change `n` to fly again to the same area. */
  focus?: { region: RegionId; n: number } | null
  controlLabels?: BodyControlLabels
}) {
  const mount = useRef<HTMLDivElement>(null)
  const api = useRef<{
    setHighlight: (h: string | null) => void
    setLayers: (l: BodyLayers) => void
    fly: (g: CameraGoal, markAt?: [number, number, number]) => void
    view: (v: ViewAngle) => void
    zoom: (f: number) => void
    move: (dy: number) => void
  } | null>(null)
  const pickRef = useRef(onPick)
  const loadedRef = useRef(onLoaded)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pickRef.current = onPick
    loadedRef.current = onLoaded
  })

  useEffect(() => {
    const el = mount.current
    if (!el) return
    const started = performance.now()
    let disposed = false

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      queueMicrotask(() => setFailed(true))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50)
    camera.position.set(0, 0.15, compact ? 3.6 : 4.1)
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdbeafc, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(2, 3, 4)
    scene.add(sun)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.1, 0)
    // Two fingers (or right mouse button) slide the body up and down; the view stays on the body.
    controls.enablePan = true
    controls.screenSpacePanning = true
    controls.enableDamping = true
    controls.minDistance = 0.6
    controls.maxDistance = 6.5
    controls.minPolarAngle = Math.PI * 0.08
    controls.maxPolarAngle = Math.PI * 0.92
    controls.autoRotate = !picker
    controls.autoRotateSpeed = 1.2
    // The camera glides to a goal (area or view buttons); touching the body stops the glide.
    let goal: CameraGoal | null = null
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      goal = null
    })

    const root = new THREE.Group()
    scene.add(root)
    // The exact spot the finger touched: a glowing dot that shows through everything.
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 20, 14),
      new THREE.MeshBasicMaterial({ color: COLORS.glow, depthTest: false, transparent: true }),
    )
    marker.renderOrder = 20
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 20, 14),
      new THREE.MeshBasicMaterial({ color: COLORS.glow, depthTest: false, transparent: true, opacity: 0.25 }),
    )
    halo.renderOrder = 19
    marker.add(halo)
    marker.visible = false
    scene.add(marker)

    const entries: Entry[] = []
    let lit = new Set<string>()
    let currentHighlight: string | null = null
    let currentLayers: BodyLayers = { skeleton: true, organs: true }
    let parts: AnatomyPart[] = []
    let fitted: { scale: number; offset: THREE.Vector3 } | null = null

    const paint = () => {
      const any = lit.size > 0
      for (const e of entries) {
        const on = lit.has(e.part.id)
        const visible = on || currentLayers[e.part.layer]
        e.mesh.visible = visible
        const bone = e.part.layer === 'skeleton'
        e.mat.color.setHex(on ? COLORS.glow : any && !bone ? COLORS.faded : baseColor(e.part))
        e.mat.emissive.setHex(on ? COLORS.glow : 0x000000)
        const see = on || bone || any
        e.mat.transparent = see
        e.mat.opacity = on ? 1 : bone ? (currentLayers.organs ? 0.38 : 0.9) : any ? 0.4 : 1
        e.mat.depthWrite = !see || on
        e.mat.depthTest = !on
        e.mesh.renderOrder = on ? 10 : 0
        e.mat.needsUpdate = true
      }
    }
    const setHighlight = (h: string | null) => {
      currentHighlight = h
      lit = new Set(h ? partsFor(h, parts) : [])
      paint()
    }
    const setLayers = (l: BodyLayers) => {
      currentLayers = l
      paint()
    }
    const fly = (g: CameraGoal, markAt?: [number, number, number]) => {
      controls.autoRotate = false
      goal = g
      if (markAt) {
        marker.position.set(...markAt)
        marker.visible = true
      }
    }
    const move = (dy: number) => {
      const t = controls.target
      const y = THREE.MathUtils.clamp(t.y + dy, -0.95, 0.95) - t.y
      fly({ position: [camera.position.x, camera.position.y + y, camera.position.z], target: [t.x, t.y + y, t.z] })
    }
    const view = (v: ViewAngle) => fly(viewCamera(v, compact ? 3.6 : 4.1))
    const zoom = (f: number) => {
      const dir = camera.position.clone().sub(controls.target)
      const d = THREE.MathUtils.clamp(dir.length() * f, controls.minDistance, controls.maxDistance)
      const pos = controls.target.clone().add(dir.setLength(d))
      fly({ position: [pos.x, pos.y, pos.z], target: [controls.target.x, controls.target.y, controls.target.z] })
    }
    api.current = { setHighlight, setLayers, fly, view, zoom, move }

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    let bytes = 0
    ;(async () => {
      try {
        parts = await loadParts()
        const byId = new Map(parts.map((p) => [p.id, p]))
        for (const file of FILES) {
          const res = await fetch(`${BASE}${file}.glb`)
          if (!res.ok) throw new Error('model')
          const buf = await res.arrayBuffer()
          bytes += buf.byteLength
          const gltf = await loader.parseAsync(buf, BASE)
          if (disposed) return
          const model = gltf.scene
          // The skeleton sets the size and position; the other files share its coordinates.
          if (!fitted) {
            const box = new THREE.Box3().setFromObject(model)
            const scale = 2 / box.getSize(new THREE.Vector3()).y
            const c = box.getCenter(new THREE.Vector3())
            fitted = { scale, offset: new THREE.Vector3(-c.x * scale, -box.min.y * scale - 1, -c.z * scale) }
          }
          model.scale.setScalar(fitted.scale)
          model.position.copy(fitted.offset)
          model.traverse((o) => {
            const mesh = o as THREE.Mesh
            if (!mesh.isMesh) return
            let name = ''
            for (let n: THREE.Object3D | null = mesh; n && !name; n = n.parent) name = byId.has(n.name) ? n.name : ''
            const part = byId.get(name)
            if (!part) return
            const mat = new THREE.MeshStandardMaterial({ color: baseColor(part), roughness: 0.65, metalness: 0 })
            mesh.material = mat
            entries.push({ mesh, part, mat })
          })
          root.add(model)
          setHighlight(currentHighlight)
          if (file === FILES[0]) setLoading(false)
        }
        loadedRef.current?.({ ms: Math.round(performance.now() - started), bytes, parts: entries.length })
      } catch {
        if (!disposed) setFailed(true)
      }
    })()

    // Tap (not drag) to pick a part.
    const ray = new THREE.Raycaster()
    const boxes = new Map<Entry, THREE.Box3>()
    const entryOf = (o: THREE.Object3D) => entries.find((x) => x.mesh === o)
    /** What is under the pointer. When choosing, an organ just behind a bone (lungs behind ribs) wins. */
    const hitAt = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      // When choosing, thin linings (pleura, omentum) are skipped so the tap lands on the organ inside.
      const hits = ray
        .intersectObjects(root.children, true)
        .filter((h) => h.object.visible && !(picker && THIN.has(entryOf(h.object)?.part.id ?? '')))
      const first = hits[0]
      if (!first || !picker) return first
      if (entryOf(first.object)?.part.layer !== 'skeleton') return first
      const organ = hits.find((h) => {
        const p = entryOf(h.object)?.part
        return p && p.layer !== 'skeleton' && !THIN.has(p.id) && p.group !== 'Lymphoid system' && h.distance - first.distance < 0.3
      })
      return organ ?? first
    }
    // On a computer, the part under the mouse is tinted before clicking.
    let hovered: Entry | null = null
    const onMove = (e: PointerEvent) => {
      if (!picker || e.pointerType !== 'mouse' || e.buttons) return
      const h = hitAt(e)
      const next = h ? (entryOf(h.object) ?? null) : null
      if (next === hovered) return
      if (hovered) paint()
      hovered = next
      renderer.domElement.style.cursor = next ? 'pointer' : 'grab'
      if (next && !lit.has(next.part.id)) {
        next.mat.color.setHex(COLORS.hover)
        next.mat.needsUpdate = true
      }
    }
    renderer.domElement.addEventListener('pointermove', onMove)
    let down: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      // A finger moves a little while tapping, so up to 12 px still counts as a tap.
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return
      const hit = hitAt(e)
      if (!hit) return
      marker.position.copy(hit.point)
      marker.visible = true
      const local = root.worldToLocal(hit.point.clone())
      const entry = entries.find((x) => x.mesh === hit.object)
      let spot: Spot | null = null
      if (entry) {
        let box = boxes.get(entry)
        if (!box) {
          box = new THREE.Box3().setFromObject(entry.mesh)
          boxes.set(entry, box)
        }
        const size = box.getSize(new THREE.Vector3())
        const c = box.getCenter(new THREE.Vector3())
        const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
        spot = {
          u: clamp((hit.point.x - c.x) / Math.max(1e-6, size.x / 2), -1, 1),
          v: clamp((hit.point.y - box.min.y) / Math.max(1e-6, size.y), 0, 1),
          w: clamp((hit.point.z - box.min.z) / Math.max(1e-6, size.z), 0, 1),
        }
      }
      const region = regionAt({ y: (local.y + 1) / 2, x: local.x / 0.4, front: local.z >= 0 })
      pickRef.current?.({ region, part: entry?.part ?? null, spot })
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let frame = 0
    const clock = new THREE.Clock()
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const pulse = 0.75 + 0.25 * Math.sin(clock.getElapsedTime() * 4)
      for (const e of entries) if (lit.has(e.part.id)) e.mat.emissiveIntensity = pulse
      if (marker.visible) halo.scale.setScalar(0.8 + 0.5 * pulse)
      if (goal) {
        const p = new THREE.Vector3(...goal.position)
        const t = new THREE.Vector3(...goal.target)
        camera.position.lerp(p, 0.12)
        controls.target.lerp(t, 0.12)
        if (camera.position.distanceTo(p) < 0.005 && controls.target.distanceTo(t) < 0.005) goal = null
      }
      // Sliding can never lose the body.
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -0.5, 0.5)
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, -1, 1)
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -0.3, 0.3)
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointermove', onMove)
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry.dispose()
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m) => m.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
      api.current = null
    }
  }, [compact, picker])

  useEffect(() => {
    api.current?.setHighlight(highlight)
  }, [highlight])
  useEffect(() => {
    api.current?.setLayers(layers)
  }, [layers])
  useEffect(() => {
    if (!focus) return
    const g = cameraFor(focus.region)
    api.current?.fly(g, g.target)
  }, [focus])

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full" role="img" aria-label={label} />
      {controlLabels && !failed ? (
        <div className="absolute top-2 right-2 left-2 flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {VIEW_ANGLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => api.current?.view(v)}
                className="min-h-9 rounded-full border border-line bg-surface/90 px-3 text-xs font-semibold text-ink shadow-sm hover:bg-soft"
              >
                {controlLabels[v]}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(
              [
                ['up', '↑', 0],
                ['down', '↓', 0],
                ['zoomIn', '+', 0.7],
                ['zoomOut', '−', 1.4],
              ] as const
            ).map(([k, sign, f]) => (
              <button
                key={k}
                type="button"
                onClick={() => (k === 'up' ? api.current?.move(0.25) : k === 'down' ? api.current?.move(-0.25) : api.current?.zoom(f))}
                aria-label={controlLabels[k]}
                title={controlLabels[k]}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/90 text-lg font-bold text-ink shadow-sm hover:bg-soft"
              >
                {sign}
              </button>
            ))}
            <button
              type="button"
              onClick={() => api.current?.view('front')}
              className="min-h-9 rounded-full border border-line bg-surface/90 px-3 text-xs font-semibold text-ink shadow-sm hover:bg-soft"
            >
              {controlLabels.reset}
            </button>
          </div>
        </div>
      ) : null}
      {loading && !failed ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">{loadingText}</p>
      ) : null}
      {failed ? <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-warn">{failedText}</p> : null}
    </div>
  )
}
