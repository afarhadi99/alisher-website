import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github } from 'lucide-react';
import { Project } from '@/types';

interface ProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDialog({ project, open, onOpenChange }: ProjectDialogProps) {
  if (!project) return null;

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    planned: 'bg-gray-100 text-gray-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[95vh] md:max-h-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-sm md:text-base">
            <span className="line-clamp-2 flex-1 pr-2">{project.name}</span>
            <Badge className={`text-xs flex-shrink-0 ${statusColors[project.status]}`} variant="secondary">
              {project.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Project Screenshot */}
          <div className="w-full h-48 md:h-84 bg-transparent overflow-hidden flex items-center justify-center">
            {project.image && !project.image.includes('placeholder') ? (
              <img
                src={project.image}
                alt={`${project.name} screenshot`}
                className="max-w-full max-h-full object-fill rounded-lg"
              />
            ) : (
              <span className="text-xs md:text-sm text-muted-foreground">Project Screenshot</span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2 text-sm md:text-base">About</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {project.longDescription}
            </p>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="font-semibold mb-2 text-sm md:text-base">Technologies</h3>
            <div className="flex flex-wrap gap-1 md:gap-2">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Project Details */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
            <div>
              <span className="font-medium">Category:</span>
              <span className="ml-2 capitalize">{project.category}</span>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <span className="ml-2">{project.date.toLocaleDateString()}</span>
            </div>
          </div> */}

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 pt-2 md:pt-4 justify-center mx-auto">
            {project.link && project.link !== project.githubLink && (
              <Button asChild className="w-full md:w-auto min-h-[44px] text-sm">
                <a href={project.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Project
                </a>
              </Button>
            )}
            {project.githubLink && (
              <Button variant="outline" asChild className="w-full md:w-auto min-h-[44px] text-sm">
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  View Code
                </a>
              </Button>
            )}
            {project.appStoreLink && (
              <Button asChild className="w-full md:w-auto min-h-[44px] text-sm">
                <a href={project.appStoreLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on App Store
                </a>
              </Button>
            )}
            {project.googlePlayLink && (
              <Button asChild className="w-full md:w-auto min-h-[44px] text-sm">
                <a href={project.googlePlayLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Google Play
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}