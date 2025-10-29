import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  featured_image?: string
  author_name: string
  published_at: string
  reading_time: number
  keywords: string[]
}

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative overflow-hidden rounded-t-lg">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              width={400}
              height={200}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center p-6">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {post.category}
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {post.category}
            </Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{publishedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.reading_time} min read</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              By {post.author_name}
            </span>
            <span className="text-primary font-medium text-sm group-hover:underline">
              Read more →
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}





