'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Instagram, Mail } from 'lucide-react';

const LINKS_PRODUTO = [
  { label: 'Segurança', href: '#seguranca' },
  { label: 'Preços', href: '#precos' },
  { label: 'Perguntas frequentes', href: '#faq' },
  { label: 'Ajuda', href: '/site/ajuda' },
];

const LINKS_LEGAL = [
  { label: 'Privacidade', href: '/privacidade' },
  { label: 'Termos de Uso', href: '/termos' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'Email', href: 'mailto:suporte@ucomis.com.br', icon: Mail },
];

export function Footer() {
  const pathname = usePathname();
  const isOnSitePage = pathname === '/site' || pathname === '/site/';

  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-6 py-12 max-w-[1200px]">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Logo à esquerda */}
          <div>
            <Link href="/site" className="inline-block">
              <Image
                src="/images/logo/uComis_black.svg"
                alt="uComis"
                width={120}
                height={24}
                className="h-6 w-auto"
              />
            </Link>
          </div>

          {/* Colunas de links */}
          <div className="flex gap-12 md:gap-16">
            {/* Coluna Produto */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Produto</h4>
              <nav className="flex flex-col gap-2">
                {LINKS_PRODUTO.map((link) => {
                  const isAnchorLink = link.href.startsWith('#');

                  if (isAnchorLink) {
                    return (
                      <a
                        key={link.href}
                        href={isOnSitePage ? link.href : `/site${link.href}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Coluna Legal */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <nav className="flex flex-col gap-2">
                {LINKS_LEGAL.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Copyright e ícones sociais à direita */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()}
            </p>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                    title={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
