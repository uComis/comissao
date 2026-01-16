'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Site sempre usa logo preto (light mode fixo)
  const logoSrc = '/images/logo/uComis_black.svg';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 transition-all duration-300 border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-12' : 'h-14'}`}>
          {/* Logo - reserva espaço mesmo quando não carregada, anima mais devagar */}
          <Link
            href="/site"
            className="flex items-center transition-all duration-300 hover:opacity-80"
          >
            <div className={`${scrolled ? 'h-5 w-[120px]' : 'h-6 w-[120px]'} flex items-center`}>
              {mounted && (
                <Image
                  src={logoSrc}
                  alt="uComis"
                  width={120}
                  height={24}
                  priority
                  className={`transition-all duration-300 animate-in fade-in duration-700 ${scrolled ? 'h-5 w-auto' : 'h-6 w-auto'}`}
                />
              )}
            </div>
          </Link>

          {/* Menu Desktop - aparece em sequência */}
          <nav className="hidden md:flex items-center gap-8">
            {MENU_ITEMS.map((item, index) => {
              // Soluções: começa em 300ms, dura 400ms | Segurança: começa em 500ms (metade de Soluções), dura 400ms | Preços: começa em 700ms (metade de Segurança), dura 400ms
              const delays = [200, 300, 400]; // Soluções, Segurança, Preços
              const animationDuration = 400;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  style={mounted ? { 
                    opacity: 0,
                    animation: `fadeIn ${animationDuration}ms ease-out forwards`,
                    animationDelay: `${delays[index]}ms`
                  } : { opacity: 0 }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA Desktop - slide down quando Preços terminar (400ms início + 400ms duração = 800ms) */}
          <div 
            className="hidden md:block"
            style={mounted ? { 
              opacity: 0,
              transform: 'translateY(-8px)',
              animation: 'slideDown 500ms ease-out 500ms forwards'
            } : { 
              opacity: 0,
              transform: 'translateY(-8px)'
            }}
          >
            <Button
              asChild
              className={`bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 ${scrolled ? 'px-4 text-sm h-8' : 'px-6 h-10'}`}
            >
              <Link href="#precos">Comece agora</Link>
            </Button>
          </div>

          {/* Menu Mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white border-gray-200">
              <SheetHeader>
                <SheetTitle>
                  {mounted && (
                    <Image
                      src={logoSrc}
                      alt="uComis"
                      width={120}
                      height={24}
                      className="h-6 w-auto animate-in fade-in"
                    />
                  )}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="w-full mt-4 bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="#precos">Comece agora</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
