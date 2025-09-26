'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion';
import { ProjectsSection } from '@/components/projects/projects-section';
import { MediaSection } from '@/components/media/media-section';
import Profile from '@/components/Profile/Profile';
import MobileProfileCard from '@/components/Profile/MobileProfileCard';

export default function Home() {
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const reduced = useReducedMotion();
  const layoutTransition: Transition = reduced ? { duration: 0.15 } : { stiffness: 300, damping: 30, mass: 0.3 };

  // Reduced-motion aware animation presets
  const enterUpInitial = reduced ? { opacity: 0 } : { opacity: 0, y: -8 };
  const enterUpAnimate = reduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const exitUp = reduced ? { opacity: 0 } : { opacity: 0, y: -24 };

  const enterDownInitial = reduced ? { opacity: 0 } : { opacity: 0, y: 8 };
  const enterDownAnimate = reduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const exitDown = reduced ? { opacity: 0 } : { opacity: 0, y: 24 };

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      {/* Mobile Layout: Single column stacked */}
      <div className="md:hidden h-full flex flex-col gap-3 p-3">
        <AnimatePresence initial={false} mode="popLayout">
          {!projectsExpanded && (
            <motion.div
              key="profile-mobile"
              layout
              transition={layoutTransition}
              initial={enterUpInitial}
              animate={enterUpAnimate}
              exit={exitUp}
              className="bg-card rounded-lg border overflow-hidden p-3"
            >
              <MobileProfileCard />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key="projects-mobile"
          layout
          transition={layoutTransition}
          className={`bg-card rounded-lg border overflow-hidden ${projectsExpanded ? 'flex-1' : ''}`}
        >
          <ProjectsSection
            expanded={projectsExpanded}
            onToggle={() => setProjectsExpanded((v) => !v)}
          />
        </motion.div>

        <AnimatePresence initial={false} mode="popLayout">
          {!projectsExpanded && (
            <motion.div
              key="media-mobile"
              layout
              transition={layoutTransition}
              initial={enterDownInitial}
              animate={enterDownAnimate}
              exit={exitDown}
              className="flex-1 bg-card rounded-lg border overflow-hidden"
            >
              <MediaSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablet Portrait Layout: Single column stacked like mobile */}
      <div className="hidden md:flex lg:hidden portrait:flex portrait:flex-col h-full gap-4 p-4">
        <AnimatePresence initial={false} mode="popLayout">
          {!projectsExpanded && (
            <motion.div
              key="profile-tablet-portrait"
              layout
              transition={layoutTransition}
              initial={enterUpInitial}
              animate={enterUpAnimate}
              exit={exitUp}
              className="bg-card rounded-lg border overflow-hidden p-3 flex-shrink-0"
            >
              <MobileProfileCard />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key="projects-tablet-portrait"
          layout
          transition={layoutTransition}
          className={`bg-card rounded-lg border overflow-hidden ${projectsExpanded ? 'flex-1' : ''}`}
        >
          <ProjectsSection
            expanded={projectsExpanded}
            onToggle={() => setProjectsExpanded((v) => !v)}
          />
        </motion.div>

        <AnimatePresence initial={false} mode="popLayout">
          {!projectsExpanded && (
            <motion.div
              key="media-tablet-portrait"
              layout
              transition={layoutTransition}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="flex-1 bg-card rounded-lg border overflow-hidden"
            >
              <MediaSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablet Landscape Layout: Profile on top, then conditional content below */}
      <div className="hidden md:flex lg:hidden max-lg:landscape:flex flex-col h-full gap-4 p-4">
        <AnimatePresence initial={false} mode="popLayout">
          {!projectsExpanded && (
            <motion.div
              key="profile-tablet-landscape"
              layout
              transition={layoutTransition}
              initial={enterUpInitial}
              animate={enterUpAnimate}
              exit={exitUp}
              className="bg-card rounded-lg border overflow-hidden p-3 flex-shrink-0"
            >
              <MobileProfileCard />
            </motion.div>
          )}
        </AnimatePresence>

        {!projectsExpanded ? (
          <motion.div key="grid-tablet-landscape" layout transition={layoutTransition} className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border overflow-hidden">
              <ProjectsSection
                expanded={projectsExpanded}
                onToggle={() => setProjectsExpanded((v) => !v)}
              />
            </div>
            <motion.div layout transition={layoutTransition} className="bg-card rounded-lg border overflow-hidden">
              <MediaSection />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="projects-only-tablet-landscape"
            layout
            transition={layoutTransition}
            className="flex-1 bg-card rounded-lg border overflow-hidden"
          >
            <ProjectsSection
              expanded={projectsExpanded}
              onToggle={() => setProjectsExpanded((v) => !v)}
            />
          </motion.div>
        )}
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