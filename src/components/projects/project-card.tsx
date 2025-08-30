import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    planned: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-95 min-h-[70px] md:min-h-[140px]"
      onClick={onClick}
    >
      <CardContent className="p-2 md:px-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-1 md:mb-3">
          <h3 className="font-semibold text-xs md:text-base line-clamp-1 md:line-clamp-2 flex-1 pr-2">
            {project.name}
          </h3>
          <Badge
            className={`text-xs flex-shrink-0 ${statusColors[project.status]}`}
            variant="secondary"
          >
            {project.status}
          </Badge>
        </div>
        
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-3 mb-1 md:mb-3 flex-1">
          {project.shortDescription}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-auto">
          {project.technologies.slice(0, 2).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {project.technologies.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{project.technologies.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}