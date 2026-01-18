import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter, Mail } from 'lucide-react';

const LINKS_PRODUCT = [
  { label: 'Funcionalidades', href: '#solucoes' },
  { label: 'Segurança', href: '#seguranca' },
  { label: 'Preços', href: '#precos' },
];

const LINKS_RESOURCES = [
  { label: 'Documentação', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
];

const LINKS_LEGAL = [
  { label: 'Política de Privacidade', href: '/privacidade' },
  { label: 'Termos de Uso', href: '/termos' },
  { label: 'Contato', href: 'mailto:suporte@ucomis.com.br' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'Twitter', href: '#', icon: Twitter },
  { label: 'Email', href: 'mailto:suporte@ucomis.com.br', icon: Mail },
];

export function Footer() {
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

          {/* Três colunas de links no centro */}
          <div className="flex flex-wrap gap-8 md:gap-12 flex-1 justify-center">
            {/* Coluna 1: Product */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Product</h4>
              <nav className="flex flex-col gap-2">
                {LINKS_PRODUCT.map((link) => (
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

            {/* Coluna 2: Resources */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Resources</h4>
              <nav className="flex flex-col gap-2">
                {LINKS_RESOURCES.map((link) => (
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

            {/* Coluna 3: Legal */}
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
          <div className="flex flex-col items-end gap-3">
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
