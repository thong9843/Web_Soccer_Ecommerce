// Dữ liệu mẫu cho seed. Tên/slug danh mục theo mục 3 của plan.md.

export interface SeedCategory {
  name: string;
  slug: string;
  children: Array<{ name: string; slug: string }>;
}

export const CATEGORIES: SeedCategory[] = [
  {
    name: 'Giày',
    slug: 'giay',
    children: [
      { name: 'Giày cỏ nhân tạo (TF)', slug: 'co-nhan-tao' },
      { name: 'Giày cỏ tự nhiên (FG)', slug: 'co-tu-nhien' },
      { name: 'Giày đinh tháo rời (SG)', slug: 'dinh-thao-roi' },
      { name: 'Giày futsal (IC)', slug: 'futsal' },
      { name: 'Giày trẻ em', slug: 'tre-em' },
    ],
  },
  {
    name: 'Quần áo',
    slug: 'quan-ao',
    children: [
      { name: 'Áo đấu CLB', slug: 'ao-dau-clb' },
      { name: 'Áo đấu đội tuyển', slug: 'ao-dau-doi-tuyen' },
      { name: 'Quần short', slug: 'quan-short' },
      { name: 'Đồ tập luyện', slug: 'do-tap-luyen' },
      { name: 'Áo khoác và áo gió', slug: 'ao-khoac-ao-gio' },
      { name: 'Đồ thủ môn', slug: 'do-thu-mon' },
    ],
  },
  {
    name: 'Phụ kiện',
    slug: 'phu-kien',
    children: [
      { name: 'Bóng', slug: 'bong' },
      { name: 'Tất và băng bảo vệ', slug: 'tat-bang-bao-ve' },
      { name: 'Bọc ống đồng', slug: 'boc-ong-dong' },
      { name: 'Găng tay thủ môn', slug: 'gang-tay-thu-mon' },
      { name: 'Balo và túi giày', slug: 'balo-tui-giay' },
      { name: 'Băng đội trưởng', slug: 'bang-doi-truong' },
    ],
  },
];

export const BRANDS = [
  'Nike',
  'Adidas',
  'Puma',
  'Mizuno',
  'Joma',
  'Kamito',
  'Grand Sport',
  'Select',
  'Molten',
];

const SHOE_SIZES = ['39', '40', '41', '42', '43', '44'];
const KID_SIZES = ['33', '34', '35', '36', '37'];
const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SMALL_SIZES = ['S', 'M', 'L'];
const GLOVE_SIZES = ['7', '8', '9', '10'];

export interface SeedProduct {
  name: string;
  brand: string;
  /** Đường dẫn danh mục con, ví dụ `giay/co-nhan-tao` */
  category: string;
  price: number;
  colors: string[];
  sizes: string[];
  studType?: string;
  description?: string;
}

const shoe = (
  name: string,
  brand: string,
  stud: 'TF' | 'FG' | 'SG' | 'IC',
  price: number,
  colors: string[],
  category: string,
  sizes = SHOE_SIZES,
): SeedProduct => ({
  name,
  brand,
  category,
  price,
  colors,
  sizes,
  studType: stud,
  description: `${name} — giày bóng đá chính hãng, đế ${stud} phù hợp mặt sân tương ứng. Form ôm chân, bám sân tốt, bảo hành theo chính sách của cửa hàng.`,
});

export const PRODUCTS: SeedProduct[] = [
  // Giày cỏ nhân tạo
  shoe(
    'Nike Mercurial Vapor 16 Academy TF',
    'Nike',
    'TF',
    1890000,
    ['Cam', 'Đen'],
    'giay/co-nhan-tao',
  ),
  shoe(
    'Adidas Predator League TF',
    'Adidas',
    'TF',
    1650000,
    ['Đen', 'Đỏ'],
    'giay/co-nhan-tao',
  ),
  shoe(
    'Puma Future 8 Play TT',
    'Puma',
    'TF',
    1490000,
    ['Xanh dương', 'Vàng'],
    'giay/co-nhan-tao',
  ),
  shoe(
    'Mizuno Morelia Sala Classic TF',
    'Mizuno',
    'TF',
    1790000,
    ['Trắng', 'Đen'],
    'giay/co-nhan-tao',
  ),
  shoe(
    'Kamito QH19 TF',
    'Kamito',
    'TF',
    590000,
    ['Xanh lá', 'Đỏ'],
    'giay/co-nhan-tao',
  ),
  shoe(
    'Joma Top Flex TF',
    'Joma',
    'TF',
    1190000,
    ['Xanh dương', 'Cam'],
    'giay/co-nhan-tao',
  ),
  // Giày cỏ tự nhiên
  shoe(
    'Nike Phantom GX 2 Elite FG',
    'Nike',
    'FG',
    6500000,
    ['Đen', 'Xanh dương'],
    'giay/co-tu-nhien',
  ),
  shoe(
    'Adidas Copa Pure 3 Elite FG',
    'Adidas',
    'FG',
    5990000,
    ['Trắng', 'Đen'],
    'giay/co-tu-nhien',
  ),
  shoe(
    'Puma Ultra 5 Match FG/AG',
    'Puma',
    'FG',
    2390000,
    ['Cam', 'Xanh lá'],
    'giay/co-tu-nhien',
  ),
  shoe(
    'Mizuno Alpha Select FG',
    'Mizuno',
    'FG',
    3690000,
    ['Xanh dương', 'Trắng'],
    'giay/co-tu-nhien',
  ),
  // Giày đinh tháo rời
  shoe(
    'Nike Tiempo Legend 10 Pro SG',
    'Nike',
    'SG',
    3190000,
    ['Đen', 'Trắng'],
    'giay/dinh-thao-roi',
  ),
  shoe(
    'Adidas F50 Pro SG',
    'Adidas',
    'SG',
    3590000,
    ['Xanh lá', 'Vàng'],
    'giay/dinh-thao-roi',
  ),
  // Giày futsal
  shoe(
    'Nike Zoom Mercurial Vapor 16 Academy IC',
    'Nike',
    'IC',
    1790000,
    ['Cam', 'Xanh dương'],
    'giay/futsal',
  ),
  shoe(
    'Adidas Predator Club Sala IC',
    'Adidas',
    'IC',
    1390000,
    ['Đen', 'Trắng'],
    'giay/futsal',
  ),
  shoe(
    'Joma Maxima Sala IC',
    'Joma',
    'IC',
    990000,
    ['Đỏ', 'Đen'],
    'giay/futsal',
  ),
  // Giày trẻ em
  shoe(
    'Nike Jr. Mercurial Vapor 16 Club TF',
    'Nike',
    'TF',
    1190000,
    ['Cam', 'Đen'],
    'giay/tre-em',
    KID_SIZES,
  ),
  shoe(
    'Adidas Kids Copa Pure Club TF',
    'Adidas',
    'TF',
    990000,
    ['Trắng', 'Xanh dương'],
    'giay/tre-em',
    KID_SIZES,
  ),
  // Áo đấu CLB
  {
    name: 'Áo đấu Real Madrid sân nhà 2025/26',
    brand: 'Adidas',
    category: 'quan-ao/ao-dau-clb',
    price: 2290000,
    colors: ['Trắng'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo đấu Manchester United sân nhà 2025/26',
    brand: 'Adidas',
    category: 'quan-ao/ao-dau-clb',
    price: 2190000,
    colors: ['Đỏ'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo đấu Barcelona sân nhà 2025/26',
    brand: 'Nike',
    category: 'quan-ao/ao-dau-clb',
    price: 2390000,
    colors: ['Xanh dương'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo đấu Liverpool sân nhà 2025/26',
    brand: 'Nike',
    category: 'quan-ao/ao-dau-clb',
    price: 2290000,
    colors: ['Đỏ'],
    sizes: APPAREL_SIZES,
  },
  // Áo đấu đội tuyển
  {
    name: 'Áo đấu đội tuyển Việt Nam sân nhà',
    brand: 'Grand Sport',
    category: 'quan-ao/ao-dau-doi-tuyen',
    price: 450000,
    colors: ['Đỏ'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo đấu đội tuyển Argentina sân nhà',
    brand: 'Adidas',
    category: 'quan-ao/ao-dau-doi-tuyen',
    price: 2190000,
    colors: ['Trắng'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo đấu đội tuyển Brazil sân nhà',
    brand: 'Nike',
    category: 'quan-ao/ao-dau-doi-tuyen',
    price: 2290000,
    colors: ['Vàng'],
    sizes: APPAREL_SIZES,
  },
  // Quần short
  {
    name: 'Quần short Nike Dri-FIT Academy',
    brand: 'Nike',
    category: 'quan-ao/quan-short',
    price: 690000,
    colors: ['Đen', 'Xanh dương'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Quần short Adidas Tiro 24',
    brand: 'Adidas',
    category: 'quan-ao/quan-short',
    price: 590000,
    colors: ['Đen', 'Trắng'],
    sizes: APPAREL_SIZES,
  },
  // Đồ tập luyện
  {
    name: 'Bộ đồ tập Puma teamLIGA Training',
    brand: 'Puma',
    category: 'quan-ao/do-tap-luyen',
    price: 890000,
    colors: ['Xanh dương', 'Đen'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo tập Nike Strike Dri-FIT',
    brand: 'Nike',
    category: 'quan-ao/do-tap-luyen',
    price: 790000,
    colors: ['Cam', 'Đen'],
    sizes: APPAREL_SIZES,
  },
  // Áo khoác và áo gió
  {
    name: 'Áo khoác Adidas Tiro 24 Training',
    brand: 'Adidas',
    category: 'quan-ao/ao-khoac-ao-gio',
    price: 1290000,
    colors: ['Đen', 'Xanh dương'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Áo gió Nike Academy Pro',
    brand: 'Nike',
    category: 'quan-ao/ao-khoac-ao-gio',
    price: 1490000,
    colors: ['Đen'],
    sizes: APPAREL_SIZES,
  },
  // Đồ thủ môn
  {
    name: 'Áo thủ môn Adidas Squadra 25',
    brand: 'Adidas',
    category: 'quan-ao/do-thu-mon',
    price: 790000,
    colors: ['Xanh lá', 'Vàng'],
    sizes: APPAREL_SIZES,
  },
  {
    name: 'Bộ thủ môn Puma teamGOAL',
    brand: 'Puma',
    category: 'quan-ao/do-thu-mon',
    price: 990000,
    colors: ['Cam', 'Đen'],
    sizes: APPAREL_SIZES,
  },
  // Bóng
  {
    name: 'Bóng Nike Pitch số 5',
    brand: 'Nike',
    category: 'phu-kien/bong',
    price: 590000,
    colors: ['Trắng'],
    sizes: ['4', '5'],
  },
  {
    name: 'Bóng Adidas Conext 25 Pro số 5',
    brand: 'Adidas',
    category: 'phu-kien/bong',
    price: 2290000,
    colors: ['Trắng'],
    sizes: ['5'],
  },
  {
    name: 'Bóng Molten Vantaggio số 5',
    brand: 'Molten',
    category: 'phu-kien/bong',
    price: 790000,
    colors: ['Cam'],
    sizes: ['4', '5'],
  },
  {
    name: 'Bóng Select Brillant Super số 5',
    brand: 'Select',
    category: 'phu-kien/bong',
    price: 1390000,
    colors: ['Trắng'],
    sizes: ['5'],
  },
  // Tất và băng bảo vệ
  {
    name: 'Tất Nike Squad Crew',
    brand: 'Nike',
    category: 'phu-kien/tat-bang-bao-ve',
    price: 290000,
    colors: ['Đen', 'Trắng'],
    sizes: SMALL_SIZES,
  },
  {
    name: 'Tất Adidas Milano 23',
    brand: 'Adidas',
    category: 'phu-kien/tat-bang-bao-ve',
    price: 190000,
    colors: ['Đỏ', 'Xanh dương'],
    sizes: SMALL_SIZES,
  },
  // Bọc ống đồng
  {
    name: 'Bọc ống đồng Nike J Guard-CE',
    brand: 'Nike',
    category: 'phu-kien/boc-ong-dong',
    price: 350000,
    colors: ['Đen'],
    sizes: SMALL_SIZES,
  },
  {
    name: 'Bọc ống đồng Adidas Tiro League',
    brand: 'Adidas',
    category: 'phu-kien/boc-ong-dong',
    price: 390000,
    colors: ['Đen', 'Trắng'],
    sizes: SMALL_SIZES,
  },
  // Găng tay thủ môn
  {
    name: 'Găng tay thủ môn Adidas Predator Training',
    brand: 'Adidas',
    category: 'phu-kien/gang-tay-thu-mon',
    price: 790000,
    colors: ['Đen', 'Vàng'],
    sizes: GLOVE_SIZES,
  },
  {
    name: 'Găng tay thủ môn Puma Ultra Grip 4',
    brand: 'Puma',
    category: 'phu-kien/gang-tay-thu-mon',
    price: 1190000,
    colors: ['Cam'],
    sizes: GLOVE_SIZES,
  },
  // Balo và túi giày
  {
    name: 'Balo Nike Academy Team',
    brand: 'Nike',
    category: 'phu-kien/balo-tui-giay',
    price: 890000,
    colors: ['Đen', 'Xanh dương'],
    sizes: ['Free'],
  },
  {
    name: 'Túi trống Adidas Tiro Duffel',
    brand: 'Adidas',
    category: 'phu-kien/balo-tui-giay',
    price: 990000,
    colors: ['Đen'],
    sizes: ['Free'],
  },
  // Băng đội trưởng
  {
    name: 'Băng đội trưởng Nike Captain',
    brand: 'Nike',
    category: 'phu-kien/bang-doi-truong',
    price: 190000,
    colors: ['Vàng', 'Đỏ'],
    sizes: ['Free'],
  },
  {
    name: 'Băng đội trưởng Adidas Captain',
    brand: 'Adidas',
    category: 'phu-kien/bang-doi-truong',
    price: 170000,
    colors: ['Đen', 'Xanh lá'],
    sizes: ['Free'],
  },
];
