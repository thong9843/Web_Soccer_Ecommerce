import type { CategoryNode } from '@football/shared';
import { apiGet } from './api-server';

export const getCategoryTree = () =>
  apiGet<CategoryNode[]>('/categories', { revalidate: 60 });

export function findCategory(
  tree: CategoryNode[],
  path: string,
): CategoryNode | undefined {
  for (const node of tree) {
    if (node.path === path) return node;
    const hit = findCategory(node.children, path);
    if (hit) return hit;
  }
  return undefined;
}

/** Chuỗi cha → con của một đường dẫn, dùng cho breadcrumb. */
export function categoryTrail(
  tree: CategoryNode[],
  path: string,
): CategoryNode[] {
  const segments = path.split('/');
  const trail: CategoryNode[] = [];
  for (let i = 1; i <= segments.length; i++) {
    const node = findCategory(tree, segments.slice(0, i).join('/'));
    if (!node) break;
    trail.push(node);
  }
  return trail;
}
