"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { UserIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logo =
    mounted && theme === "dark"
      ? "/images/logo/uComis_white.svg"
      : "/images/logo/uComis_black.svg";

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo e Menu Desktop - Agrupados à esquerda */}
          <div className="flex items-center gap-12">
            <Link href="/site" className="flex items-center space-x-2">
              <Image
                src={logo}
                alt="uComis"
                width={90}
                height={22}
                className="h-6 w-auto"
                priority
              />
            </Link>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#funcionalidades"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="#precos"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Preços
            </Link>
            <Link
              href="#sobre"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="#contato"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Contato
            </Link>
            </div>
          </div>

          {/* Ações - Mais próximas */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login" title="Login">
                <UserIcon className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" asChild>
              <a 
                href="/api/auth/google" 
                title="Login com Google"
                className="flex items-center justify-center"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </a>
            </Button>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Alternar tema"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
