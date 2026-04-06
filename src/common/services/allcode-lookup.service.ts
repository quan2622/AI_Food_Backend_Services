import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Thông tin hiển thị từ bảng all_codes (keyMap unique). */
export type AllCodeInfo = {
  keyMap: string;
  value: string;
  description: string | null;
  type: string;
};

@Injectable()
export class AllCodeLookupService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tra cứu theo danh sách keyMap, trả về Map để gắn `xxxInfo` cho từng bản ghi.
   */
  async mapByKeyMaps(
    keys: Iterable<string | null | undefined>,
  ): Promise<Map<string, AllCodeInfo>> {
    const uniq = [...new Set([...keys].filter((k): k is string => !!k))];
    if (uniq.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.allCode.findMany({
      where: { keyMap: { in: uniq } },
      select: { keyMap: true, value: true, description: true, type: true },
    });
    return new Map(
      rows.map((r) => [
        r.keyMap,
        {
          keyMap: r.keyMap,
          value: r.value,
          description: r.description,
          type: r.type,
        },
      ]),
    );
  }
}
