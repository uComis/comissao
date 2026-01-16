'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Soluções', href: '#solucoes' },
  { label: 'Segurança', href: '#seguranca' },
  { label: 'Preços', href: '#precos' },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const logoSrc = isDark
    ? '/images/logo/uComis_white.svg'
    : '/images/logo/uComis_black.svg';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/site"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            {mounted ? (
              <Image
                src={logoSrc}
                alt="uComis"
                width={120}
                height={24}
                priority
                className="h-6 w-auto"
              />
            ) : (
              <span className="text-2xl font-bold text-landing-primary">
                uComis
              </span>
            )}
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Desktop */}
          <div className="hidden md:block">
            <Button
              asChild
              className="bg-landing-primary hover:bg-landing-primary/90 text-white"
            >
              <Link href="#precos">Começar Auditoria Grátis</Link>
            </Button>
          </div>

          {/* Menu Mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  {mounted ? (
                    <Image
                      src={logoSrc}
                      alt="uComis"
                      width={120}
                      height={24}
                      className="h-6 w-auto"
                    />
                  ) : (
                    <span className="text-xl font-bold text-landing-primary">
                      uComis
                    </span>
                  )}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="w-full mt-4 bg-landing-primary hover:bg-landing-primary/90 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="#precos">Começar Auditoria Grátis</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
