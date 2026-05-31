import { PaginationMeta } from './ApiResponse';

interface PaginationQuery {
  page?: number | string | unknown;
  limit?: number | string | unknown;
  [key: string]: unknown;
}

export const getPagination = (query: PaginationQuery) => {
  const page = Math.max(1, parseInt(String(query.page ?? 1)) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20)) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildMeta = (total: number, page: number, limit: number): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});
