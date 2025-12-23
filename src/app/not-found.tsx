import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center px-4">
        <h1 className="text-6xl font-bold text-foreground mb-4">
          Error 404
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Unfortunately, the site seems to have been lost in the shadows of the internet.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
