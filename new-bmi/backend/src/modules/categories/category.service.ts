import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateSlug } from '../../utils/generateSlug';

export const categoryService = {
  async getAll() {
    return prisma.category.findMany({
      where: { is_active: true, parent_id: null },
      orderBy: { ordering: 'asc' },
      select: {
        id: true, name_uz: true, name_ru: true, slug: true, icon_url: true, ordering: true,
        children: {
          where: { is_active: true },
          orderBy: { ordering: 'asc' },
          select: { id: true, name_uz: true, name_ru: true, slug: true, icon_url: true },
        },
      },
    });
  },

  async create(dto: { name_uz: string; name_ru?: string; parent_id?: string; ordering: number }) {
    const slug = generateSlug(dto.name_uz);
    return prisma.category.create({ data: { ...dto, slug } });
  },

  async update(id: string, dto: Partial<{ name_uz: string; name_ru: string; ordering: number; is_active: boolean }>) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new ApiError(404, 'Kategoriya topilmadi');
    return prisma.category.update({ where: { id }, data: dto });
  },

  async uploadIcon(id: string, url: string) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new ApiError(404, 'Kategoriya topilmadi');
    return prisma.category.update({ where: { id }, data: { icon_url: url } });
  },
};
