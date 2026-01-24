'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const logoSrc = '/images/logo/uComis_black.png';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white transition-all duration-300">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-12' : 'h-20'}`}>
          {/* Logo e Menu agrupados - próximos da logo */}
          <div className="flex items-center gap-24">
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

            {/* Menu Desktop - aparece todos juntos */}
            <nav className="hidden md:flex items-center gap-8">
            {MENU_ITEMS.map((item) => {
              const animationDuration = 400;
              const animationDelay = 200; // Todos aparecem ao mesmo tempo
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  style={mounted ? { 
                    opacity: 0,
                    animation: `fadeIn ${animationDuration}ms ease-out forwards`,
                    animationDelay: `${animationDelay}ms`
                  } : { opacity: 0 }}
                >
                  {item.label}
                </Link>
              );
            })}
            </nav>
          </div>

          {/* CTA Desktop e Menu Mobile */}
          <div className="flex items-center gap-3">
            {/* CTA Desktop - slide down quando Preços terminar (400ms início + 400ms duração = 800ms) */}
            <div 
              className="hidden md:flex items-center gap-3"
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
                variant="ghost"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300 px-3 text-sm h-8"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 px-3 text-sm h-8"
              >
                <Link href="#precos">Comece agora</Link>
              </Button>
            </div>

            {/* CTA Mobile - botões no header */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                asChild
                variant="ghost"
                className="text-gray-700 hover:text-gray-900 rounded-full transition-all duration-300 px-3 text-sm h-8"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 px-2 text-xs h-7"
              >
                <Link href="#precos">Comece agora</Link>
              </Button>
            </div>

            {/* Menu Mobile */}
            <Popover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <PopoverTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Toggle menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="bottom" 
                align="end" 
                className="w-[280px] p-4 bg-white border-gray-200 shadow-lg"
                sideOffset={8}
              >
                <nav className="flex flex-col gap-3">
                  {MENU_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-1.5 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
}
