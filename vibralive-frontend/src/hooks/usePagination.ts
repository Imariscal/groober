import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps {
  items: any[];
  initialItemsPerPage?: number;
}

export function usePagination({ items, initialItemsPerPage = 10 }: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = useMemo(() => {
    return Math.ceil(items.length / itemsPerPage);
  }, [items.length, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    const maxPage = Math.ceil(items.length / itemsPerPage);
    const newPage = Math.max(1, Math.min(page, maxPage));
    setCurrentPage(newPage);
  }, [items.length, itemsPerPage]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
    totalItems: items.length,
  };
}
