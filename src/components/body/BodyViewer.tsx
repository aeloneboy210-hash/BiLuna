'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { regionAt, type OrganId, type PartId, type RegionId } from '@/lib/body/regions'

export type BodyVariant = 'stylized' | 'anatomy'
export type BodyPick = { region: RegionId; organ: OrganId | null }

const COLORS = {
  skin: 0xdbeafc,
  skeleton: 0xb8c9de,
  organ: 0x9cc2f2,
  /** Other organs fade to this while one is lit, so the lit one stands out. */
  faded: 0xdde8f6,
  glow: 0x2580eb,
  marker: 0x0c2a5c,
}

const ANATOMY_URL = '/models/anatomy-v1.glb'

/** Where each tappable area sits on the stylized body, for lighting up a whole area. */
const REGION_SPOTS: Record<RegionId, [number, number, number, number]> = {
  head: [0, 0.87, 0.06, 0.13],
  neck: [0, 0.71, 0.04, 0.07],
  chest: [0, 0.48, 0.1, 0.16],
  upperBack: [0, 0.48, -0.1, 0.16],
  upperAbdomen: [0, 0.27, 0.09, 0.12],
  lowerAbdomen: [0, 0.08, 0.09, 0.12],
  lowerBack: [0, 0.15, -0.09, 0.13],
  leftArm: [0.3, 0.3, 0, 0.1],
  rightArm: [-0.3, 0.3, 0, 0.1],
  leftLeg: [0.09, -0.5, 0, 0.12],
  rightLeg: [-0.09, -0.5, 0, 0.12],
}

function material(color: number, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  })
}

/** BiLuna's own body, built from simple shapes: light skin and blue organs. Height 2, feet at y = -1. */
function buildStylized(): THREE.Group {
  const g = new THREE.Group()
  const skin = material(COLORS.skin, 0.38)
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], scale?: [number, number, number], name?: string, rotZ = 0) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(...pos)
    if (scale) m.scale.set(...scale)
    m.rotation.z = rotZ
    if (name) m.name = name
    g.add(m)
    return m
  }
  // Skin
  add(new THREE.SphereGeometry(0.11, 32, 24), skin, [0, 0.87, 0], [1, 1.12, 1.05], 'skin')
  add(new THREE.CylinderGeometry(0.048, 0.055, 0.14, 24), skin, [0, 0.72, 0], undefined, 'skin')
  const torso = new THREE.LatheGeometry(
    [
      [0.001, -0.04], [0.16, -0.04], [0.175, 0.04], [0.155, 0.2], [0.17, 0.34], [0.2, 0.5], [0.215, 0.6], [0.16, 0.66], [0.001, 0.67],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    40,
  )
  add(torso, skin, [0, 0, 0], [1, 1, 0.62], 'skin')
  for (const s of [1, -1]) {
    add(new THREE.CapsuleGeometry(0.042, 0.56, 8, 16), skin, [s * 0.27, 0.32, 0], undefined, 'skin', s * 0.12)
    add(new THREE.CapsuleGeometry(0.066, 0.86, 8, 16), skin, [s * 0.09, -0.5, 0], undefined, 'skin')
  }
  // Organs (positions are approximate, for orientation only)
  const organ = () => material(COLORS.organ)
  add(new THREE.SphereGeometry(1, 32, 24), organ(), [0, 0.89, 0], [0.085, 0.065, 0.095], 'brain')
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.18, 12), organ(), [0, 0.64, 0.01], undefined, 'trachea')
  const lungs = new THREE.Group()
  lungs.name = 'lungs'
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), organ())
    l.position.set(s * 0.085, 0.46, 0)
    l.scale.set(0.072, 0.13, 0.068)
    l.name = 'lungs'
    lungs.add(l)
  }
  g.add(lungs)
  add(new THREE.SphereGeometry(1, 24, 18), organ(), [0.03, 0.42, 0.04], [0.048, 0.055, 0.042], 'heart')
  add(new THREE.SphereGeometry(1, 24, 18), organ(), [-0.055, 0.29, 0.02], [0.105, 0.05, 0.07], 'liver')
  add(new THREE.SphereGeometry(1, 24, 18), organ(), [0.07, 0.28, 0.03], [0.06, 0.042, 0.04], 'stomach')
  add(new THREE.CapsuleGeometry(0.016, 0.1, 6, 12), organ(), [0.02, 0.225, 0], undefined, 'pancreas', Math.PI / 2.2)
  add(new THREE.SphereGeometry(1, 16, 12), organ(), [0.13, 0.29, -0.03], [0.03, 0.045, 0.025], 'spleen')
  add(new THREE.SphereGeometry(1, 16, 12), organ(), [-0.06, 0.24, 0.05], [0.018, 0.025, 0.018], 'gallbladder')
  const kidneys = new THREE.Group()
  kidneys.name = 'kidneys'
  for (const s of [1, -1]) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), organ())
    k.position.set(s * 0.08, 0.21, -0.055)
    k.scale.set(0.025, 0.045, 0.022)
    k.name = 'kidneys'
    kidneys.add(k)
  }
  g.add(kidneys)
  add(new THREE.TorusGeometry(0.075, 0.032, 12, 32), organ(), [0, 0.09, 0.02], [1, 0.8, 0.6], 'intestines')
  add(new THREE.SphereGeometry(0.034, 16, 12), organ(), [0, -0.01, 0.03], undefined, 'bladder')
  return g
}

/** Fits a loaded model to height 2 with the feet at y = -1, facing the viewer. */
function fit(model: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const scale = 2 / size.y
  model.scale.setScalar(scale)
  const box2 = new THREE.Box3().setFromObject(model)
  const center = box2.getCenter(new THREE.Vector3())
  model.position.x -= center.x
  model.position.z -= center.z
  model.position.y -= box2.min.y + 1
}

function partOf(obj: THREE.Object3D | null): string | null {
  for (let o = obj; o; o = o.parent) if (o.name) return o.name
  return null
}

const ORGAN_IDS: OrganId[] = ['brain', 'trachea', 'lungs', 'heart', 'liver', 'stomach', 'intestines', 'pancreas', 'spleen', 'gallbladder', 'bladder', 'kidneys']

/**
 * A rotatable 3D body. Drag to turn it, tap to pick a spot; `highlight` lights up an organ or an area
 * ("may be involved"). Both variants report taps with the same area and organ names.
 */
export function BodyViewer({
  variant,
  highlight,
  onPick,
  onLoaded,
  label,
}: {
  variant: BodyVariant
  highlight: PartId | null
  onPick?: (pick: BodyPick) => void
  onLoaded?: (info: { ms: number; bytes: number }) => void
  label: string
}) {
  const mount = useRef<HTMLDivElement>(null)
  const state = useRef<{ setHighlight: (p: PartId | null) => void } | null>(null)
  const pickRef = useRef(onPick)
  const loadedRef = useRef(onLoaded)
  const [failed, setFailed] = useState(false)

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
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 0.15, 4.1)
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdbeafc, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(2, 3, 4)
    scene.add(sun)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.1, 0)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 1.4
    controls.maxDistance = 6.5
    controls.minPolarAngle = Math.PI * 0.3
    controls.maxPolarAngle = Math.PI * 0.7
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.2
    controls.addEventListener('start', () => (controls.autoRotate = false))

    const root = new THREE.Group()
    scene.add(root)
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.marker }))
    marker.visible = false
    scene.add(marker)
    const areaGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: COLORS.glow, transparent: true, opacity: 0.22, depthWrite: false }),
    )
    areaGlow.visible = false
    root.add(areaGlow)

    const organMeshes = new Map<string, THREE.Mesh[]>()
    let current: PartId | null = null
    const setHighlight = (p: PartId | null) => {
      current = p
      const organLit = p !== null && organMeshes.has(p)
      for (const [name, meshes] of organMeshes) {
        for (const m of meshes) {
          const mat = m.material as THREE.MeshStandardMaterial
          const on = name === p
          if (name === 'skeleton') continue
          mat.color.setHex(on ? COLORS.glow : organLit ? COLORS.faded : COLORS.organ)
          mat.emissive.setHex(on ? COLORS.glow : 0x000000)
          // The lit organ joins the see-through pass so its high render order puts it on top of the bones.
          mat.transparent = organLit
          mat.opacity = organLit && !on ? 0.45 : 1
          mat.depthWrite = !(organLit && !on)
          // Draw the lit organ last so it shows through the ribs and other organs.
          m.renderOrder = on ? 10 : 0
          mat.depthTest = !on
          mat.needsUpdate = true
        }
      }
      const isRegion = p !== null && !ORGAN_IDS.includes(p as OrganId)
      areaGlow.visible = isRegion
      if (isRegion) {
        const [x, y, z, r] = REGION_SPOTS[p as RegionId]
        areaGlow.position.set(x, y, z)
        areaGlow.scale.setScalar(r)
      }
    }
    state.current = { setHighlight }

    const register = (model: THREE.Object3D) => {
      model.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        const name = partOf(mesh)
        if (!name || name === 'skin') return
        if (!organMeshes.has(name)) organMeshes.set(name, [])
        organMeshes.get(name)!.push(mesh)
      })
      root.add(model)
      setHighlight(current)
    }

    if (variant === 'stylized') {
      register(buildStylized())
      loadedRef.current?.({ ms: Math.round(performance.now() - started), bytes: 0 })
    } else {
      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      fetch(ANATOMY_URL)
        .then((r) => {
          if (!r.ok) throw new Error('model')
          return r.arrayBuffer()
        })
        .then((buf) => loader.parseAsync(buf, '/models/').then((gltf) => ({ gltf, bytes: buf.byteLength })))
        .then(({ gltf, bytes }) => {
          if (disposed) return
          const model = gltf.scene
          model.traverse((o) => {
            const mesh = o as THREE.Mesh
            if (!mesh.isMesh) return
            const name = partOf(mesh)
            mesh.material = name === 'skeleton' ? material(COLORS.skeleton, 0.38) : material(COLORS.organ)
          })
          fit(model)
          register(model)
          loadedRef.current?.({ ms: Math.round(performance.now() - started), bytes })
        })
        .catch(() => !disposed && setFailed(true))
    }

    // Tap (not drag) to pick a spot.
    const ray = new THREE.Raycaster()
    let down: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const rect = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(root.children, true).find((h) => h.object !== areaGlow)
      if (!hit) return
      marker.position.copy(hit.point)
      marker.visible = true
      const local = root.worldToLocal(hit.point.clone())
      const name = partOf(hit.object)
      const organ = name && ORGAN_IDS.includes(name as OrganId) ? (name as OrganId) : null
      const region = regionAt({ y: (local.y + 1) / 2, x: local.x / 0.4, front: local.z >= 0 })
      pickRef.current?.({ region, organ })
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let frame = 0
    const clock = new THREE.Clock()
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      // A gentle pulse on whatever is lit up.
      const pulse = 0.75 + 0.25 * Math.sin(t * 4)
      for (const [name, meshes] of organMeshes) {
        if (name !== current) continue
        for (const m of meshes) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse
      }
      ;(areaGlow.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.12 * Math.sin(t * 4)
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
      state.current = null
    }
  }, [variant])

  useEffect(() => {
    state.current?.setHighlight(highlight)
  }, [highlight, variant])

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full" role="img" aria-label={label} />
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-warn">
          3D could not start on this device.
        </p>
      ) : null}
    </div>
  )
}
