'use client';

import { useState, useEffect } from 'react';
import { MediaCard } from './media-card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { getMediaPage } from '@/data/media';

export function MediaSection() {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Responsive grid - mobile shows 2 items, desktop shows 4 items (2x2 grid)
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 2; // mobile
      if (window.innerWidth < 1024) return 2; // tablet (both orientations)
      return 4; // desktop
    }
    return 4; // default for SSR
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);
  
  // Update items per page on resize
  useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { items, totalPages } = getMediaPage(currentPage, itemsPerPage);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b">
        <h2 className="text-base md:text-lg font-semibold">Media & Articles</h2>
      </div>

      <div className="flex-1 p-3 md:p-4 flex flex-col min-h-0">
        <div className="grid grid-cols-2 gap-2 md:gap-4 flex-1 auto-rows-fr">
          {items.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="p-3 md:p-4 border-t bg-muted/30 md:bg-muted/70 mt-auto">
          <Pagination>
            <PaginationContent className="gap-1 md:gap-3">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted hover:text-foreground'}
                    h-8 md:h-11 px-2 md:px-4 text-xs md:text-base font-medium transition-colors
                    md:border md:border-border md:bg-background md:shadow-sm`}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={`cursor-pointer h-8 md:h-11 w-8 md:w-11 text-xs md:text-base font-medium transition-colors
                        ${currentPage === page
                          ? 'md:bg-primary md:text-primary-foreground md:border-primary'
                          : 'md:border md:border-border md:bg-background md:shadow-sm hover:bg-muted hover:text-foreground'
                        }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && <PaginationEllipsis className="h-8 md:h-11 md:text-base" />}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted hover:text-foreground'}
                    h-8 md:h-11 px-2 md:px-4 text-xs md:text-base font-medium transition-colors
                    md:border md:border-border md:bg-background md:shadow-sm`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}