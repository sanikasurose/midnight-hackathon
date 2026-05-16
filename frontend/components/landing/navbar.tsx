import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function Navbar() {
  return (
    <header className="nav-reveal fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-night/82 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          <Logo />
        </a>
        <div className="hidden items-center gap-8 text-sm text-platinum md:flex">
          <a className="transition-colors hover:text-zinc-50" href="#flow">
            How it works
          </a>
          <a className="transition-colors hover:text-zinc-50" href="#privacy">
            Privacy
          </a>
          <a className="transition-colors hover:text-zinc-50" href="#trust">
            Trust
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button href="/login" variant="secondary" className="hidden px-4 md:inline-flex">
            Login
          </Button>
          <Button href="/register" className="px-4">
            Register <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </header>
  );
}
