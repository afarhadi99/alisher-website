# Alisher Portfolio Website

A modern, professional portfolio website built with Next.js 15, TypeScript, and Tailwind CSS v4, featuring shadcn/ui components.

## 🚀 Features

### Layout
- **3-Column Design**: Full viewport height with no scrolling
- **Responsive Grid**: Professional layout matching modern portfolio standards
- **Profile Section**: Left column reserved for future profile content
- **Projects Showcase**: Middle column with tabbed filtering
- **Media Gallery**: Right column with paginated content grid

### Projects Section
- **Tabbed Interface**: Filter by All, Web, Mobile, AI categories
- **Interactive Cards**: Click to view detailed project information
- **Detailed Dialogs**: Full project descriptions, technologies, and links
- **Status Indicators**: Visual badges for project completion status
- **Technology Tags**: Clean display of tech stack for each project

### Media Section
- **4x2 Grid Layout**: Optimized for showcasing articles, videos, talks, etc.
- **Pagination**: Navigate through multiple pages of content
- **Content Types**: Support for articles, videos, podcasts, interviews, talks
- **External Links**: Direct links to original content with hover effects
- **Platform Integration**: Display source platforms (Medium, YouTube, etc.)

## 🛠 Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5+ with strict configuration
- **Styling**: Tailwind CSS v4 (latest) with custom theme
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Development**: ESLint, Turbopack for fast development

## 📁 Project Structure

```
alisher-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles with Tailwind
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Main page component
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── projects/         # Project-related components
│   │   │   ├── projects-section.tsx
│   │   │   ├── project-card.tsx
│   │   │   └── project-dialog.tsx
│   │   └── media/            # Media-related components
│   │       ├── media-section.tsx
│   │       └── media-card.tsx
│   ├── data/                 # Sample data
│   │   ├── projects.ts       # Project data and utilities
│   │   └── media.ts          # Media data and utilities
│   ├── types/                # TypeScript definitions
│   │   └── index.ts
│   └── lib/                  # Utility functions
│       └── utils.ts          # shadcn/ui utilities
├── public/                   # Static assets
└── configuration files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17 or higher
- npm, yarn, or pnpm

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd alisher-website
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   ```
   http://localhost:3000
   ```

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Customization

### Adding Your Projects

Edit `src/data/projects.ts` to add your own projects:

```typescript
{
  id: 'unique-id',
  name: 'Project Name',
  shortDescription: 'Brief description for the card',
  longDescription: 'Detailed description for the dialog',
  image: '/path-to-image.jpg',
  link: 'https://project-url.com',
  githubLink: 'https://github.com/username/repo', // optional
  technologies: ['Next.js', 'TypeScript', 'Tailwind CSS'],
  status: 'completed', // 'completed' | 'in-progress' | 'planned'
  category: 'web', // 'all' | 'web' | 'mobile' | 'ai'
  date: new Date('2024-01-01'),
  featured: true, // boolean
}
```

### Adding Your Media

Edit `src/data/media.ts` to add your articles, videos, etc.:

```typescript
{
  id: 'unique-id',
  title: 'Media Title',
  shortDescription: 'Brief description',
  longDescription: 'Detailed description',
  image: '/path-to-image.jpg',
  link: 'https://external-link.com',
  type: 'article', // 'article' | 'video' | 'podcast' | 'interview' | 'talk'
  platform: 'Medium', // Platform name
  publishedDate: new Date('2024-01-01'),
  featured: true, // boolean
}
```

### Styling Customization

The project uses Tailwind CSS v4 with custom CSS variables defined in `src/app/globals.css`. Modify the theme variables to match your brand:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  /* Add your custom variables */
}
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Other Platforms
The project is a standard Next.js application and can be deployed to any platform supporting Node.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 📝 Next Steps

1. **Add Profile Content**: Implement the left column with your profile information
2. **Add Images**: Replace placeholder images with actual project screenshots
3. **SEO Optimization**: Add metadata and OpenGraph tags
4. **Analytics**: Integrate Google Analytics or similar
5. **Contact Form**: Add a contact section if needed
6. **Blog Integration**: Consider adding a blog section
7. **Animation**: Add subtle animations for better UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is for personal use. Modify as needed for your own portfolio.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
