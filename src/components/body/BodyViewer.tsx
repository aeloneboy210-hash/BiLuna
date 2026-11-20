'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { partsFor, type AnatomyPart } from '@/lib/body/anatomy'
import { regionAt, type RegionId } from '@/lib/body/regions'

export type BodyLayers = { skeleton: boolean; organs: boolean }
export type BodyPick = { region: RegionId; part: AnatomyPart | null }

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
}

let partsCache: Promise<AnatomyPart[]> | null = null
/** The list of all bones and organs, fetched once per page. */
export function loadParts(): Promise<AnatomyPart[]> {
  partsCache ??= fetch(`${BASE}parts-v1.json`).then((r) => r.json() as Promise<AnatomyPart[]>)
  return partsCache
}

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
}: {
  highlight: string | null
  layers: BodyLayers
  onPick?: (pick: BodyPick) => void
  onLoaded?: (info: { ms: number; bytes: number; parts: number }) => void
  label: string
  compact?: boolean
  loadingText?: string
  failedText?: string
}) {
  const mount = useRef<HTMLDivElement>(null)
  const api = useRef<{ setHighlight: (h: string | null) => void; setLayers: (l: BodyLayers) => void } | null>(null)
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
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 0.6
    controls.maxDistance = 6.5
    controls.minPolarAngle = Math.PI * 0.25
    controls.maxPolarAngle = Math.PI * 0.75
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2
    controls.addEventListener('start', () => (controls.autoRotate = false))

    const root = new THREE.Group()
    scene.add(root)
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.marker }))
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
    api.current = { setHighlight, setLayers }

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
    let down: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const rect = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(root.children, true).find((h) => h.object.visible)
      if (!hit) return
      marker.position.copy(hit.point)
      marker.visible = true
      const local = root.worldToLocal(hit.point.clone())
      const entry = entries.find((x) => x.mesh === hit.object)
      const region = regionAt({ y: (local.y + 1) / 2, x: local.x / 0.4, front: local.z >= 0 })
      pickRef.current?.({ region, part: entry?.part ?? null })
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
  }, [compact])

  useEffect(() => {
    api.current?.setHighlight(highlight)
  }, [highlight])
  useEffect(() => {
    api.current?.setLayers(layers)
  }, [layers])

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full" role="img" aria-label={label} />
      {loading && !failed ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">{loadingText}</p>
      ) : null}
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-warn">{failedText}</p>
      ) : null}
    </div>
  )
}
