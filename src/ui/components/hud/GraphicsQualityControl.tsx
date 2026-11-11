import { useGameStore } from '../../../state';
export function GraphicsQualityControl() {
  const quality = useGameStore(s => s.graphicsQuality);
  const setQuality = useGameStore(s => s.setGraphicsQuality);
  return <label>Graphics <select aria-label="Graphics quality" value={quality} onChange={e => setQuality(e.target.value as typeof quality)}>
    <option value="low">Low — compatibility</option><option value="medium">Balanced</option><option value="high">High — shadows</option>
  </select></label>;
}
