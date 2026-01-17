import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin } from 'lucide-react';

const LINKS_LEGAIS = [
  { label: 'Política de Privacidade', href: '/privacidade' },
  { label: 'Termos de Uso', href: '/termos' },
];

const REDES_SOCIAIS = [
  { label: 'LinkedIn', href: '#', icon: '💼' },
  { label: 'Instagram', href: '#', icon: '📸' },
  { label: 'YouTube', href: '#', icon: '▶️' },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-6 py-12 max-w-[1200px]">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Informações Institucionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-landing-primary">uComis</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Brasília/DF - Águas Claras</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:suporte@ucomis.com.br"
                  className="hover:text-foreground transition-colors"
                >
                  suporte@ucomis.com.br
                </a>
              </div>
              <p className="pt-2">CNPJ: XX.XXX.XXX/XXXX-XX</p>
            </div>
          </div>

          {/* Links Legais */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Legal</h4>
            <nav className="flex flex-col gap-2">
              {LINKS_LEGAIS.map((link) => (
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

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Conteúdo Educativo</h4>
            <div className="flex gap-4">
              {REDES_SOCIAIS.map((rede) => (
                <a
                  key={rede.label}
                  href={rede.href}
                  className="text-2xl hover:opacity-70 transition-opacity"
                  aria-label={rede.label}
                  title={rede.label}
                >
                  {rede.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} uComis. Todos os direitos reservados.
          </p>
          <p className="mt-2">
            Focado na proteção e independência do vendedor autônomo.
          </p>
        </div>
      </div>
    </footer>
  );
}
