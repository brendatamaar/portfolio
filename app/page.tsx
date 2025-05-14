'use client'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

import { XIcon } from 'lucide-react'
import { BlogPost } from '@/contentful/blogPosts'

import Hero from '@/components/section/Hero'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { PostCard } from '@/components/ui/post-card'

import { Magnetic } from '@/components/ui/magnetic'
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogContainer,
} from '@/components/ui/morphing-dialog'
import Link from 'next/link'
import { RESUME_DATA } from '@/data/resume-data'
import {
  PROJECTS,
  WORK_EXPERIENCE,
  BLOG_POSTS,
  EMAIL,
  SOCIAL_LINKS,
} from '../data/data'

const VARIANTS_CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

const VARIANTS_SECTION = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const TRANSITION_SECTION = { duration: 0.3 }

type ProjectProps = { src: string }

function Project({ src }: ProjectProps) {
  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0,
        duration: 0.3,
      }}
    >
      <MorphingDialogTrigger>
        <img
          src={src}
          className="aspect-video w-full cursor-zoom-in rounded-xl"
        />
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative aspect-video rounded-2xl bg-zinc-50 p-1 ring-1 ring-zinc-200/50 ring-inset dark:bg-zinc-950 dark:ring-zinc-800/50">
          <img
            src={src}
            className="aspect-video h-[50vh] w-full rounded-xl md:h-[70vh]"
          />
        </MorphingDialogContent>
        <MorphingDialogClose
          className="fixed top-6 right-6 h-fit w-fit rounded-full bg-white p-1"
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { delay: 0.3, duration: 0.1 },
            },
            exit: { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <XIcon className="h-5 w-5 text-zinc-500" />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}

function MagneticSocialLink({
  children,
  link,
}: {
  children: React.ReactNode
  link: string
}) {
  return (
    <Magnetic springOptions={{ bounce: 0 }} intensity={0.3}>
      <a
        href={link}
        className="group relative inline-flex shrink-0 items-center gap-[1px] rounded-full bg-zinc-100 px-2.5 py-1 text-sm text-black transition-colors duration-200 hover:bg-zinc-950 hover:text-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {children}
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
        >
          <path
            d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </a>
    </Magnetic>
  )
}

export default function Home() {
  const data = RESUME_DATA
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBlogPosts() {
      try {
        const response = await fetch('/api/blog')
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }
        const posts = await response.json()
        setBlogPosts(posts)
      } catch (error) {
        console.error('Error loading blog posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBlogPosts()
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col font-[family-name:var(--font-inter-tight)]">
      <div className="relative mx-auto w-full max-w-screen-sm flex-1 px-4 pt-20">
        <Header />
        <Hero />
        <motion.main
          className="space-y-14"
          variants={VARIANTS_CONTAINER}
          initial="hidden"
          animate="visible"
        >
          <motion.section
            variants={VARIANTS_SECTION}
            transition={TRANSITION_SECTION}
          >
            <div className="flex-1">
              <p className="text-zinc-600 dark:text-zinc-400">{data.about}</p>
            </div>
          </motion.section>

          <motion.section
            variants={VARIANTS_SECTION}
            transition={TRANSITION_SECTION}
          >
            <h3 className="mb-5 text-lg font-medium">Selected Projects</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {data.projects.map((project) => {
                if (project.isFeatured) {
                  return (
                    <div key={project.title} className="space-y-2">
                      <div className="relative rounded-2xl bg-zinc-50/40 p-1 ring-1 ring-zinc-200/50 ring-inset dark:bg-zinc-950/40 dark:ring-zinc-800/50">
                        <Project src={project.img} />
                      </div>
                      <div className="px-1">
                        <a
                          className="font-base group relative inline-block font-[450] text-zinc-900 dark:text-zinc-50"
                          href={
                            'link' in project ? project.link.href : undefined
                          }
                          target="_blank"
                        >
                          {project.title}
                          <span className="absolute bottom-0.5 left-0 block h-[1px] w-full max-w-0 bg-zinc-900 transition-all duration-200 group-hover:max-w-full"></span>
                        </a>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </motion.section>

          <motion.section
            variants={VARIANTS_SECTION}
            transition={TRANSITION_SECTION}
          >
            <h3 className="mb-5 text-lg font-medium">Work Experience</h3>
            <div className="flex flex-col gap-y-6">
              {data.work.map((work) => {
                return (
                  <div className="flex w-full flex-col" key={work.company}>
                    <div className="flex flex-row items-end gap-x-2">
                      <h4>{work.company}</h4>
                      <p className="text-sm opacity-50">
                        {work.start} - {work.end}
                      </p>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-400">
                      {work.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.section>

          <motion.section
            variants={VARIANTS_SECTION}
            transition={TRANSITION_SECTION}
          >
            <h3 className="mb-3 text-lg font-medium">Latest Posts</h3>
            <div className="flex flex-col space-y-0">
              {isLoading ? (
                <div className="text-zinc-500">Loading posts...</div>
              ) : blogPosts.length > 0 ? (
                blogPosts.map((post) => (
                  <PostCard
                    key={post.slug}
                    title={post.title}
                    link={`blog/${post.slug}`}
                    date={post.date}
                  />
                ))
              ) : (
                <div className="text-zinc-500">No posts found.</div>
              )}
            </div>
          </motion.section>

          <motion.section
            variants={VARIANTS_SECTION}
            transition={TRANSITION_SECTION}
          >
            <h3 className="mb-5 text-lg font-medium">Connect</h3>
            <p className="mb-5 text-zinc-600 dark:text-zinc-400">
              Feel free to contact me at{' '}
              <a
                className="underline dark:text-zinc-300"
                href={`mailto:${EMAIL}`}
              >
                {EMAIL}
              </a>
            </p>
            <div className="flex items-center justify-start space-x-3">
              {SOCIAL_LINKS.map((link) => (
                <MagneticSocialLink key={link.label} link={link.link}>
                  {link.label}
                </MagneticSocialLink>
              ))}
            </div>
          </motion.section>
        </motion.main>
        <Footer />
      </div>
    </div>
  )
}
