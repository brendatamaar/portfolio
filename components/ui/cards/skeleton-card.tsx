/** Animated placeholder shown while blog posts are loading. */
export function SkeletonCard() {
  return (
    <div className="animate-pulse border-2 border-black p-5 shadow-[4px_4px_0px_#000] dark:border-white dark:shadow-[4px_4px_0px_#fff]">
      <div className="mb-3 flex justify-between">
        <div className="h-3 w-20 bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-4 bg-black/10 dark:bg-white/10" />
      </div>
      <div className="mb-2 h-5 w-3/4 bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-full bg-black/10 dark:bg-white/10" />
      <div className="mt-1 h-4 w-2/3 bg-black/10 dark:bg-white/10" />
    </div>
  )
}
