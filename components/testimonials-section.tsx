import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function TestimonialsSection() {
  // Testimonials data
  const testimonials = [
    {
      name: "Tunde",
      title: "",
      company: "Edge City",
      quote:
        "This brand voice generator nailed the tone for my project. The voice was exactly what I was going for, and the content examples were super helpful.",
      heading: "Seriously spot on.",
      image: "/headshot-3.jpg" // First headshot image
    },
    {
      name: "Anna",
      title: "",
      company: "Naked Brand",
      quote:
        "It's saves days of work and creates a more detailed guide than I could for my clients. I can raise the price of my work because the perceived value of it is now higher.",
      heading: "It's so easy and quick.",
      image: "/headshot-2.jpg" // Second headshot image
    },
    {
      name: "Remi",
      title: "",
      company: "MOCAA Studio",
      quote:
        "Really simple and easy to use. I'm not a writer, so creating good content isn't easy for me. This saved a lot of time and frustration. Highly recommend for anyone who wants their content to sound like them.",
      heading: "Saves time and frustration.",
      image: "/logos/remi.png"
    },
    {
      name: "Andrew",
      title: "",
      company: "Working Content",
      quote:
        "If clients always say 'we've been meaning to do that' when you ask for their style guide, this will save you a tonne of time. Based on a few text inputs, it generates a guide that replaces 20 hours of work with a few clicks.",
      heading: "Replaces hours of work.",
      image: "/logos/Andrew.jpeg"
    }
  ]

  return (
    <section className="w-full py-12 md:py-20 lg:py-24 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Trusted by content creators
            </h2>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-2">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="mt-4 mb-4">
                  <p className="text-xl font-bold">{testimonial.heading}</p>
                  <p className="text-muted-foreground mt-2">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={testimonial.image}
                      alt={`${testimonial.name} headshot`}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    {testimonial.title && (
                      <p className="text-sm text-muted-foreground">
                        {testimonial.title}{testimonial.title && testimonial.company ? ", " : ""}{testimonial.company}
                      </p>
                    )}
                    {!testimonial.title && testimonial.company && (
                      <p className="text-sm text-muted-foreground">
                        {testimonial.company}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
