'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ProjectCard } from './project-card';
import { ProjectDialog } from './project-dialog';
import { projects, getProjectsByCategory } from '@/data/projects';
import { Project, ProjectCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';
 
interface ProjectsSectionProps {
  expanded?: boolean;
  onToggle?: () => void;
}

export function ProjectsSection({ expanded = false, onToggle }: ProjectsSectionProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);
 
  const filteredProjects = getProjectsByCategory(activeCategory);
  
  // Responsive pagination - mobile shows 3, tablet shows 3, desktop shows 4
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 1; // mobile
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

  // Motion settings and effective pagination size
  const reduced = useReducedMotion();
  const layoutTransition: Transition = reduced ? { duration: 0.15 } : { stiffness: 300, damping: 30, mass: 0.3 };

  // Track sub-lg viewport to enable expanded mode behavior only on mobile/tablet
  const [isSubLg, setIsSubLg] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  useEffect(() => {
    const handler = () => setIsSubLg(window.innerWidth < 1024);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const effectiveItemsPerPage = expanded && isSubLg ? 4 : itemsPerPage;

  // Reset to page 1 on expand/collapse or category/items-per-page change
  useEffect(() => {
    setCurrentPage(1);
  }, [expanded, activeCategory, effectiveItemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / effectiveItemsPerPage);
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, startIndex + effectiveItemsPerPage);

  // Reset to page 1 when category changes
  const handleCategoryChange = (category: ProjectCategory) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 md:p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold">Projects</h2>
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-pressed={expanded}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse projects' : 'Expand projects'}
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <Tabs value={activeCategory} onValueChange={(value) => handleCategoryChange(value as ProjectCategory)}>
          <TabsList className="grid grid-cols-5 w-full h-9 md:h-10 mt-3">
            <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
            <TabsTrigger value="devrel" className="text-xs md:text-sm">DevRel</TabsTrigger>
            <TabsTrigger value="frontend" className="text-xs md:text-sm">Frontend</TabsTrigger>
            <TabsTrigger value="fullstack" className="text-xs md:text-sm">Full-Stack</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs md:text-sm">AI</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 p-3 md:p-4">
        <motion.div layout transition={layoutTransition} className="space-y-2 md:space-y-3 h-full">
          {currentProjects.map((project) => (
            <motion.div key={project.id} layout transition={layoutTransition}>
              <ProjectCard
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            </motion.div>
          ))}
        </motion.div>
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