/**
 * Helper utility to derive SQL limit and offset from page query parameters.
 */
export const getPaginationParams = (pageParam?: number, limitParam?: number): { limit: number; offset: number; page: number } => {
    const page = Math.max(1, pageParam || 1);
    const limit = Math.max(1, limitParam || 10);
    const offset = (page - 1) * limit;

    return { limit, offset, page };
};

/**
 * Helper to build standard pagination meta response.
 */
export const formatPaginationMeta = (totalItems: number, page: number, limit: number) => {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
