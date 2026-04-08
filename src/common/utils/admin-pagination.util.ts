import { isEmpty } from 'lodash';

/**
 * Một số client gửi `filter[type]=GOAL` nhưng query parser trả về key phẳng
 * `filter[type]` thay vì `filter: { type: 'GOAL' }`. api-query-params đưa key đó
 * vào `filter` → Prisma báo lỗi (không có cột `filter[type]`).
 * Chuẩn hoá thành field thật: `type`, `keyMap`, …
 */
function normalizeFlatBracketFilterKeys(
  filter: Record<string, unknown>,
): void {
  for (const key of [...Object.keys(filter)]) {
    const m = /^filter\[(.+)\]$/.exec(key);
    if (!m) continue;
    const inner = m[1];
    if (!/^[a-zA-Z_][\w]*$/.test(inner)) continue;
    if (filter[inner] === undefined) {
      filter[inner] = filter[key];
    }
    delete filter[key];
  }
}

/** Xóa tham số phân trang khỏi filter aqp (tránh đưa vào Prisma where). */
export function stripAdminPaginationFilter(
  filter: Record<string, unknown>,
): void {
  delete filter.current;
  delete filter.pageSize;
  normalizeFlatBracketFilterKeys(filter);
}

/** Chuyển sort từ aqp sang Prisma orderBy. */
export function prismaSortFromAqp(
  aqpSort: unknown,
  defaultSort: Record<string, 'asc' | 'desc'>,
): Record<string, 'asc' | 'desc'> {
  if (isEmpty(aqpSort)) {
    return defaultSort;
  }
  return Object.entries(aqpSort as Record<string, number>).reduce(
    (acc, [key, value]) => {
      acc[key] = value === 1 ? 'asc' : 'desc';
      return acc;
    },
    {} as Record<string, 'asc' | 'desc'>,
  );
}
