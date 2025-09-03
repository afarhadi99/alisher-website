import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { MediaItem } from '@/types';

interface MediaCardProps {
  media: MediaItem;
}

export function MediaCard({ media }: MediaCardProps) {
  const typeColors = {
    article: 'bg-blue-100 text-blue-800',
    video: 'bg-red-100 text-red-800',
    podcast: 'bg-purple-100 text-purple-800',
    event: 'bg-purple-100 text-purple-800',
    interview: 'bg-green-100 text-green-800',
    livestream: 'bg-green-100 text-green-800',
    talk: 'bg-orange-100 text-orange-800',
  };

  return (
    <Card className="cursor-pointer hover:shadow-md active:scale-95 transition-all group h-full overflow-hidden p-0">
      <a href={media.link} target="_blank" rel="noopener noreferrer" className="block h-full">
        <div className="flex flex-col h-full">
          <div className="w-full h-1/2 relative flex-shrink-0">
            <Image
              src={media.image}
              alt={media.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
          <div className="p-3 md:p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-xs md:text-sm line-clamp-2 flex-1 pr-2">
                {media.title}
              </h3>
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 md:line-clamp-5 mb-2 md:mb-3 flex-1">
              {media.shortDescription}
            </p>

            <div className="flex items-center justify-between mt-auto flex-wrap gap-1">
              <Badge className={`text-xs ${typeColors[media.type]}`} variant="secondary">
                {media.type}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {media.platform}
              </span>
            </div>
          </div>
        </div>
      </a>
    </Card>
  );
}
