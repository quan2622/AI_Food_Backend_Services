import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

// ─── MASTER DATA ──────────────────────────────────────────────────────────────

const NUTRIENTS = [
  { name: 'Calories', unit: 'kcal' as const },
  { name: 'Protein', unit: 'UNIT_G' as const },
  { name: 'Carbohydrates', unit: 'UNIT_G' as const },
  { name: 'Fat', unit: 'UNIT_G' as const },
  { name: 'Fiber', unit: 'UNIT_G' as const },
];

const ALLERGENS: { name: string; imageUrl: string | null }[] = [
  {
    name: 'Đậu phộng',
    imageUrl: 'https://hatgiongphuongnam.com/asset/upload/image/hat-giong-dau-phong_(2).jpg?v=20190410',
  },
  {
    name: 'Gluten',
    imageUrl: 'https://chefjob.vn/wp-content/uploads/2020/03/gluten-la-gi.jpg',
  },
  {
    name: 'Sữa',
    imageUrl: 'https://file.hstatic.net/1000276446/file/20200516_090815_108358_sua.max-800x800_3c3ab99581d1422bb25ae9a153a15706_grande.jpg',
  },
  {
    name: 'Trứng',
    imageUrl: 'https://cdn-www.vinid.net/1e221266-shutterstock_113786020-1.jpg',
  },
  {
    name: 'Hải sản có vỏ',
    imageUrl: 'https://bizweb.dktcdn.net/100/308/217/files/ngeu-so-oc-2658fd77-40c5-4180-a570-c2d5feae6c14.png?v=1532577721623',
  },
  {
    name: 'Đậu nành',
    imageUrl: 'https://file.hstatic.net/200000700229/article/lam-sua-dau-nanh-edamame-1_ee4d70ee58ec4f82a7f56ce24e9d8ed1.jpg',
  },
  {
    name: 'Quả hạch',
    imageUrl: 'https://thanhnien.mediacdn.vn/Uploaded/ngocquy/2022_08_20/1-qua-hach-shutterstock-795.jpg',
  },
  {
    name: 'Cá',
    imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_3_25_638469367754094619_ca-song.jpg',
  },
  {
    name: 'Mè (vừng)',
    imageUrl: 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2023/9/26/cong-dung-tuyet-voi-cua-hat-vung-doi-voi-suc-khoe-169570229736928962296.jpeg',
  },
  {
    name: 'Lúa mì',
    imageUrl: 'https://agrimexco.com.vn/uploadwb/hinhsp/lua_mi_cho_gia_suc_8738201892815_b_.jpg',
  },
  {
    name: 'Tôm',
    imageUrl: 'https://product.hstatic.net/1000182631/product/resize_anh-5273-8_90c0dbcc949944738551635fe608e950.png',
  },
  {
    name: 'Cua',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Blue_crab_on_market_in_Piraeus_-_Callinectes_sapidus_Rathbun_20020819-317.jpg',
  },
];

const CATEGORY_NAMES = [
  'Phở',
  'Bún',
  'Cơm',
  'Mì',
  'Bánh mì',
  'Gỏi & Salad',
  'Canh & Súp',
  'Món nướng',
  'Món xào',
  'Cháo',
  'Bánh & Xôi',
  'Chè & Tráng miệng',
  'Nước uống',
  'Nem & Cuốn',
  'Cơm bowl',
  'Lẩu',
  'Món hầm & kho',
  'Món chiên',
  'Dimsum & Bánh',
];

// ─── FOOD CATALOG + defaultServingGrams ──────────────────────────────────────
const FOODS_FIXED = [
  // ── PHỞ ──────────────────────────────────────────────────────────────────
  {
    foodName: 'Phở bò tái',
    classKey: 'Pho',
    cat: 'Phở',
    cal: 185, pro: 18, carb: 20, fat: 4.5, fib: 0.8,
    allergens: [],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Phở gà',
    cat: 'Phở',
    cal: 165, pro: 14, carb: 20, fat: 3.5, fib: 0.8,
    allergens: [],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Phở bò chín',
    cat: 'Phở',
    cal: 190, pro: 19, carb: 20, fat: 5.0, fib: 0.8,
    allergens: [],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Phở cuốn',
    cat: 'Phở',
    cal: 175, pro: 14, carb: 22, fat: 4.0, fib: 1.5,
    allergens: [],
    defaultServingGrams: 300,
    isNew: true,
  },
  {
    foodName: 'Phở xào',
    cat: 'Phở',
    cal: 310, pro: 20, carb: 38, fat: 9.0, fib: 1.5,
    allergens: ['Trứng'],
    defaultServingGrams: 400,
  },

  // ── BÚN ──────────────────────────────────────────────────────────────────
  {
    foodName: 'Bún bò Huế',
    cat: 'Bún',
    cal: 195, pro: 17, carb: 22, fat: 5.0, fib: 1.0,
    allergens: [],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Bún riêu cua',
    cat: 'Bún',
    cal: 185, pro: 14, carb: 22, fat: 5.0, fib: 1.5,
    allergens: ['Cua'],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Bún thịt nướng',
    cat: 'Bún',
    cal: 365, pro: 22, carb: 48, fat: 9.5, fib: 2.5,
    allergens: [],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Bún mắm',
    cat: 'Bún',
    cal: 350, pro: 20, carb: 45, fat: 10, fib: 2.5,
    allergens: ['Cá', 'Hải sản có vỏ'],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Bún đậu mắm tôm',
    cat: 'Bún',
    cal: 310, pro: 16, carb: 38, fat: 10, fib: 2.5,
    allergens: ['Tôm', 'Đậu nành'],
    defaultServingGrams: 450,
    isNew: true,
  },
  {
    foodName: 'Bún cá',
    cat: 'Bún',
    cal: 210, pro: 20, carb: 25, fat: 4.0, fib: 1.5,
    allergens: ['Cá'],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Bún ốc',
    cat: 'Bún',
    cal: 170, pro: 12, carb: 24, fat: 3.5, fib: 1.2,
    allergens: ['Hải sản có vỏ'],
    defaultServingGrams: 450,
  },

  // ── CỐM / CƠM ────────────────────────────────────────────────────────────
  {
    foodName: 'Cơm tấm sườn bì chả',
    classKey: 'Com tam',
    cat: 'Cơm',
    cal: 420, pro: 28, carb: 48, fat: 12, fib: 2.0,
    allergens: ['Trứng'],
    defaultServingGrams: 350,
  },
  {
    foodName: 'Cơm tấm chả trứng',
    cat: 'Cơm',
    cal: 395, pro: 24, carb: 50, fat: 10, fib: 1.8,
    allergens: ['Trứng'],
    defaultServingGrams: 350,
    isNew: true,
  },
  {
    foodName: 'Cơm chiên dương châu',
    cat: 'Cơm',
    cal: 380, pro: 12, carb: 55, fat: 12, fib: 1.5,
    allergens: ['Trứng'],
    defaultServingGrams: 350,
  },
  {
    foodName: 'Cơm gà Hội An',
    cat: 'Cơm bowl',
    cal: 440, pro: 22, carb: 62, fat: 12, fib: 2.0,
    allergens: [],
    defaultServingGrams: 350,
  },
  {
    foodName: 'Cơm gà xối mỡ',
    cat: 'Cơm bowl',
    cal: 450, pro: 24, carb: 55, fat: 15, fib: 1.5,
    allergens: [],
    defaultServingGrams: 350,
  },
  {
    foodName: 'Cơm sườn nướng mật ong',
    cat: 'Cơm bowl',
    cal: 430, pro: 26, carb: 52, fat: 13, fib: 1.8,
    allergens: [],
    defaultServingGrams: 350,
  },
  {
    foodName: 'Cơm trắng + cá kho tộ',
    cat: 'Cơm',
    cal: 350, pro: 28, carb: 40, fat: 8.0, fib: 1.0,
    allergens: ['Cá'],
    defaultServingGrams: 350,
  },
  {
    foodName: 'Cơm trắng + thịt kho trứng',
    cat: 'Món hầm & kho',
    cal: 390, pro: 24, carb: 42, fat: 13, fib: 0.8,
    allergens: ['Trứng'],
    defaultServingGrams: 350,
  },

  // ── MÌ ───────────────────────────────────────────────────────────────────
  {
    foodName: 'Mì Quảng',
    cat: 'Mì',
    cal: 310, pro: 16, carb: 42, fat: 8.0, fib: 2.0,
    allergens: ['Gluten', 'Hải sản có vỏ'],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Hủ tiếu Nam Vang',
    cat: 'Mì',
    cal: 290, pro: 18, carb: 38, fat: 7.5, fib: 1.5,
    allergens: ['Hải sản có vỏ'],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Mì xào hải sản',
    cat: 'Mì',
    cal: 420, pro: 18, carb: 58, fat: 14, fib: 2.0,
    allergens: ['Gluten', 'Hải sản có vỏ', 'Tôm'],
    defaultServingGrams: 450,
  },
  {
    foodName: 'Cao lầu Hội An',
    cat: 'Mì',
    cal: 340, pro: 18, carb: 46, fat: 9.0, fib: 2.2,
    allergens: ['Hải sản có vỏ'],
    defaultServingGrams: 400,
  },
  {
    foodName: 'Mì vịt tiềm',
    cat: 'Mì',
    cal: 350, pro: 22, carb: 40, fat: 11, fib: 1.5,
    allergens: ['Gluten'],
    defaultServingGrams: 450,
  },

  // ── BÁNH MÌ ──────────────────────────────────────────────────────────────
  {
    foodName: 'Bánh mì thịt nguội',
    classKey: 'Banh mi',
    cat: 'Bánh mì',
    cal: 260, pro: 12, carb: 35, fat: 8.5, fib: 2.0,
    allergens: ['Gluten', 'Trứng'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh mì chả cá',
    cat: 'Bánh mì',
    cal: 270, pro: 14, carb: 36, fat: 7.5, fib: 1.8,
    allergens: ['Gluten', 'Cá'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh mì chảo',
    cat: 'Bánh mì',
    cal: 430, pro: 18, carb: 42, fat: 20, fib: 1.5,
    allergens: ['Gluten', 'Trứng'],
    defaultServingGrams: 200,
    isNew: true,
  },
  {
    foodName: 'Bánh mì gà nướng',
    cat: 'Bánh mì',
    cal: 285, pro: 20, carb: 34, fat: 7.5, fib: 2.0,
    allergens: ['Gluten'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh bao nhân thịt',
    cat: 'Dimsum & Bánh',
    cal: 285, pro: 12, carb: 42, fat: 8.0, fib: 1.5,
    allergens: ['Gluten'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh bao nhân trứng muối',
    cat: 'Dimsum & Bánh',
    cal: 295, pro: 10, carb: 44, fat: 9.0, fib: 1.2,
    allergens: ['Gluten', 'Trứng'],
    defaultServingGrams: 150,
  },

  // ── GỎI & SALAD ──────────────────────────────────────────────────────────
  {
    foodName: 'Gỏi cuốn tôm thịt',
    classKey: 'Goi cuon',
    cat: 'Nem & Cuốn',
    cal: 95,  pro: 8,  carb: 14, fat: 2.0, fib: 2.5,
    allergens: ['Tôm'],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Gỏi cuốn chay',
    cat: 'Nem & Cuốn',
    cal: 80,  pro: 4,  carb: 14, fat: 1.5, fib: 2.8,
    allergens: [],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Nộm đu đủ bò khô',
    cat: 'Gỏi & Salad',
    cal: 110, pro: 12, carb: 15, fat: 2.5, fib: 3.0,
    allergens: [],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Gỏi gà bắp cải',
    cat: 'Gỏi & Salad',
    cal: 120, pro: 15, carb: 10, fat: 3.5, fib: 2.5,
    allergens: [],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Gỏi ngó sen tôm thịt',
    cat: 'Gỏi & Salad',
    cal: 130, pro: 14, carb: 16, fat: 3.0, fib: 3.5,
    allergens: ['Tôm', 'Đậu phộng'],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Gỏi bưởi tôm thịt',
    cat: 'Gỏi & Salad',
    cal: 115, pro: 11, carb: 15, fat: 2.5, fib: 2.8,
    allergens: ['Tôm', 'Đậu phộng'],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Chả cá Lã Vọng',
    cat: 'Gỏi & Salad',
    cal: 240, pro: 28, carb: 8, fat: 12, fib: 1.0,
    allergens: ['Cá', 'Mè (vừng)'],
    defaultServingGrams: 250,
    isNew: true,
  },

  // ── CANH & SÚP ───────────────────────────────────────────────────────────
  {
    foodName: 'Canh chua cá',
    cat: 'Canh & Súp',
    cal: 85,  pro: 10, carb: 10, fat: 2.0, fib: 2.8,
    allergens: ['Cá'],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Canh khổ qua dồn thịt',
    cat: 'Canh & Súp',
    cal: 90,  pro: 9,  carb: 8,  fat: 3.0, fib: 3.2,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Súp bí đỏ',
    cat: 'Canh & Súp',
    cal: 70,  pro: 2,  carb: 14, fat: 1.5, fib: 2.0,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Canh rau ngót thịt bằm',
    cat: 'Canh & Súp',
    cal: 75,  pro: 8,  carb: 7,  fat: 2.5, fib: 2.5,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Lẩu thái hải sản',
    cat: 'Lẩu',
    cal: 280, pro: 24, carb: 22, fat: 10, fib: 3.0,
    allergens: ['Tôm', 'Hải sản có vỏ', 'Cá'],
    defaultServingGrams: 500,
  },
  {
    foodName: 'Lẩu bò nhúng dấm',
    cat: 'Lẩu',
    cal: 320, pro: 30, carb: 18, fat: 14, fib: 2.0,
    allergens: [],
    defaultServingGrams: 500,
  },
  {
    foodName: 'Lẩu mắm miền Tây',
    cat: 'Lẩu',
    cal: 300, pro: 22, carb: 25, fat: 12, fib: 3.5,
    allergens: ['Cá', 'Tôm'],
    defaultServingGrams: 500,
  },

  // ── MÓN NƯỚNG ────────────────────────────────────────────────────────────
  {
    foodName: 'Gà nướng lá chanh',
    cat: 'Món nướng',
    cal: 210, pro: 32, carb: 2,  fat: 8.5, fib: 0.5,
    allergens: [],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Tôm nướng muối ớt',
    cat: 'Món nướng',
    cal: 135, pro: 26, carb: 3,  fat: 2.0, fib: 0.0,
    allergens: ['Tôm'],
    defaultServingGrams: 180,
  },
  {
    foodName: 'Mực nướng sa tế',
    cat: 'Món nướng',
    cal: 145, pro: 22, carb: 5,  fat: 4.0, fib: 0.5,
    allergens: ['Hải sản có vỏ'],
    defaultServingGrams: 180,
  },
  {
    foodName: 'Sườn nướng mật ong',
    cat: 'Món nướng',
    cal: 290, pro: 22, carb: 18, fat: 14, fib: 0.5,
    allergens: [],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Cá nướng giấy bạc',
    cat: 'Món nướng',
    cal: 180, pro: 26, carb: 3,  fat: 7.0, fib: 1.0,
    allergens: ['Cá'],
    defaultServingGrams: 250,
  },

  // ── MÓN XÀO ──────────────────────────────────────────────────────────────
  {
    foodName: 'Bò lúc lắc',
    cat: 'Món xào',
    cal: 280, pro: 30, carb: 8,  fat: 14, fib: 1.0,
    allergens: [],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Rau muống xào tỏi',
    cat: 'Món xào',
    cal: 55,  pro: 3,  carb: 8,  fat: 2.0, fib: 3.5,
    allergens: [],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Trứng hấp thịt bằm',
    cat: 'Món xào',
    cal: 165, pro: 15, carb: 5,  fat: 10, fib: 0.3,
    allergens: ['Trứng'],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Bắp cải xào thịt bò',
    cat: 'Món xào',
    cal: 145, pro: 14, carb: 10, fat: 6.0, fib: 3.0,
    allergens: [],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Đậu phụ xào sả ớt',
    cat: 'Món xào',
    cal: 120, pro: 8,  carb: 8,  fat: 7.0, fib: 1.5,
    allergens: ['Đậu nành'],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Cải thảo xào tôm',
    cat: 'Món xào',
    cal: 100, pro: 10, carb: 6,  fat: 4.0, fib: 2.0,
    allergens: ['Tôm'],
    defaultServingGrams: 200,
  },

  // ── CHÁO ─────────────────────────────────────────────────────────────────
  {
    foodName: 'Cháo gà',
    cat: 'Cháo',
    cal: 120, pro: 14, carb: 18, fat: 2.5, fib: 0.5,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Cháo đậu xanh',
    cat: 'Cháo',
    cal: 105, pro: 5,  carb: 20, fat: 1.0, fib: 3.5,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Cháo lòng',
    cat: 'Cháo',
    cal: 155, pro: 12, carb: 18, fat: 5.5, fib: 0.8,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Cháo cá lóc',
    cat: 'Cháo',
    cal: 130, pro: 16, carb: 16, fat: 3.0, fib: 0.5,
    allergens: ['Cá'],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Cháo bò',
    cat: 'Cháo',
    cal: 140, pro: 14, carb: 17, fat: 4.0, fib: 0.5,
    allergens: [],
    defaultServingGrams: 300,
  },

  // ── BÁNH & XÔI ───────────────────────────────────────────────────────────
  {
    foodName: 'Bánh cuốn nhân thịt',
    classKey: 'Banh cuon',
    cat: 'Bánh & Xôi',
    cal: 180, pro: 10, carb: 28, fat: 4.0, fib: 1.0,
    allergens: ['Gluten'],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Xôi gà',
    cat: 'Bánh & Xôi',
    cal: 290, pro: 18, carb: 42, fat: 6.5, fib: 1.8,
    allergens: [],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Xôi xéo',
    classKey: 'Xoi xeo',
    cat: 'Bánh & Xôi',
    cal: 320, pro: 8,  carb: 58, fat: 7.0, fib: 2.5,
    allergens: ['Đậu nành'],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Bánh bèo',
    cat: 'Bánh & Xôi',
    cal: 125, pro: 4,  carb: 22, fat: 3.0, fib: 0.8,
    allergens: ['Tôm'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh tráng nướng',
    classKey: 'Banh trang nuong',
    cat: 'Bánh & Xôi',
    cal: 155, pro: 3,  carb: 28, fat: 4,   fib: 1.5,
    allergens: [],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh ướt',
    cat: 'Bánh & Xôi',
    cal: 130, pro: 4,  carb: 24, fat: 3,   fib: 0.8,
    allergens: ['Tôm'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh khọt',
    classKey: 'Banh khot',
    cat: 'Bánh & Xôi',
    cal: 185, pro: 6,  carb: 22, fat: 8,   fib: 1.0,
    allergens: ['Tôm', 'Trứng'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Bánh xèo',
    classKey: 'Banh xeo',
    cat: 'Bánh & Xôi',
    cal: 230, pro: 10, carb: 26, fat: 10,  fib: 2.0,
    allergens: ['Tôm', 'Trứng', 'Gluten'],
    defaultServingGrams: 200,
  },

  // ── MÓN HẦM & KHO ───────────────────────────────────────────────────────
  {
    foodName: 'Thịt kho tàu',
    cat: 'Món hầm & kho',
    cal: 320, pro: 20, carb: 15, fat: 20, fib: 0.5,
    allergens: ['Trứng'],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Cá kho tộ',
    classKey: 'Ca kho to',
    cat: 'Món hầm & kho',
    cal: 210, pro: 28, carb: 8,  fat: 8,  fib: 0.5,
    allergens: ['Cá'],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Bò kho bánh mì',
    cat: 'Món hầm & kho',
    cal: 350, pro: 26, carb: 30, fat: 14, fib: 3.0,
    allergens: ['Gluten'],
    defaultServingGrams: 400,
  },
  {
    foodName: 'Sườn hầm củ cải',
    cat: 'Món hầm & kho',
    cal: 280, pro: 20, carb: 20, fat: 13, fib: 2.5,
    allergens: [],
    defaultServingGrams: 350,
  },

  // ── MÓN CHIÊN ────────────────────────────────────────────────────────────
  {
    foodName: 'Nem rán (chả giò)',
    cat: 'Nem & Cuốn',
    cal: 220, pro: 8,  carb: 22, fat: 11, fib: 1.5,
    allergens: ['Gluten', 'Trứng'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Chả giò hải sản',
    cat: 'Nem & Cuốn',
    cal: 235, pro: 10, carb: 22, fat: 12, fib: 1.2,
    allergens: ['Gluten', 'Tôm', 'Hải sản có vỏ'],
    defaultServingGrams: 150,
  },
  {
    foodName: 'Tôm chiên giòn',
    cat: 'Món chiên',
    cal: 250, pro: 20, carb: 16, fat: 12, fib: 0.5,
    allergens: ['Tôm', 'Gluten', 'Trứng'],
    defaultServingGrams: 180,
  },
  {
    foodName: 'Đậu hũ chiên',
    cat: 'Món chiên',
    cal: 180, pro: 10, carb: 8,  fat: 12, fib: 0.8,
    allergens: ['Đậu nành'],
    defaultServingGrams: 150,
  },

  // ── CHÈ & TRÁNG MIỆNG ────────────────────────────────────────────────────
  {
    foodName: 'Chè đậu đỏ',
    cat: 'Chè & Tráng miệng',
    cal: 145, pro: 4,  carb: 30, fat: 1.5, fib: 4.0,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Chè trôi nước',
    cat: 'Chè & Tráng miệng',
    cal: 195, pro: 3,  carb: 38, fat: 4.5, fib: 2.0,
    allergens: [],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Chè bắp',
    cat: 'Chè & Tráng miệng',
    cal: 130, pro: 2,  carb: 28, fat: 1.0, fib: 1.5,
    allergens: ['Sữa'],
    defaultServingGrams: 250,
  },
  {
    foodName: 'Chè thái',
    cat: 'Chè & Tráng miệng',
    cal: 220, pro: 3,  carb: 42, fat: 5.0, fib: 2.5,
    allergens: ['Sữa'],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Bánh tráng trộn',
    cat: 'Chè & Tráng miệng',
    cal: 195, pro: 5,  carb: 32, fat: 6.5, fib: 2.0,
    allergens: ['Tôm'],
    defaultServingGrams: 200,
  },
  {
    foodName: 'Dưa hấu & trái cây',
    cat: 'Chè & Tráng miệng',
    cal: 45,  pro: 1,  carb: 11, fat: 0.2, fib: 1.2,
    allergens: [],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Bánh flan',
    cat: 'Chè & Tráng miệng',
    cal: 150, pro: 5,  carb: 22, fat: 5.5, fib: 0.2,
    allergens: ['Trứng', 'Sữa'],
    defaultServingGrams: 150,
  },

  // ── NƯỚC UỐNG ────────────────────────────────────────────────────────────
  {
    foodName: 'Sinh tố bơ',
    cat: 'Nước uống',
    cal: 185, pro: 3,  carb: 15, fat: 13, fib: 5.0,
    allergens: ['Sữa'],
    defaultServingGrams: 400,
  },
  {
    foodName: 'Nước mía',
    cat: 'Nước uống',
    cal: 75,  pro: 0.5,carb: 18, fat: 0.2, fib: 0.3,
    allergens: [],
    defaultServingGrams: 500,
  },
  {
    foodName: 'Trà sữa trân châu',
    cat: 'Nước uống',
    cal: 280, pro: 4,  carb: 52, fat: 6.5, fib: 0.5,
    allergens: ['Sữa', 'Gluten'],
    defaultServingGrams: 500,
  },
  {
    foodName: 'Cà phê sữa đá',
    cat: 'Nước uống',
    cal: 120, pro: 2,  carb: 18, fat: 4.5, fib: 0.0,
    allergens: ['Sữa'],
    defaultServingGrams: 300,
  },
  {
    foodName: 'Nước dừa tươi',
    cat: 'Nước uống',
    cal: 45,  pro: 0.8,carb: 9,  fat: 0.5, fib: 1.0,
    allergens: [],
    defaultServingGrams: 400,
  },

  // ── MÓN MỚI (isNew) ──────────────────────────────────────────────────────
  {
    foodName: 'Bún hải sản Phú Quốc',
    cat: 'Bún',
    cal: 260, pro: 22, carb: 28, fat: 7.0, fib: 2.0,
    allergens: ['Tôm', 'Hải sản có vỏ', 'Cá'],
    defaultServingGrams: 450,
    isNew: true,
  },
  {
    foodName: 'Bánh căn Phan Rang',
    cat: 'Dimsum & Bánh',
    cal: 200, pro: 8,  carb: 30, fat: 6.0, fib: 1.0,
    allergens: ['Trứng', 'Tôm'],
    defaultServingGrams: 200,
    isNew: true,
  },
  {
    foodName: 'Cháo hến Huế',
    cat: 'Cháo',
    cal: 125, pro: 12, carb: 16, fat: 3.0, fib: 0.8,
    allergens: ['Hải sản có vỏ'],
    defaultServingGrams: 300,
    isNew: true,
  },

  // ── EDGE CASES ───────────────────────────────────────────────────────────
  {
    foodName: '[Dummy - No Nutrition]',
    cat: 'Cháo',
    cal: 0,   pro: 0,  carb: 0,  fat: 0,  fib: 0,
    allergens: [],
    defaultServingGrams: 100,
  },
  {
    foodName: '[Dummy - All Allergens]',
    cat: 'Cháo',
    cal: 200, pro: 10, carb: 20, fat: 8,  fib: 1,
    allergens: ['Đậu phộng', 'Gluten', 'Sữa', 'Trứng', 'Hải sản có vỏ', 'Cá'],
    defaultServingGrams: 100,
  },
];;

// ─── GOAL CONFIG ──────────────────────────────────────────────────────────────

const GOAL_CONFIG = {
  GOAL_LOSS: {
    calories: 1600,
    protein: 120,
    carbs: 160,
    fat: 50,
    fiber: 25,
    targetWeight: 55,
  },
  GOAL_GAIN: {
    calories: 2800,
    protein: 160,
    carbs: 350,
    fat: 90,
    fiber: 20,
    targetWeight: 75,
  },
  GOAL_MAINTAIN: {
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65,
    fiber: 25,
    targetWeight: 65,
  },
  GOAL_STRICT: {
    calories: 1500,
    protein: 130,
    carbs: 140,
    fat: 45,
    fiber: 30,
    targetWeight: 60,
  },
};

// ─── CLUSTER CONFIG ───────────────────────────────────────────────────────────

const CLUSTER_CONFIG = {
  // Cluster A — Giảm cân: ưa salad, canh, cháo ít calo
  A: {
    goal: 'GOAL_LOSS',
    preferredFoods: [
      'Gỏi cuốn tôm thịt',
      'Nộm đu đủ bò khô',
      'Rau muống xào tỏi',
      'Súp bí đỏ',
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
      'Cháo đậu xanh',
      'Gỏi cuốn chay',
      'Canh rau ngót thịt bằm',
      'Gỏi ngó sen tôm thịt',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.25,
      MEAL_LUNCH: 0.45,
      MEAL_DINNER: 0.30,
      MEAL_SNACK: 0.0,
    },
    count: 12,
  },
  // Cluster B — Duy trì cân: ưa phở, bún nước, mì
  B: {
    goal: 'GOAL_MAINTAIN',
    preferredFoods: [
      'Phở bò tái',
      'Bún bò Huế',
      'Phở gà',
      'Phở bò chín',
      'Mì Quảng',
      'Hủ tiếu Nam Vang',
      'Bún riêu cua',
      'Bún thịt nướng',
      'Cao lầu Hội An',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.5,
      MEAL_LUNCH: 0.4,
      MEAL_DINNER: 0.1,
      MEAL_SNACK: 0.0,
    },
    count: 12,
  },
  // Cluster C — Tăng cân: ưa cơm, thịt nướng, món giàu protein
  C: {
    goal: 'GOAL_GAIN',
    preferredFoods: [
      'Cơm tấm sườn bì chả',
      'Gà nướng lá chanh',
      'Bò lúc lắc',
      'Cơm gà Hội An',
      'Cơm gà xối mỡ',
      'Cơm sườn nướng mật ong',
      'Sườn nướng mật ong',
      'Bún thịt nướng',
      'Thịt kho tàu',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.15,
      MEAL_LUNCH: 0.5,
      MEAL_DINNER: 0.35,
      MEAL_SNACK: 0.0,
    },
    count: 12,
  },
  // Cluster D — Ăn vặt & ăn sáng: bánh, xôi, chè
  D: {
    goal: 'GOAL_MAINTAIN',
    preferredFoods: [
      'Bánh cuốn nhân thịt',
      'Xôi gà',
      'Xôi xéo',
      'Bánh mì thịt nguội',
      'Bánh bao nhân thịt',
      'Chè đậu đỏ',
      'Chè trôi nước',
      'Bánh bèo',
      'Bánh tráng trộn',
      'Bánh flan',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.4,
      MEAL_LUNCH: 0.1,
      MEAL_DINNER: 0.0,
      MEAL_SNACK: 0.5,
    },
    count: 9,
  },
  // Cluster E — Ăn kiêng nghiêm: canh, rau, cháo loãng
  E: {
    goal: 'GOAL_STRICT',
    preferredFoods: [
      'Canh chua cá',
      'Rau muống xào tỏi',
      'Súp bí đỏ',
      'Gỏi gà bắp cải',
      'Canh khổ qua dồn thịt',
      'Gỏi cuốn chay',
      'Canh rau ngót thịt bằm',
      'Cháo gà',
    ],
    mealDist: {
      MEAL_BREAKFAST: 0.25,
      MEAL_LUNCH: 0.45,
      MEAL_DINNER: 0.30,
      MEAL_SNACK: 0.0,
    },
    count: 5,
  },
};

// ─── AFFINITY SEED (global — for foods NOT in any cluster preferred list) ─────
const MEAL_AFFINITY_SEED: Record<string, Record<string, number>> = {
  'Phở bò tái':           { MEAL_BREAKFAST: 65, MEAL_LUNCH: 25, MEAL_DINNER:  5, MEAL_SNACK:  5 },
  'Bún bò Huế':           { MEAL_BREAKFAST: 55, MEAL_LUNCH: 35, MEAL_DINNER:  5, MEAL_SNACK:  5 },
  'Phở gà':               { MEAL_BREAKFAST: 60, MEAL_LUNCH: 30, MEAL_DINNER:  5, MEAL_SNACK:  5 },
  'Cháo gà':              { MEAL_BREAKFAST: 80, MEAL_LUNCH:  5, MEAL_DINNER:  5, MEAL_SNACK: 10 },
  'Cháo lòng':            { MEAL_BREAKFAST: 75, MEAL_LUNCH: 10, MEAL_DINNER:  5, MEAL_SNACK: 10 },
  'Xôi gà':               { MEAL_BREAKFAST: 75, MEAL_LUNCH:  5, MEAL_DINNER:  5, MEAL_SNACK: 15 },
  'Bánh mì thịt nguội':   { MEAL_BREAKFAST: 70, MEAL_LUNCH: 20, MEAL_DINNER:  5, MEAL_SNACK:  5 },
  'Cơm tấm sườn bì chả':  { MEAL_BREAKFAST:  5, MEAL_LUNCH: 55, MEAL_DINNER: 38, MEAL_SNACK:  2 },
  'Bò lúc lắc':           { MEAL_BREAKFAST:  5, MEAL_LUNCH: 30, MEAL_DINNER: 60, MEAL_SNACK:  5 },
  'Gà nướng lá chanh':    { MEAL_BREAKFAST:  5, MEAL_LUNCH: 25, MEAL_DINNER: 65, MEAL_SNACK:  5 },
  'Chè đậu đỏ':           { MEAL_BREAKFAST:  5, MEAL_LUNCH:  5, MEAL_DINNER:  5, MEAL_SNACK: 85 },
  'Chè trôi nước':        { MEAL_BREAKFAST:  5, MEAL_LUNCH:  5, MEAL_DINNER:  5, MEAL_SNACK: 85 },
  'Trà sữa trân châu':    { MEAL_BREAKFAST:  0, MEAL_LUNCH:  5, MEAL_DINNER:  5, MEAL_SNACK: 90 },
  'Sinh tố bơ':           { MEAL_BREAKFAST: 15, MEAL_LUNCH:  5, MEAL_DINNER:  5, MEAL_SNACK: 75 },
  'Nước mía':             { MEAL_BREAKFAST:  5, MEAL_LUNCH: 20, MEAL_DINNER:  5, MEAL_SNACK: 70 },
  'Cà phê sữa đá':        { MEAL_BREAKFAST: 50, MEAL_LUNCH: 20, MEAL_DINNER:  5, MEAL_SNACK: 25 },
  'Bánh tráng trộn':      { MEAL_BREAKFAST:  5, MEAL_LUNCH: 10, MEAL_DINNER:  5, MEAL_SNACK: 80 },
  'Lẩu thái hải sản':     { MEAL_BREAKFAST:  0, MEAL_LUNCH: 10, MEAL_DINNER: 88, MEAL_SNACK:  2 },
  'Lẩu bò nhúng dấm':     { MEAL_BREAKFAST:  0, MEAL_LUNCH: 10, MEAL_DINNER: 88, MEAL_SNACK:  2 },
  'Bún ốc':               { MEAL_BREAKFAST: 60, MEAL_LUNCH: 30, MEAL_DINNER:  5, MEAL_SNACK:  5 },
  'Cháo bò':              { MEAL_BREAKFAST: 70, MEAL_LUNCH: 15, MEAL_DINNER: 10, MEAL_SNACK:  5 },
};

// All preferred food names across all clusters (to exclude from Phase 6)
const ALL_CLUSTER_PREFERRED = new Set(
  Object.values(CLUSTER_CONFIG).flatMap((c) => c.preferredFoods),
);

// ─── TOP POPULAR FOOD NAMES (for popularity boost) ────────────────────────────
const TOP_POPULAR_FOOD_NAMES = [
  'Phở bò tái',
  'Phở gà',
  'Bún bò Huế',
  'Cơm tấm sườn bì chả',
  'Mì Quảng',
  'Hủ tiếu Nam Vang',
  'Cơm chiên dương châu',
  'Xôi gà',
  'Bánh mì thịt nguội',
  'Cơm gà Hội An',
  'Xôi xéo',
  'Bún thịt nướng',
  'Gà nướng lá chanh',
  'Bò lúc lắc',
  'Gỏi cuốn tôm thịt',
  'Nộm đu đủ bò khô',
  'Gỏi gà bắp cải',
  'Bánh cuốn nhân thịt',
  'Nem rán (chả giò)',
  'Bún riêu cua',
  'Cháo gà',
  'Cháo lòng',
  'Chè đậu đỏ',
  'Sinh tố bơ',
  'Bánh tráng trộn',
  'Lẩu thái hải sản',
  'Lẩu bò nhúng dấm',
  'Cao lầu Hội An',
  'Bún mắm',
  'Cơm gà xối mỡ',
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function noise(pct = 0.05): number {
  return 1 + (Math.random() * 2 - 1) * pct;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateOnly(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

async function getOrCreateDailyLog(
  prisma: PrismaService,
  userId: number,
  logDate: Date,
) {
  const date = dateOnly(logDate);
  return prisma.dailyLog.upsert({
    where: { userId_logDate: { userId, logDate: date } },
    update: {},
    create: { userId, logDate: date, status: 'STATUS_BELOW' },
  });
}

async function createMealWithItems(
  prisma: PrismaService,
  userId: number,
  logDate: Date,
  mealType: string,
  items: {
    foodId: number;
    qty?: number;
  }[],
) {
  const log = await getOrCreateDailyLog(prisma, userId, logDate);
  const meal = await prisma.meal.create({
    data: { dailyLogId: log.id, mealType, mealDateTime: logDate },
  });

  for (const item of items) {
    // Lấy thông tin food + nutrition profile
    const food = await prisma.food.findUnique({
      where: { id: item.foodId },
      include: {
        nutritionProfile: {
          include: { values: { include: { nutrient: true } } },
        },
      },
    });

    if (!food?.nutritionProfile) {
      console.warn(`Food ${item.foodId} không có nutrition profile`);
      continue;
    }

    const quantity = item.qty ?? 1.0;
    const defaultGrams = food.defaultServingGrams ?? 100;
    const grams = quantity * defaultGrams;

    // Tạo map nutrient → value per 100g
    const nutrientMap: Record<string, number> = {};
    food.nutritionProfile.values.forEach((v) => {
      nutrientMap[v.nutrient.name] = v.value;
    });

    const scale = grams / 100;

    await prisma.mealItem.create({
      data: {
        mealId: meal.id,
        foodId: item.foodId,
        quantity,
        grams, // ← đúng schema mới
        calories:
          Math.round((nutrientMap['Calories'] || 0) * scale * 100) / 100,
        protein: Math.round((nutrientMap['Protein'] || 0) * scale * 100) / 100,
        carbs:
          Math.round((nutrientMap['Carbohydrates'] || 0) * scale * 100) / 100,
        fat: Math.round((nutrientMap['Fat'] || 0) * scale * 100) / 100,
        fiber: Math.round((nutrientMap['Fiber'] || 0) * scale * 100) / 100,
      },
    });
  }
  return meal;
}

// ─── MAIN SEED ────────────────────────────────────────────────────────────────

async function runControlledSeed() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);

  console.log('Starting Controlled Seed (v2)...');

  // Pre-hash password for all users
  const hashedPassword = await bcrypt.hash('123456', 10);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 0: Admin User
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 0: Admin user...');
    await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: { password: hashedPassword, isAdmin: true },
      create: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        fullName: 'Admin',
        isAdmin: true,
        status: true,
      },
    });
    console.log('Phase 0 done — admin user seeded (admin@admin.com / 123456)');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Master Data
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 1: Master Data...');

    for (const n of NUTRIENTS) {
      await prisma.nutrient.upsert({
        where: { name: n.name },
        update: {},
        create: n as any,
      });
    }
    const dbNutrients = await prisma.nutrient.findMany();
    const NUTRIENT_ID: Record<string, number> = Object.fromEntries(
      dbNutrients.map((n) => [n.name, n.id]),
    );

    for (const allergen of ALLERGENS) {
      await prisma.allergen.upsert({
        where: { name: allergen.name },
        update: { imageUrl: allergen.imageUrl },
        create: { name: allergen.name, imageUrl: allergen.imageUrl },
      });
    }
    const dbAllergens = await prisma.allergen.findMany();
    const ALLERGEN_ID: Record<string, number> = Object.fromEntries(
      dbAllergens.map((a) => [a.name, a.id]),
    );

    for (const name of CATEGORY_NAMES) {
      await prisma.foodCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const dbCategories = await prisma.foodCategory.findMany();
    const CATEGORY_ID: Record<string, number> = Object.fromEntries(
      dbCategories.map((c) => [c.name, c.id]),
    );

    console.log('Phase 1 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Foods (65 fixed)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 2: Foods (65 fixed)...');

    const FOOD_ID: Record<string, number> = {};
    const newItemDate = daysAgo(2);

    for (const f of FOODS_FIXED) {
      const existing = await prisma.food.findFirst({
        where: { foodName: f.foodName },
      });
      let food: { id: number };
      if (existing) {
        food = existing;
        // Update classKey if provided and not yet set
        if ((f as any).classKey && !(existing as any).classKey) {
          await prisma.food.update({
            where: { id: existing.id },
            data: { classKey: (f as any).classKey },
          });
        }
      } else {
        food = await prisma.food.create({
          data: {
            foodName: f.foodName,
            classKey: (f as any).classKey ?? null,
            categoryId: CATEGORY_ID[f.cat] ?? null,
            defaultServingGrams: f.defaultServingGrams,
            createdAt: (f as any).isNew ? newItemDate : undefined,
            nutritionProfile: {
              create: {
                source: 'SRC_MANUAL',
                values: {
                  create: [
                    { nutrientId: NUTRIENT_ID['Calories'], value: f.cal },
                    { nutrientId: NUTRIENT_ID['Protein'], value: f.pro },
                    { nutrientId: NUTRIENT_ID['Carbohydrates'], value: f.carb },
                    { nutrientId: NUTRIENT_ID['Fat'], value: f.fat },
                    { nutrientId: NUTRIENT_ID['Fiber'], value: f.fib },
                  ],
                },
              },
            },
          },
        });
      }
      FOOD_ID[f.foodName] = food.id;
    }

    console.log(`Phase 2 done — ${Object.keys(FOOD_ID).length} foods`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Ingredients + Allergen Links
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 3: Ingredient allergen links...');

    // Create one ingredient per allergen type, then link to relevant foods
    const INGREDIENT_CATALOG: { name: string; imageUrl: string | null }[] = [
      {
        name: 'Trứng',
        imageUrl: 'https://cdn-www.vinid.net/1e221266-shutterstock_113786020-1.jpg',
      },
      {
        name: 'Hải sản có vỏ',
        imageUrl: 'https://bizweb.dktcdn.net/100/308/217/files/ngeu-so-oc-2658fd77-40c5-4180-a570-c2d5feae6c14.png?v=1532577721623',
      },
      {
        name: 'Cá',
        imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_3_25_638469367754094619_ca-song.jpg',
      },
      {
        name: 'Gluten',
        imageUrl: 'https://chefjob.vn/wp-content/uploads/2020/03/gluten-la-gi.jpg',
      },
      {
        name: 'Sữa',
        imageUrl: 'https://file.hstatic.net/1000276446/file/20200516_090815_108358_sua.max-800x800_3c3ab99581d1422bb25ae9a153a15706_grande.jpg',
      },
      {
        name: 'Đậu phộng',
        imageUrl: 'https://hatgiongphuongnam.com/asset/upload/image/hat-giong-dau-phong_(2).jpg?v=20190410',
      },
      {
        name: 'Tôm',
        imageUrl: 'https://product.hstatic.net/1000182631/product/resize_anh-5273-8_90c0dbcc949944738551635fe608e950.png',
      },
      {
        name: 'Cua',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Blue_crab_on_market_in_Piraeus_-_Callinectes_sapidus_Rathbun_20020819-317.jpg',
      },
      {
        name: 'Mè (vừng)',
        imageUrl: 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2023/9/26/cong-dung-tuyet-voi-cua-hat-vung-doi-voi-suc-khoe-169570229736928962296.jpeg',
      },
      {
        name: 'Đậu nành',
        imageUrl: 'https://file.hstatic.net/200000700229/article/lam-sua-dau-nanh-edamame-1_ee4d70ee58ec4f82a7f56ce24e9d8ed1.jpg',
      },
    ];

    const INGREDIENT_ID: Record<string, number> = {};
    for (const ing of INGREDIENT_CATALOG) {
      let existing = await prisma.ingredient.findFirst({
        where: { ingredientName: ing.name },
      });
      if (!existing) {
        existing = await prisma.ingredient.create({
          data: { ingredientName: ing.name, imageUrl: ing.imageUrl },
        });
        await prisma.ingredientAllergen.create({
          data: { ingredientId: existing.id, allergenId: ALLERGEN_ID[ing.name] },
        });
      } else {
        await prisma.ingredient.update({
          where: { id: existing.id },
          data: { imageUrl: ing.imageUrl },
        });
      }
      INGREDIENT_ID[ing.name] = existing.id;
    }

    // Seed ingredient nutrition (per 100g)
    const INGREDIENT_NUTRITION: Record<
      string,
      { cal: number; pro: number; carb: number; fat: number; fib: number }
    > = {
      'Trứng':          { cal: 155, pro: 13.0, carb: 1.1,  fat: 11.0, fib: 0.0 },
      'Hải sản có vỏ':  { cal: 79,  pro: 16.4, carb: 4.7,  fat: 0.6,  fib: 0.0 },
      'Cá':             { cal: 84,  pro: 18.4, carb: 0.0,  fat: 1.1,  fib: 0.0 },
      'Gluten':         { cal: 370, pro: 75.0, carb: 14.0, fat: 2.0,  fib: 0.6 },
      'Sữa':            { cal: 61,  pro: 3.2,  carb: 4.8,  fat: 3.3,  fib: 0.0 },
      'Đậu phộng':      { cal: 567, pro: 25.8, carb: 16.1, fat: 49.2, fib: 8.5 },
      'Tôm':            { cal: 99,  pro: 24.0, carb: 0.2,  fat: 0.3,  fib: 0.0 },
      'Cua':            { cal: 87,  pro: 18.1, carb: 0.0,  fat: 1.1,  fib: 0.0 },
      'Mè (vừng)':      { cal: 573, pro: 17.7, carb: 23.5, fat: 49.7, fib: 11.8 },
      'Đậu nành':       { cal: 446, pro: 36.5, carb: 30.2, fat: 19.9, fib: 9.3 },
    };

    for (const [ingName, nutr] of Object.entries(INGREDIENT_NUTRITION)) {
      const ingId = INGREDIENT_ID[ingName];
      if (!ingId) continue;

      const existing = await prisma.ingredientNutrition.findFirst({
        where: { ingredientId: ingId },
      });

      if (!existing) {
        await prisma.ingredientNutrition.create({
          data: {
            ingredientId: ingId,
            servingSize: 100,
            servingUnit: 'UNIT_G',
            source: 'SRC_MANUAL',
            values: {
              create: [
                { nutrientId: NUTRIENT_ID['Calories'],      value: nutr.cal  },
                { nutrientId: NUTRIENT_ID['Protein'],       value: nutr.pro  },
                { nutrientId: NUTRIENT_ID['Carbohydrates'], value: nutr.carb },
                { nutrientId: NUTRIENT_ID['Fat'],           value: nutr.fat  },
                { nutrientId: NUTRIENT_ID['Fiber'],         value: nutr.fib  },
              ],
            },
          },
        });
      } else {
        // Update each nutrition value so re-runs stay in sync
        for (const [key, val] of [
          ['Calories', nutr.cal],
          ['Protein', nutr.pro],
          ['Carbohydrates', nutr.carb],
          ['Fat', nutr.fat],
          ['Fiber', nutr.fib],
        ] as [string, number][]) {
          await prisma.nutritionValue.updateMany({
            where: {
              ingredientNutritionId: existing.id,
              nutrientId: NUTRIENT_ID[key],
            },
            data: { value: val },
          });
        }
      }
    }

    // Link ingredients to foods based on allergen list in FOODS_FIXED
    for (const f of FOODS_FIXED) {
      const foodId = FOOD_ID[f.foodName];
      if (!foodId) continue;
      for (const allergenName of f.allergens) {
        const ingId = INGREDIENT_ID[allergenName];
        if (!ingId) continue;
        const exists = await prisma.foodIngredient.findFirst({
          where: { foodId, ingredientId: ingId },
        });
        if (!exists) {
          await prisma.foodIngredient.create({
            data: { foodId, ingredientId: ingId, quantityGrams: 10 },
          });
        }
      }
    }

    console.log('Phase 3 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Special Users SC01–SC10
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 4: Special users SC01–SC10...');

    // Helper: upsert user with profile + goal
    async function upsertSpecialUser(opts: {
      email: string;
      fullName: string;
      goalType: string;
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      targetFiber: number;
      targetWeight?: number;
      age?: number;
      weight?: number;
    }) {
      const goal = GOAL_CONFIG[opts.goalType as keyof typeof GOAL_CONFIG];
      return prisma.user.upsert({
        where: { email: opts.email },
        update: {},
        create: {
          email: opts.email,
          password: hashedPassword,
          fullName: opts.fullName,
          userProfile: {
            create: {
              age: opts.age ?? 28,
              height: 168,
              weight: opts.weight ?? 65,
              bmi: 23.0,
              bmr: 1550,
              tdee: 2000,
              gender: 'MALE',
              activityLevel: 'ACT_MODERATE',
            },
          },
          nutritionGoals: {
            create: {
              goalType: opts.goalType,
              status: 'NUTR_GOAL_ONGOING',
              targetWeight: opts.targetWeight ?? goal.targetWeight,
              targetCalories: opts.targetCalories,
              targetProtein: opts.targetProtein,
              targetCarbs: opts.targetCarbs,
              targetFat: opts.targetFat,
              targetFiber: opts.targetFiber,
              startDate: daysAgo(30),
              endDate: daysAgo(-30),
            },
          },
        },
      });
    }

    // Helper: seed meals to reach a consumed target (greedy food fill)
    async function seedConsumedMeals(
      userId: number,
      mealType: string,
      targetCal: number,
      foodPool: string[],
    ) {
      let totalCal = 0;
      const items: any[] = [];
      for (const fname of foodPool) {
        if (totalCal >= targetCal * 0.95) break;
        const fid = FOOD_ID[fname];
        if (!fid) continue;
        const fd = FOODS_FIXED.find((f) => f.foodName === fname);
        if (!fd || fd.cal === 0) continue;
        const qty = Math.max(
          0.5,
          Math.min(2.0, (targetCal - totalCal) / fd.cal),
        );
        items.push({
          foodId: fid,
          qty,
        });
        totalCal += fd.cal * qty;
      }
      if (items.length > 0) {
        await createMealWithItems(prisma, userId, new Date(), mealType, items);
      }
    }

    // Helper: seed past logs for total_logs count
    async function seedPastLogs(
      userId: number,
      count: number,
      foodNames: string[],
    ) {
      for (let d = 1; d <= count; d++) {
        const date = daysAgo(d);
        for (const mt of ['MEAL_BREAKFAST', 'MEAL_LUNCH', 'MEAL_DINNER']) {
          const fname = foodNames[d % foodNames.length];
          const fid = FOOD_ID[fname];
          if (!fid) continue;
          const fd = FOODS_FIXED.find((f) => f.foodName === fname)!;
          await createMealWithItems(prisma, userId, date, mt, [
            { foodId: fid, qty: 1 },
          ]);
        }
      }
    }

    // ────────────────────────────────────────────────────────────────────
    // SC01 — Nữ 25t, giảm cân, ăn nhẹ buổi sáng, ưa salad & cháo
    // Kịch bản: sinh viên văn phòng, lo calo, không dị ứng
    const sc01 = await upsertSpecialUser({
      email: 'sc01@seed.test',
      fullName: 'Nguyễn Thị Lan',
      goalType: 'GOAL_LOSS',
      targetCalories: 1500,
      targetProtein: 110,
      targetCarbs: 150,
      targetFat: 45,
      targetFiber: 28,
      age: 25,
      weight: 62,
    });
    await seedConsumedMeals(sc01.id, 'MEAL_BREAKFAST', 300, [
      'Cháo gà', 'Cháo đậu xanh',
    ]);
    await seedConsumedMeals(sc01.id, 'MEAL_LUNCH', 450, [
      'Gỏi gà bắp cải', 'Canh khổ qua dồn thịt', 'Rau muống xào tỏi',
    ]);
    await seedConsumedMeals(sc01.id, 'MEAL_DINNER', 250, [
      'Gỏi cuốn chay', 'Súp bí đỏ',
    ]);
    await seedPastLogs(sc01.id, 5, [
      'Phở gà', 'Gỏi gà bắp cải', 'Cháo gà', 'Nộm đu đủ bò khô',
    ]);

    // SC02 — Nam 32t, duy trì cân, dị ứng tôm & cá nặng
    // Kịch bản: nhân viên IT, ăn trưa ngoài, tránh hải sản
    const sc02 = await upsertSpecialUser({
      email: 'sc02@seed.test',
      fullName: 'Trần Văn Khoa',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2100,
      targetProtein: 110,
      targetCarbs: 260,
      targetFat: 68,
      targetFiber: 25,
      age: 32,
      weight: 72,
    });
    await seedConsumedMeals(sc02.id, 'MEAL_BREAKFAST', 400, [
      'Phở gà', 'Cháo gà',
    ]);
    await seedConsumedMeals(sc02.id, 'MEAL_LUNCH', 500, [
      'Bò lúc lắc', 'Cơm tấm sườn bì chả',
    ]);
    await seedConsumedMeals(sc02.id, 'MEAL_DINNER', 400, [
      'Gà nướng lá chanh', 'Rau muống xào tỏi', 'Canh rau ngót thịt bằm',
    ]);
    for (const allergenName of ['Tôm', 'Cá']) {
      await prisma.userAllergy.upsert({
        where: { userId_allergenId: { userId: sc02.id, allergenId: ALLERGEN_ID[allergenName] } },
        update: {},
        create: { userId: sc02.id, allergenId: ALLERGEN_ID[allergenName], severity: 'SEV_HIGH' },
      });
    }
    await seedPastLogs(sc02.id, 80, [
      'Phở bò tái', 'Phở gà', 'Bò lúc lắc', 'Gà nướng lá chanh',
    ]);

    // SC03 — Nam 28t, duy trì cân, ăn lặp lại nhiều (test repeat penalty)
    // Kịch bản: người thích ăn quen, ăn phở sáng 3 ngày liên tiếp
    const sc03 = await upsertSpecialUser({
      email: 'sc03@seed.test',
      fullName: 'Lê Minh Đức',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2000,
      targetProtein: 100,
      targetCarbs: 250,
      targetFat: 65,
      targetFiber: 22,
      age: 28,
      weight: 68,
    });
    await seedConsumedMeals(sc03.id, 'MEAL_BREAKFAST', 450, ['Phở gà']);
    await seedConsumedMeals(sc03.id, 'MEAL_LUNCH', 400, [
      'Gỏi gà bắp cải', 'Rau muống xào tỏi',
    ]);
    for (let i = 0; i < 3; i++) {
      await createMealWithItems(prisma, sc03.id, daysAgo(i + 1), 'MEAL_BREAKFAST', [
        { foodId: FOOD_ID['Phở bò tái'], qty: 1 },
      ]);
    }
    for (let i = 0; i < 2; i++) {
      await createMealWithItems(prisma, sc03.id, daysAgo(i + 4), 'MEAL_BREAKFAST', [
        { foodId: FOOD_ID['Bún bò Huế'], qty: 1 },
      ]);
    }
    await seedPastLogs(sc03.id, 90, [
      'Phở bò tái', 'Bún bò Huế', 'Phở gà', 'Gà nướng lá chanh',
    ]);

    // SC04 — Nữ 22t, duy trì cân, cold-start (chưa có lịch sử ăn)
    // Kịch bản: người dùng mới đăng ký → test popular fallback
    await upsertSpecialUser({
      email: 'sc04@seed.test',
      fullName: 'Phạm Ngọc Mai',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 1900,
      targetProtein: 95,
      targetCarbs: 240,
      targetFat: 62,
      targetFiber: 24,
      age: 22,
      weight: 55,
    });
    // Không seed meal → test cold-start popular fallback

    // SC05 — Nam 40t, duy trì cân, lịch sử ăn trưa ít
    // Kịch bản: người bận rộn, bỏ bữa thường xuyên → test affinity threshold
    const sc05 = await upsertSpecialUser({
      email: 'sc05@seed.test',
      fullName: 'Hoàng Văn Tùng',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2200,
      targetProtein: 115,
      targetCarbs: 270,
      targetFat: 72,
      targetFiber: 22,
      age: 40,
      weight: 78,
    });
    await seedPastLogs(sc05.id, 10, ['Phở gà', 'Cơm tấm sườn bì chả']);

    // SC06 — Nữ 30t, giảm cân, ăn đủ 3 bữa, muốn gợi ý món mới
    // Kịch bản: người chăm chỉ log food, đã ăn nhiều → test new item injection
    const sc06 = await upsertSpecialUser({
      email: 'sc06@seed.test',
      fullName: 'Vũ Thị Hồng',
      goalType: 'GOAL_LOSS',
      targetCalories: 1600,
      targetProtein: 120,
      targetCarbs: 160,
      targetFat: 50,
      targetFiber: 28,
      age: 30,
      weight: 67,
    });
    await seedConsumedMeals(sc06.id, 'MEAL_BREAKFAST', 380, [
      'Cháo gà', 'Cháo đậu xanh',
    ]);
    await seedConsumedMeals(sc06.id, 'MEAL_LUNCH', 450, [
      'Gỏi gà bắp cải', 'Canh khổ qua dồn thịt',
    ]);
    await seedConsumedMeals(sc06.id, 'MEAL_DINNER', 350, [
      'Gỏi cuốn tôm thịt', 'Rau muống xào tỏi',
    ]);
    await seedPastLogs(sc06.id, 15, [
      'Phở gà', 'Gỏi gà bắp cải', 'Rau muống xào tỏi', 'Cháo gà',
    ]);

    // SC07 — Nữ 26t, duy trì cân, thích ăn vặt buổi sáng (Bánh & Xôi nhiều)
    // Kịch bản: test diversity rerank — tránh recommend toàn 1 category
    const sc07 = await upsertSpecialUser({
      email: 'sc07@seed.test',
      fullName: 'Đinh Thị Quỳnh',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 1950,
      targetProtein: 98,
      targetCarbs: 245,
      targetFat: 64,
      targetFiber: 23,
      age: 26,
      weight: 53,
    });
    const banhXoiFoods = [
      'Bánh cuốn nhân thịt', 'Xôi gà', 'Xôi xéo',
      'Bánh bèo', 'Bánh tráng nướng', 'Bánh ướt', 'Bánh khọt',
    ];
    for (let d = 1; d <= 20; d++) {
      const fname = banhXoiFoods[d % banhXoiFoods.length];
      const fid = FOOD_ID[fname];
      if (!fid) continue;
      await createMealWithItems(prisma, sc07.id, daysAgo(d), 'MEAL_BREAKFAST', [
        { foodId: fid, qty: 1 },
      ]);
    }

    // SC08 — Nam 35t, duy trì cân, ưa phở & bún nước (Cluster B)
    // Kịch bản: người miền Bắc, ăn sáng phở/bún, trưa cơm
    const sc08 = await upsertSpecialUser({
      email: 'sc08@seed.test',
      fullName: 'Ngô Đình Huy',
      goalType: 'GOAL_MAINTAIN',
      targetCalories: 2100,
      targetProtein: 105,
      targetCarbs: 260,
      targetFat: 68,
      targetFiber: 24,
      age: 35,
      weight: 73,
    });
    await seedConsumedMeals(sc08.id, 'MEAL_BREAKFAST', 500, [
      'Phở bò tái', 'Phở gà',
    ]);
    await seedConsumedMeals(sc08.id, 'MEAL_LUNCH', 500, [
      'Bún bò Huế', 'Bún riêu cua',
    ]);
    await seedConsumedMeals(sc08.id, 'MEAL_DINNER', 300, ['Hủ tiếu Nam Vang']);
    await seedPastLogs(sc08.id, 85, [
      'Phở bò tái', 'Bún bò Huế', 'Phở gà', 'Mì Quảng', 'Hủ tiếu Nam Vang',
    ]);

    // SC09 — Nam 22t, tăng cân (gym), ăn nhiều protein, không dị ứng
    // Kịch bản: sinh viên tập gym, cần calo cao & protein
    const sc09 = await upsertSpecialUser({
      email: 'sc09@seed.test',
      fullName: 'Bùi Quốc Toản',
      goalType: 'GOAL_GAIN',
      targetCalories: 2800,
      targetProtein: 165,
      targetCarbs: 340,
      targetFat: 88,
      targetFiber: 22,
      age: 22,
      weight: 65,
    });
    await seedConsumedMeals(sc09.id, 'MEAL_BREAKFAST', 700, [
      'Xôi gà', 'Cháo bò', 'Trứng hấp thịt bằm',
    ]);
    await seedConsumedMeals(sc09.id, 'MEAL_LUNCH', 900, [
      'Cơm tấm sườn bì chả', 'Gà nướng lá chanh', 'Bò lúc lắc',
    ]);
    await seedConsumedMeals(sc09.id, 'MEAL_DINNER', 700, [
      'Cơm gà Hội An', 'Sườn nướng mật ong',
    ]);
    await seedPastLogs(sc09.id, 60, [
      'Cơm tấm sườn bì chả', 'Gà nướng lá chanh', 'Bò lúc lắc',
      'Xôi gà', 'Cơm sườn nướng mật ong',
    ]);

    // SC10 — Nữ 45t, ăn kiêng nghiêm ngặt (bệnh lý), calo thấp, fiber cao
    // Kịch bản: người bệnh tiểu đường, chỉ ăn canh rau ít calo
    const sc10 = await upsertSpecialUser({
      email: 'sc10@seed.test',
      fullName: 'Lý Thị Bình',
      goalType: 'GOAL_STRICT',
      targetCalories: 1400,
      targetProtein: 125,
      targetCarbs: 130,
      targetFat: 42,
      targetFiber: 35,
      age: 45,
      weight: 60,
    });
    await seedConsumedMeals(sc10.id, 'MEAL_BREAKFAST', 350, [
      'Cháo gà', 'Gỏi cuốn chay',
    ]);
    await seedConsumedMeals(sc10.id, 'MEAL_LUNCH', 480, [
      'Canh chua cá', 'Gỏi gà bắp cải', 'Canh khổ qua dồn thịt',
    ]);
    await seedConsumedMeals(sc10.id, 'MEAL_DINNER', 280, [
      'Rau muống xào tỏi', 'Súp bí đỏ', 'Canh rau ngót thịt bằm',
    ]);
    await seedPastLogs(sc10.id, 75, [
      'Canh khổ qua dồn thịt', 'Gỏi gà bắp cải',
      'Rau muống xào tỏi', 'Gỏi cuốn chay', 'Súp bí đỏ',
    ]);

    console.log('Phase 4 done — special users SC01–SC10');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Cluster Users (50)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 5: Cluster users...');

    let clusterUserIdx = 0;
    const clusterUsers: {
      userId: number;
      cluster: string;
      preferredFoods: string[];
      mealDist: Record<string, number>;
      logCount: number;
    }[] = [];

    for (const [clusterKey, cfg] of Object.entries(CLUSTER_CONFIG)) {
      for (let i = 0; i < cfg.count; i++) {
        const email = `cluster_${clusterKey.toLowerCase()}_${String(clusterUserIdx).padStart(3, '0')}@seed.test`;
        const isHeavy = i < Math.floor(cfg.count * 0.5); // 50% heavy, 50% moderate
        const tier = isHeavy ? 'heavy' : 'moderate';
        const logCount =
          tier === 'heavy'
            ? 61 + Math.floor(Math.random() * 60)
            : 10 + Math.floor(Math.random() * 30);
        const goalCfg = GOAL_CONFIG[cfg.goal as keyof typeof GOAL_CONFIG];

        const u = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            password: hashedPassword,
            fullName: `Cluster ${clusterKey} User ${clusterUserIdx}`,
            userProfile: {
              create: {
                age: 22 + Math.floor(Math.random() * 20),
                height: 155 + Math.random() * 25,
                weight: 48 + Math.random() * 40,
                bmi: 21 + Math.random() * 5,
                bmr: 1400 + Math.random() * 400,
                tdee: 1800 + Math.random() * 600,
                gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
                activityLevel: 'ACT_MODERATE',
              },
            },
            nutritionGoals: {
              create: {
                goalType: cfg.goal,
                status: 'NUTR_GOAL_ONGOING',
                targetWeight: goalCfg.targetWeight * noise(0.02),
                targetCalories: goalCfg.calories * noise(0.05),
                targetProtein: goalCfg.protein * noise(0.05),
                targetCarbs: goalCfg.carbs * noise(0.05),
                targetFat: goalCfg.fat * noise(0.05),
                targetFiber: goalCfg.fiber * noise(0.05),
                startDate: daysAgo(30),
                endDate: daysAgo(-30),
              },
            },
          },
        });
        clusterUsers.push({
          userId: u.id,
          cluster: clusterKey,
          preferredFoods: cfg.preferredFoods,
          mealDist: cfg.mealDist,
          logCount,
        });
        clusterUserIdx++;
      }
    }

    console.log(`Phase 5 done — ${clusterUsers.length} cluster users`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6: Affinity History (NON-cluster-preferred foods only)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 6: Affinity signal (non-cluster foods)...');

    // Create a small pool of "affinity seeder" users (cold-start, no cluster)
    const affinityUsersCount = 10;
    const affinityUserIds: number[] = [];
    for (let i = 0; i < affinityUsersCount; i++) {
      const email = `affinity_pool_${String(i).padStart(3, '0')}@seed.test`;
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          fullName: `Affinity Pool ${i}`,
          userProfile: {
            create: {
              age: 25,
              height: 165,
              weight: 60,
              bmi: 22,
              bmr: 1500,
              tdee: 2000,
              activityLevel: 'ACT_SEDENTARY',
            },
          },
        },
      });
      affinityUserIds.push(u.id);
    }

    // For each food in MEAL_AFFINITY_SEED that is NOT in cluster preferred list, seed meal items
    for (const [foodName, mealCounts] of Object.entries(MEAL_AFFINITY_SEED)) {
      if (ALL_CLUSTER_PREFERRED.has(foodName)) continue; // Skip — Phase 7 handles these

      const fid = FOOD_ID[foodName];
      if (!fid) continue;
      const fd = FOODS_FIXED.find((f) => f.foodName === foodName)!;
      if (!fd) continue;

      let dayOffset = 1;
      for (const [mtStr, count] of Object.entries(mealCounts)) {
        const mt = mtStr;
        for (let n = 0; n < count; n++) {
          const uid = affinityUserIds[n % affinityUserIds.length];
          await createMealWithItems(prisma, uid, daysAgo(dayOffset), mt, [
            { foodId: fid, qty: 1 },
          ]);
          dayOffset++;
        }
      }
    }

    console.log('Phase 6 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 7: Cluster History (preferred foods — CF signal)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 7: Cluster history (CF signal)...');

    for (const cu of clusterUsers) {
      const allFoodNames = Object.keys(FOOD_ID);
      const otherFoods = allFoodNames.filter(
        (fn) => !cu.preferredFoods.includes(fn) && FOOD_ID[fn],
      );

      for (let d = 1; d <= cu.logCount; d++) {
        const logDate = daysAgo(d);
        // Determine meal types for this day based on mealDist
        const mealTypesToSeed: string[] = [];
        for (const [mt, prob] of Object.entries(cu.mealDist)) {
          if (prob > 0 && Math.random() < prob * 2) mealTypesToSeed.push(mt);
        }
        if (mealTypesToSeed.length === 0) mealTypesToSeed.push('MEAL_LUNCH');

        for (const mt of mealTypesToSeed) {
          // 70% from preferred foods, 30% from others
          const usePreferred = Math.random() < 0.7;
          const pool =
            usePreferred && cu.preferredFoods.length > 0
              ? cu.preferredFoods
              : otherFoods;
          const foodName = pool[Math.floor(Math.random() * pool.length)];
          const fid = FOOD_ID[foodName];
          if (!fid) continue;
          const fd = FOODS_FIXED.find((f) => f.foodName === foodName)!;
          if (!fd) continue;
          await createMealWithItems(prisma, cu.userId, logDate, mt, [
            { foodId: fid, qty: 1 },
          ]);
        }
      }
    }

    console.log('Phase 7 done');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 8: Popularity Boost (anonymous user pool)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\nPhase 8: Popularity boost...');

    const POP_BOOST_COUNT = 10;
    const popUserIds: number[] = [];
    for (let i = 0; i < POP_BOOST_COUNT; i++) {
      const email = `pop_boost_${String(i + 1).padStart(3, '0')}@seed.test`;
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          fullName: `Pop Boost User ${i + 1}`,
          userProfile: {
            create: {
              age: 30,
              height: 170,
              weight: 70,
              bmi: 24,
              bmr: 1600,
              tdee: 2200,
              activityLevel: 'ACT_LIGHT',
            },
          },
        },
      });
      popUserIds.push(u.id);
    }

    for (const foodName of TOP_POPULAR_FOOD_NAMES) {
      const fid = FOOD_ID[foodName];
      if (!fid) continue;
      const fd = FOODS_FIXED.find((f) => f.foodName === foodName)!;
      if (!fd) continue;
      // Each popular food gets 200–500 items spread over past 90 days
      const totalItems = 200 + Math.floor(Math.random() * 300);
      for (let i = 0; i < totalItems; i++) {
        const uid = popUserIds[i % popUserIds.length];
        const dayOff = 1 + Math.floor(Math.random() * 90);
        const mt = ['MEAL_BREAKFAST', 'MEAL_LUNCH', 'MEAL_DINNER'][
          Math.floor(Math.random() * 3)
        ];
        await createMealWithItems(prisma, uid, daysAgo(dayOff), mt, [
          { foodId: fid, qty: 1 },
        ]);
      }
    }

    console.log('Phase 8 done');

    console.log(
      '\nAll phases complete! Controlled seed data ready for testing.',
    );
  } catch (err) {
    console.error('Controlled seed failed:', err);
    throw err;
  } finally {
    await app.close();
  }
}

void runControlledSeed();
