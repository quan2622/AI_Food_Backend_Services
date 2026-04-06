import { isEmpty } from 'lodash';

/** Xóa tham số phân trang khỏi filter aqp (tránh đưa vào Prisma where). */
export function stripAdminPaginationFilter(
  filter: Record<string, unknown>,
): void {
  delete filter.current;
  delete filter.pageSize;
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
