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
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const MENU_ITEMS = [
  { label: 'Segurança', href: '#seguranca' },
  { label: 'Perguntas frequentes', href: '/planos' },
];
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export function Header() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    // Pequeno delay para garantir que o estado inicial seja renderizado
    const timeout = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      setScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Site sempre usa logo preto (light mode fixo)
  const logoSrc = '/images/logo/uComis_black.svg';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white transition-all duration-300">
      <div className="container mx-auto px-6 max-w-[1200px]">
        <div className={`relative flex items-center justify-between transition-all duration-500 ease-out ${scrolled ? 'h-14' : 'h-24'}`}>
          {/* Logo à esquerda */}
          <Link
            href="/site"
            className="flex items-center transition-all duration-500 ease-out hover:opacity-80"
          >
            <div
              className={`${scrolled ? 'h-6 w-[120px]' : 'h-9 w-[160px]'} flex items-center transition-all duration-500 ease-out`}
              style={mounted ? {
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 500ms ease-out, transform 500ms ease-out'
              } : {
                opacity: 0,
                transform: 'translateY(-10px)'
              }}
            >
              <Image
                src={logoSrc}
                alt="uComis"
                width={160}
                height={36}
                priority
                className={`transition-all duration-500 ease-out ${scrolled ? 'h-6 w-auto' : 'h-9 w-auto'}`}
              />
            </div>
          </Link>

          {/* Menu Desktop - centralizado */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {MENU_ITEMS.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                style={mounted ? {
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'opacity 400ms ease-out, transform 400ms ease-out',
                  transitionDelay: `${150 + index * 100}ms`
                } : {
                  opacity: 0,
                  transform: 'translateY(-10px)'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Desktop e Mobile */}
          <div className="flex items-center gap-3">
            {/* CTA Desktop */}
            <div
              className="hidden md:flex items-center gap-3"
              style={mounted ? {
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 500ms ease-out, transform 500ms ease-out',
                transitionDelay: '450ms'
              } : {
                opacity: 0,
                transform: 'translateY(-8px)'
              }}
            >
              {!loading && user ? (
                <>
                  <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || ''} />
                          <AvatarFallback className="bg-landing-primary text-white text-xs">
                            {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="end"
                      className="w-[200px] p-2 bg-white border-gray-200 shadow-lg"
                      sideOffset={8}
                    >
                      <div className="px-2 py-1.5 text-sm text-gray-500 truncate border-b border-gray-100 mb-1">
                        {user.email}
                      </div>
                      <Link
                        href="/"
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Ir para o app
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </PopoverContent>
                  </Popover>
                  <Button
                    asChild
                    className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 px-3 text-sm h-8"
                  >
                    <Link href="/">Ir para o app</Link>
                  </Button>
                </>
              ) : (
                <>
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
                    <Link href="/login">Comece agora</Link>
                  </Button>
                </>
              )}
            </div>

            {/* CTA Mobile - botões no header */}
            <div className="flex items-center gap-2 md:hidden">
              {!loading && user ? (
                <>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || ''} />
                    <AvatarFallback className="bg-landing-primary text-white text-xs">
                      {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    asChild
                    className="bg-landing-primary hover:bg-landing-primary/90 text-white rounded-full transition-all duration-300 px-2 text-xs h-7"
                  >
                    <Link href="/">Ir para o app</Link>
                  </Button>
                </>
              ) : (
                <>
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
                    <Link href="/login">Comece agora</Link>
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
