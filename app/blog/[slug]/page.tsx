import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import BlogContent from '@/components/blog/BlogContent'
import ShareButton from '@/components/blog/ShareButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, Home, BookOpen } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  featured_image?: string
  author_name: string
  author_image?: string
  published_at: string
  updated_at: string
  reading_time: number
  word_count: number
  keywords: string[]
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Import supabase client directly for server-side rendering
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      console.error('Error fetching blog post:', error)
      return null
    }

    return post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const post = await getBlogPost(resolvedParams.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | AI Style Guide',
      description: 'The requested blog post could not be found.',
    }
  }

  return {
    title: `${post.title} | AI Style Guide`,
    description: post.excerpt,
    keywords: post.keywords,
    authors: [{ name: post.author_name }],
    alternates: {
      canonical: `https://aistyleguide.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://aistyleguide.com/blog/${post.slug}`,
      siteName: 'AI Style Guide',
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: [
        {
          url: post.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop&auto=format',
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop&auto=format'],
    },
  }
}

// Schema.org structured data component - optimized for SEO
function BlogSchema({ post }: { post: BlogPost }) {
  // Remove the first heading from content for articleBody (title is already in headline)
  const articleBody = post.content.replace(/^#\s+.*$/m, '');
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    name: post.title, // duplicate of headline for better search compatibility
    headline: post.title,
    description: post.excerpt,
    articleBody: articleBody,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: 'en-US',
    genre: post.category,
    isPartOf: {
      '@type': 'Blog',
      name: 'AI Style Guide Blog',
      url: 'https://aistyleguide.com/blog'
    },
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Style Guide',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aistyleguide.com/aistyleguide-logo.png',
      },
    },
    mainEntityOfPage: `https://aistyleguide.com/blog/${post.slug}`,
    url: `https://aistyleguide.com/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
    wordCount: post.word_count,
    articleSection: post.category,
    image: {
      '@type': 'ImageObject',
      url: post.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop&auto=format',
      width: 1200,
      height: 630,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Breadcrumb schema for better navigation context
function BreadcrumbSchema({ slug, title }: { slug: string; title: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Blog',
        item: 'https://aistyleguide.com/blog'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: `https://aistyleguide.com/blog/${slug}`
      }
    ]
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const post = await getBlogPost(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  // Date formatting and update detection logic
  // This template displays dates under the author name:
  // - Shows published date if post hasn't been updated
  // - Shows "Updated on: [date]" if post has been updated (more than 1 minute difference)
  const publishedDateObj = new Date(post.published_at)
  const updatedDateObj = new Date(post.updated_at)
  
  const publishedDate = publishedDateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const updatedDate = updatedDateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Check if post has been updated (updated_at is significantly different from published_at)
  const hasBeenUpdated = updatedDateObj.getTime() - publishedDateObj.getTime() > 60000 // More than 1 minute difference

  return (
    <>
      <BlogSchema post={post} />
      <BreadcrumbSchema slug={post.slug} title={post.title} />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <nav className="mb-8 max-w-[47.6rem] mx-auto">
            <div className="flex items-center gap-3 text-sm">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span>Blog</span>
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium truncate">{post.title}</span>
            </div>
          </nav>

          <article className="max-w-[47.6rem] mx-auto">
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{post.category}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-sm text-muted-foreground">{post.reading_time} min read</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between py-4 border-y">
                <div className="flex items-center gap-3">
                  <Link 
                    href="https://x.com/tahigichigi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-10 h-10">
                      {post.author_image ? (
                        <AvatarImage src={post.author_image} alt={post.author_name} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {post.author_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link 
                      href="https://x.com/tahigichigi" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {post.author_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {hasBeenUpdated ? (
                        <>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Updated on: {updatedDate}
                        </>
                      ) : (
                        <>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {publishedDate}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <ShareButton 
                  url={`https://aistyleguide.com/blog/${post.slug}`}
                  title={post.title}
                />
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="mb-8">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Article Content */}
            <BlogContent>
              {post.content.replace(/^#\s+.*$/m, '')}
            </BlogContent>

            {/* Article Footer */}
            <footer className="mt-12 pt-8 border-t">
              <div className="flex flex-wrap gap-2 mb-6">
                {post.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Published on {publishedDate}</p>
                  {publishedDate !== updatedDate && (
                    <p>Last updated on {updatedDate}</p>
                  )}
                </div>

                <Button asChild>
                  <Link href="/blog">
                    Read More Articles
                  </Link>
                </Button>
              </div>
            </footer>
          </article>
        </main>
      </div>
    </>
  )
}
