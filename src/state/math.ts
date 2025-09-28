export function distance(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function clampMagnitude(v: [number, number, number], maxLen: number): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len <= maxLen || len === 0) return v;
  const s = maxLen / len;
  return [v[0] * s, v[1] * s, v[2] * s];
}


// Basic vector helpers
export function add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

export function sub(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

export function scale(a: [number, number, number], s: number): [number, number, number] {
  return [a[0]*s, a[1]*s, a[2]*s];
}

export function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export function length(a: [number, number, number]): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function normalize(a: [number, number, number]): [number, number, number] {
  const len = length(a);
  if (len === 0) return [0,0,0];
  return [a[0]/len, a[1]/len, a[2]/len];
}

// Quadratic bezier (sufficient for gentle curves)
export function quadraticBezier(p0: [number, number, number], p1: [number, number, number], p2: [number, number, number], t: number): [number, number, number] {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return [
    uu * p0[0] + 2 * u * t * p1[0] + tt * p2[0],
    uu * p0[1] + 2 * u * t * p1[1] + tt * p2[1],
    uu * p0[2] + 2 * u * t * p1[2] + tt * p2[2],
  ];
}

export function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}


