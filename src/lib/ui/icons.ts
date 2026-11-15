/**
 * Line icons drawn on a 24 x 24 grid, in the outline style of the BiLuna brand board.
 * Each icon is a list of shapes so it can be rendered without any icon library.
 */
export type IconShape =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number }

const p = (d: string): IconShape => ({ kind: 'path', d })
const c = (cx: number, cy: number, r: number): IconShape => ({ kind: 'circle', cx, cy, r })
const r = (x: number, y: number, width: number, height: number, rx: number): IconShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
})

export const ICONS = {
  heart: [
    p('M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 3.2c0 5.5-7.5 10.1-7.5 10.1Z'),
    p('M7 12.5h2.5l1.5-2.5 2.5 5 1.5-2.5H17'),
  ],
  brain: [
    p('M12 5.5a3 3 0 0 0-5.6-1.4A3.2 3.2 0 0 0 4 9a3.3 3.3 0 0 0 .6 6A3.3 3.3 0 0 0 9 19.6a3 3 0 0 0 3-1.6Z'),
    p('M12 5.5a3 3 0 0 1 5.6-1.4A3.2 3.2 0 0 1 20 9a3.3 3.3 0 0 1-.6 6 3.3 3.3 0 0 1-4.4 4.6 3 3 0 0 1-3-1.6Z'),
    p('M12 5.5V18'),
    p('M8.5 9.5c1 0 1.5.8 1.5 1.8M15.5 9.5c-1 0-1.5.8-1.5 1.8M8 14.5h1.5M16 14.5h-1.5'),
  ],
  pill: [p('M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7Z'), p('m7 10 7 7')],
  mapPin: [p('M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11Z'), c(12, 10, 2.5)],
  leaf: [p('M5 19c0-8.5 5.5-14 15-14 0 9.5-5.5 15-14 15Z'), p('M5 19c3-4 5.5-6.5 9-9')],
  book: [
    p('M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2Z'),
    p('M12 6.5v13'),
  ],
  briefcase: [r(3, 7.5, 18, 12.5, 2), p('M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5'), p('M3 13h18')],
  coins: [
    p('M4 7c0-1.4 2.7-2.5 6-2.5s6 1.1 6 2.5-2.7 2.5-6 2.5S4 8.4 4 7Z'),
    p('M4 7v4.5c0 1.4 2.7 2.5 6 2.5M16 7v3'),
    p('M8 15.5c0-1.4 2.7-2.5 6-2.5s6 1.1 6 2.5-2.7 2.5-6 2.5-6-1.1-6-2.5Z'),
    p('M8 15.5V17c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-1.5'),
  ],
  dna: [
    p('M8 3c0 4.5 8 4.5 8 9s-8 4.5-8 9'),
    p('M16 3c0 4.5-8 4.5-8 9s8 4.5 8 9'),
    p('M9 5.5h6M10 9.5h4M10 14.5h4M9 18.5h6'),
  ],
  users: [c(9, 8, 3), p('M3.5 19a5.5 5.5 0 0 1 11 0'), c(16.5, 9, 2.5), p('M15.8 14.1A4.5 4.5 0 0 1 21 18.5')],
  user: [c(12, 8, 4), p('M4.5 20.5a7.5 7.5 0 0 1 15 0')],
  stethoscope: [
    p('M6 3.5H5v5a4 4 0 0 0 8 0v-5h-1'),
    p('M9 12.5v2a5 5 0 0 0 10 0v-1.5'),
    c(19, 11, 2),
  ],
  hospital: [
    p('M4 21V6.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 6.5V21'),
    p('M2.5 21h19'),
    p('M12 8v5M9.5 10.5h5'),
    p('M10 21v-3.5h4V21'),
  ],
  chat: [
    p('M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4Z'),
    p('M8 9h8M8 12h5'),
  ],
  share: [c(18, 5, 2.5), c(6, 12, 2.5), c(18, 19, 2.5), p('m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4')],
  alert: [p('M12 3.5 2.5 20h19Z'), p('M12 9.5v4.5'), p('M12 17h.01')],
  shield: [p('M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6Z'), p('m9 12 2 2 4-4')],
  sparkles: [
    p('M12 4c.6 3.5 2.5 5.4 6 6-3.5.6-5.4 2.5-6 6-.6-3.5-2.5-5.4-6-6 3.5-.6 5.4-2.5 6-6Z'),
    p('M19 3v3M17.5 4.5h3M5 17v3M3.5 18.5h3'),
  ],
  droplet: [p('M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z')],
  calendar: [r(3.5, 5, 17, 15, 2), p('M3.5 10h17M8 3v4M16 3v4')],
  activity: [p('M3 12h4l3-8 4 16 3-8h4')],
  arrowRight: [p('M5 12h14'), p('m13 6 6 6-6 6')],
  map: [p('M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z'), p('M9 4v14M15 6v14')],
} as const satisfies Record<string, readonly IconShape[]>

export type IconName = keyof typeof ICONS
