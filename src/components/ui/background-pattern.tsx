export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
      <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,transparent_20%,#000_100%)] opacity-[0.18] dark:opacity-[0.08]" />
    </div>
  )
}
