import { ProjectsSection } from '@/components/projects/projects-section';
import { MediaSection } from '@/components/media/media-section';
import Profile from '@/components/Profile/Profile';

export default function Home() {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      {/* Mobile Layout: Single column stacked */}
      <div className="md:hidden h-full flex flex-col gap-3 p-3">
        {/* Profile Section - Mobile */}
        <div className="h-20 bg-card rounded-lg border overflow-hidden p-3">
          <div className="h-full flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Profile</p>
              <p className="text-xs text-muted-foreground">(Coming soon)</p>
            </div>
          </div>
        </div>

        {/* Projects Section - Mobile */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <ProjectsSection />
        </div>

        {/* Media Section - Mobile */}
        <div className="flex-1 bg-card rounded-lg border overflow-hidden max-h-1/2">
          <MediaSection />
        </div>
      </div>

      {/* Tablet Portrait Layout: Single column stacked like mobile */}
      <div className="hidden md:flex lg:hidden portrait:flex portrait:flex-col h-full gap-4 p-4">
        {/* Profile Section - Tablet Portrait */}
        <div className="h-20 bg-card rounded-lg border overflow-hidden p-3 flex-shrink-0">
          <div className="h-full flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Profile</p>
              <p className="text-xs text-muted-foreground">(Coming soon)</p>
            </div>
          </div>
        </div>

        {/* Projects Section - Tablet Portrait */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <ProjectsSection />
        </div>

        {/* Media Section - Tablet Portrait */}
        <div className="flex-1 bg-card rounded-lg border overflow-hidden">
          <MediaSection />
        </div>
      </div>

      {/* Tablet Landscape Layout: Profile on top, then 2 columns below */}
      <div className="hidden md:flex lg:hidden max-lg:landscape:flex flex-col h-full gap-4 p-4">
        {/* Profile Section - Tablet Landscape */}
        <div className="h-20 bg-card rounded-lg border overflow-hidden p-3 flex-shrink-0">
          <div className="h-full flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Profile</p>
              <p className="text-xs text-muted-foreground">(Coming soon)</p>
            </div>
          </div>
        </div>

        {/* Content Grid - Tablet Landscape */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Projects Section - Tablet Landscape */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <ProjectsSection />
          </div>

          {/* Media Section - Tablet Landscape */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <MediaSection />
          </div>
        </div>
      </div>

      {/* Desktop Layout: 3 columns */}
      <div className="hidden lg:grid grid-cols-12 h-full gap-6 p-6">
        {/* Left Column - Profile (Desktop only) */}
        <div className="col-span-3 bg-card rounded-lg border p-4">
          <Profile />
        </div>

        {/* Middle Column - Projects */}
        <div className="col-span-5 bg-card rounded-lg border overflow-hidden">
          <ProjectsSection />
        </div>

        {/* Right Column - Media */}
        <div className="col-span-4 bg-card rounded-lg border overflow-hidden">
          <MediaSection />
        </div>
      </div>
    </div>
  );
}