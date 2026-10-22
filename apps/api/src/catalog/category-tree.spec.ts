import {
  buildCategoryTree,
  collectIds,
  findByPath,
  type CategoryRow,
} from './category-tree.js';
import { compareSizes } from './catalog.service.js';

const rows: CategoryRow[] = [
  {
    id: 'phukien',
    parentId: null,
    name: 'Phụ kiện',
    slug: 'phu-kien',
    sortOrder: 2,
  },
  { id: 'giay', parentId: null, name: 'Giày', slug: 'giay', sortOrder: 1 },
  {
    id: 'tf',
    parentId: 'giay',
    name: 'Giày TF',
    slug: 'co-nhan-tao',
    sortOrder: 1,
  },
  {
    id: 'fg',
    parentId: 'giay',
    name: 'Giày FG',
    slug: 'co-tu-nhien',
    sortOrder: 0,
  },
  { id: 'bong', parentId: 'phukien', name: 'Bóng', slug: 'bong', sortOrder: 0 },
  // cha bị ẩn → không có trong danh sách → con mồ côi phải bị loại
  {
    id: 'orphan',
    parentId: 'hidden',
    name: 'Mồ côi',
    slug: 'mo-coi',
    sortOrder: 0,
  },
];

describe('buildCategoryTree', () => {
  const tree = buildCategoryTree(rows);

  it('sắp xếp theo sortOrder và dựng cây 2 cấp', () => {
    expect(tree.map((n) => n.slug)).toEqual(['giay', 'phu-kien']);
    expect(tree[0].children.map((n) => n.slug)).toEqual([
      'co-tu-nhien',
      'co-nhan-tao',
    ]);
  });

  it('tạo path đầy đủ cho URL', () => {
    expect(tree[0].children[1].path).toBe('giay/co-nhan-tao');
  });

  it('loại bỏ nút có cha không hiển thị', () => {
    expect(JSON.stringify(tree)).not.toContain('mo-coi');
  });

  it('findByPath tìm nút cha và nút con, bỏ qua dấu / thừa', () => {
    expect(findByPath(tree, 'giay')?.id).toBe('giay');
    expect(findByPath(tree, '/giay/co-nhan-tao/')?.id).toBe('tf');
    expect(findByPath(tree, 'giay/bong')).toBeUndefined();
  });

  it('collectIds gồm nút và toàn bộ con cháu', () => {
    expect(collectIds(findByPath(tree, 'giay')!).sort()).toEqual([
      'fg',
      'giay',
      'tf',
    ]);
  });
});

describe('compareSizes', () => {
  it('xếp số trước, size chữ theo thứ tự XS→XXL', () => {
    const sizes = ['XL', '42', 'S', '38.5', 'Free', 'M', '40'];
    expect(sizes.sort(compareSizes)).toEqual([
      '38.5',
      '40',
      '42',
      'S',
      'M',
      'XL',
      'Free',
    ]);
  });
});
