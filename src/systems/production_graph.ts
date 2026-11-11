import type { manufacturingDirectory } from './journal_analysis';
export type RecipeProvider = ReturnType<typeof manufacturingDirectory>[number];
export type ProductionEdge = { id: string; inputId: string; outputId: string; providers: RecipeProvider[] };
export function productionChains(recipes: RecipeProvider[]) {
  const grouped = new Map<string, ProductionEdge>();
  for (const recipe of recipes) {
    const id = `${recipe.inputId}:${recipe.outputId}`;
    const edge = grouped.get(id) ?? { id, inputId: recipe.inputId, outputId: recipe.outputId, providers: [] };
    edge.providers.push(recipe); grouped.set(id, edge);
  }
  const edges = [...grouped.values()], visited = new Set<string>();
  const chains: Array<{ id: string; nodes: Array<{ id: string; column: number; row: number }>; edges: ProductionEdge[]; columns: number; rows: number }> = [];
  for (const start of edges.flatMap(e => [e.inputId, e.outputId])) {
    if (visited.has(start)) continue;
    const component = new Set([start]), queue = [start];
    while (queue.length) {
      const node = queue.shift()!; visited.add(node);
      for (const e of edges) if (e.inputId === node || e.outputId === node) for (const id of [e.inputId, e.outputId]) if (!component.has(id)) { component.add(id); queue.push(id); }
    }
    const links = edges.filter(e => component.has(e.inputId));
    // Topological levels preserve branching/merging rather than inventing linear recipes.
    const levels = new Map<string, number>();
    for (let pass = 0; pass < component.size; pass++) for (const id of component) {
      if (levels.has(id)) continue;
      const parents = links.filter(e => e.outputId === id).map(e => e.inputId);
      if (parents.every(p => levels.has(p))) levels.set(id, parents.length ? Math.max(...parents.map(p => levels.get(p)!)) + 1 : 0);
    }
    const rows: Record<number, number> = {};
    const nodes = [...component].sort().map(id => { const column = levels.get(id) ?? 0, row = rows[column] ?? 0; rows[column] = row + 1; return { id, column, row }; });
    chains.push({ id: [...component].sort().join(':'), nodes, edges: links, columns: Math.max(...nodes.map(n => n.column)) + 1, rows: Math.max(...Object.values(rows)) });
  }
  return chains.sort((a, b) => Number(b.nodes.some(n => n.id === 'hydrogen')) - Number(a.nodes.some(n => n.id === 'hydrogen')) || a.id.localeCompare(b.id));
}
