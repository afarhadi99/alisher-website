'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ProjectCard } from './project-card';
import { ProjectDialog } from './project-dialog';
import { projects, getProjectsByCategory } from '@/data/projects';
import { Project, ProjectCategory } from '@/types';

export function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProjects = getProjectsByCategory(activeCategory);
  
  // Responsive pagination - mobile shows 3, tablet shows 3, desktop shows 4
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

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when category changes
  const handleCategoryChange = (category: ProjectCategory) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b">
        <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Projects</h2>
        <Tabs value={activeCategory} onValueChange={(value) => handleCategoryChange(value as ProjectCategory)}>
          <TabsList className="grid grid-cols-5 w-full h-9 md:h-10">
            <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
            <TabsTrigger value="devrel" className="text-xs md:text-sm">DevRel</TabsTrigger>
            <TabsTrigger value="frontend" className="text-xs md:text-sm">Frontend</TabsTrigger>
            <TabsTrigger value="fullstack" className="text-xs md:text-sm">Full-Stack</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs md:text-sm">AI</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 p-3 md:p-4">
        <div className="space-y-2 md:space-y-3 h-full">
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="p-3 md:p-4 border-t bg-muted/30 md:bg-muted/70">
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
              
              {Array.from({ length: Math.min(6, totalPages) }, (_, i) => {
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
              
              {totalPages > 6 && <PaginationEllipsis className="h-8 md:h-11 md:text-base" />}
              
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

      <ProjectDialog
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open: boolean) => !open && setSelectedProject(null)}
      />
    </div>
  );
}