import { MediaItem } from '@/types';

export const mediaItems: MediaItem[] = [
  {
    id: '1',
    title: 'AI Mastery Hackathon',
    shortDescription: 'Week long hackathon event hosted by the Tech in Schools Initiative team with prizes from partners such as Vercel, Daytona, Bolt and Digital Ocean. $200,000+ in prizes and resources.',
    longDescription: 'Week long hackathon event hosted by the Tech in Schools Initiative team with prizes from partners such as Vercel, Daytona, Bolt and Digital Ocean. $200,000+ in resources and prizes.',
    image: '/aimastery-hackathon.png',
    link: 'https://x.com/i/broadcasts/1vAxRDkrbqkGl',
    type: 'event',
    platform: 'Streamed Across 5+ Platforms',
    publishedDate: new Date('2024-03-20'),
    featured: true,
  },
  {
    id: '2',
    title: 'Idea to Impact Season 1-9',
    shortDescription: 'Ongoing educational series covering various web developer topics. Meets live every Wednesday and Thursday across livestreaming services and X.',
    longDescription: 'Ongoing educational series covering various web developer topics. Meets live every Wednesday and Thursday across livestreaming services and X.',
    image: '/idea-to-impact-season-9-300x200.webp',
    link: 'hhttps://www.youtube.com/@aitutorxpixio/playlists',
    type: 'livestream',
    platform: 'YouTube and X',
    publishedDate: new Date('2024-02-15'),
    featured: true,
  },
  // {
  //   id: '3',
  //   title: 'AI Builders Livestreams',
  //   shortDescription: 'Interview about career transition from traditional software to web dev',
  //   longDescription: 'A podcast interview discussing the journey from traditional software development to modern web development, sharing insights on learning new technologies and adapting to industry changes.',
  //   image: '/placeholder-media-3.jpg',
  //   link: 'https://www.youtube.com/playlist?list=PLb_fa0RVcbt6El2Dt1yvcF2gZoSZ_bGbD',
  //   type: 'livestream',
  //   platform: 'Spotify',
  //   publishedDate: new Date('2024-01-10'),
  //   featured: true,
  // },
  {
    id: '4',
    title: 'Digital Ocean Deploy 2022',
    shortDescription: 'Event hosted by Digital Ocean with different speakers covering multiple topics in cloud computing. Presented a segment about Digital Ocean products for beginners and solopreneurs.',
    longDescription: 'Event hosted by Digital Ocean with different speakers covering multiple topics in cloud computing. Presented a segment about Digital Ocean products for beginners and solopreneurs.',
    image: '/deploy.png',
    link: 'https://www.youtube.com/watch?v=nQ0yDXA4M8I&ab_channel=DigitalOcean',
    type: 'event',
    platform: 'YouTube',
    publishedDate: new Date('2024-04-05'),
    featured: false,
  },
    {
    id: '5',
    title: 'Elevator Pitch Season 3 Episode 3',
    shortDescription: 'Show organized by Entrepreneur Magazine in the style of an elevator pitch with real investors and businesses. Presented a tech education business focused on bridging the gap between market and public education.',
    longDescription: 'Show organized by Entrepreneur Magazine in the style of an elevator pitch with real investors and businesses. Presented a tech education business focused on bridging the gap between market and public education.',
    image: '/magazine-elevator-pitch.png',
    link: 'https://www.entrepreneur.com/starting-a-business/entrepreneur-elevator-pitch-season-3-episode-3-circus-act/320520',
    type: 'video',
    platform: 'Entrepreneur Magazine',
    publishedDate: new Date('2024-04-05'),
    featured: false,
  }
];

export const getMediaPage = (page: number, itemsPerPage: number = 8) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    items: mediaItems.slice(startIndex, endIndex),
    totalPages: Math.ceil(mediaItems.length / itemsPerPage),
    currentPage: page,
    totalItems: mediaItems.length,
  };
};