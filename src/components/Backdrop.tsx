import Image from 'next/image'

/**
 * The page background from the brand board: hexagon grid, two soft glows and the glowing DNA strands
 * (cut from the owner's brand board image). Purely decorative and fixed behind everything.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="hex-grid absolute inset-0" />
      <div className="absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-cyan/10 blur-3xl" />
      <Image
        src="/brand/dna-left-v2.webp"
        alt=""
        width={250}
        height={470}
        className="brand-art absolute top-24 -left-16 h-[70vh] w-auto opacity-50 sm:-left-6 lg:opacity-80"
      />
      <Image
        src="/brand/dna-right-v2.webp"
        alt=""
        width={236}
        height={480}
        className="brand-art absolute top-10 -right-16 h-[78vh] w-auto opacity-50 sm:-right-6 lg:opacity-80"
      />
    </div>
  )
}
