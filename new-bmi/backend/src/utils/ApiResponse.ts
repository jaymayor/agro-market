export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ApiResponse<T = unknown> {
  success = true;
  message: string;
  data: T;
  meta?: PaginationMeta;

  constructor(data: T, message = 'Success', meta?: PaginationMeta) {
    this.data = data;
    this.message = message;
    if (meta) this.meta = meta;
  }
}
