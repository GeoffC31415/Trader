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


