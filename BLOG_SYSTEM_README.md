# AI Style Guide Blog System

A complete blog system built with Next.js, Supabase, and automated content generation using OpenAI.

## 🚀 Features

- **Modern Blog Interface**: Clean, responsive design using Tailwind CSS
- **SEO Optimized**: Full Schema.org structured data and meta tags
- **Automated Content Generation**: Generate blog posts from CSV topics using OpenAI
- **Pagination**: Efficient pagination for blog listing
- **Database Integration**: Supabase backend with proper indexing
- **TypeScript**: Full type safety throughout the application

## 📁 File Structure

```
app/
├── blog/
│   ├── page.tsx              # Blog listing page
│   └── [slug]/
│       └── page.tsx          # Individual blog post page
└── api/
    └── blog/
        ├── route.ts          # Blog API endpoints (GET, POST)
        └── [slug]/
            └── route.ts      # Individual post API (GET, PUT, DELETE)

components/blog/
├── BlogCard.tsx              # Blog post card component
├── BlogContent.tsx           # Styled content renderer
└── Pagination.tsx            # Pagination component

scripts/
└── generate-blog-posts.js    # Content generation script
```

## 🗄️ Database Schema

The `blog_posts` table includes:

- `id` (UUID) - Primary key
- `title` (TEXT) - Blog post title
- `slug` (TEXT) - URL-friendly slug (unique)
- `content` (TEXT) - Full blog post content
- `excerpt` (TEXT) - Short summary
- `keywords` (TEXT[]) - SEO keywords array
- `category` (TEXT) - Post category
- `featured_image` (TEXT) - Optional featured image URL
- `author_name` (TEXT) - Author name
- `published_at` (TIMESTAMPTZ) - Publication date
- `updated_at` (TIMESTAMPTZ) - Last update date
- `created_at` (TIMESTAMPTZ) - Creation date
- `word_count` (INTEGER) - Word count
- `reading_time` (INTEGER) - Estimated reading time in minutes
- `is_published` (BOOLEAN) - Publication status

## 🎯 Content Generation

### CSV Format

Your CSV should have this structure:
```csv
Page Title,Target Keywords
"What Is Brand Voice? A Simple Guide","brand voice, what is brand voice, brand voice meaning"
"Brand Voice vs Tone of Voice","brand voice vs tone of voice, difference between voice and tone"
```

### Generation Commands

```bash
# Dry run (test without saving)
pnpm run generate-blog:dry

# Generate 3 posts (limited)
pnpm run generate-blog:limit

# Generate all posts from CSV
pnpm run generate-blog
```

### Script Features

- **Rate Limiting**: 2-second delays between API calls
- **Duplicate Detection**: Skips existing slugs
- **Error Handling**: Continues on individual failures
- **Progress Tracking**: Shows detailed progress and statistics
- **Dry Run Mode**: Test without database writes

## 🔧 API Endpoints

### Blog Listing
```
GET /api/blog?page=1&limit=10&category=Brand%20Strategy
```

Response:
```json
{
  "posts": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Individual Post
```
GET /api/blog/[slug]
```

### Create Post
```
POST /api/blog
Content-Type: application/json

{
  "title": "Blog Post Title",
  "slug": "blog-post-slug",
  "content": "Full blog post content...",
  "excerpt": "Short summary...",
  "keywords": ["keyword1", "keyword2"],
  "is_published": true
}
```

## 🎨 Design System

### Typography Hierarchy
- **H1**: `text-4xl font-bold` (post titles)
- **H2**: `text-2xl font-semibold` (section headers)
- **H3**: `text-xl font-medium` (subsections)
- **Body**: `text-base leading-relaxed` (content)
- **Meta**: `text-sm text-muted-foreground` (dates, reading time)

### Components
- **BlogCard**: Hover effects, responsive images, metadata display
- **BlogContent**: Styled prose with proper spacing and typography
- **Pagination**: Clean pagination with numbered pages and prev/next

## 🔍 SEO Features

### Schema.org Structured Data
- BlogPosting schema for individual posts
- Organization schema for publisher info
- Proper meta tags and Open Graph data

### Meta Tags
- Dynamic title and description per post
- Twitter Card support
- Canonical URLs
- Keyword optimization

## 🚀 Deployment

1. **Environment Variables**: Ensure all required env vars are set in production
2. **Database Migration**: The blog_posts table is automatically created
3. **Content Generation**: Run the script to populate initial content
4. **Static Generation**: Blog pages are statically generated for performance

## 📊 Performance

- **Static Generation**: Blog posts are statically generated
- **Image Optimization**: Next.js Image component with proper sizing
- **Lazy Loading**: Pagination prevents loading all posts at once
- **Caching**: API responses cached for 5 minutes

## 🛠️ Usage Examples

### Manual Blog Post Creation
```javascript
const response = await fetch('/api/blog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'How to Create Brand Voice Guidelines',
    slug: 'brand-voice-guidelines',
    content: '# Your content here...',
    excerpt: 'Learn how to create effective brand voice guidelines...',
    keywords: ['brand voice', 'guidelines', 'content strategy'],
    is_published: true
  })
})
```

### Fetching Blog Posts
```javascript
const response = await fetch('/api/blog?page=1&limit=6')
const { posts, pagination } = await response.json()
```

## 🔧 Customization

### Adding New Categories
Update the default category in the database schema and add to the categories filter in the blog listing page.

### Styling Changes
All styling uses Tailwind CSS classes and CSS custom properties for theming. Modify the BlogContent component for typography changes.

### Content Generation Prompts
Edit the `BLOG_POST_PROMPT` in `scripts/generate-blog-posts.js` to customize the AI-generated content style and structure.

## 📈 Analytics & Monitoring

The system includes:
- Word count and reading time calculation
- Publication and update timestamps
- Category-based organization
- Keyword tracking for SEO analysis

## 🎉 Success!

Your blog system is now complete with:
- ✅ Modern, responsive design
- ✅ SEO optimization with Schema.org
- ✅ Automated content generation
- ✅ Full CRUD API
- ✅ Pagination and filtering
- ✅ TypeScript support
- ✅ Performance optimizations

Visit `/blog` to see your blog in action!










