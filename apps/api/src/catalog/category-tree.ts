import type { CategoryNode } from '@football/shared';

export interface CategoryRow {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
}

/**
 * Dựng cây danh mục từ danh sách phẳng. Chỉ nhận các dòng đã lọc is_active;
 * nút có cha không nằm trong danh sách (cha bị ẩn) sẽ bị loại luôn.
 */
export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const sorted = [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'),
  );
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const row of sorted) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }

  const build = (parentId: string | null, parentPath: string): CategoryNode[] =>
    (byParent.get(parentId) ?? []).map((row) => {
      const path = parentPath ? `${parentPath}/${row.slug}` : row.slug;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        path,
        sortOrder: row.sortOrder,
        children: build(row.id, path),
      };
    });

  return build(null, '');
}

export function flattenTree(tree: CategoryNode[]): CategoryNode[] {
  return tree.flatMap((node) => [node, ...flattenTree(node.children)]);
}

/** Tìm nút theo đường dẫn (vd `giay/co-nhan-tao`). */
export function findByPath(
  tree: CategoryNode[],
  path: string,
): CategoryNode | undefined {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  return flattenTree(tree).find((node) => node.path === normalized);
}

/** id của nút và toàn bộ con cháu. */
export function collectIds(node: CategoryNode): string[] {
  return flattenTree([node]).map((n) => n.id);
}
