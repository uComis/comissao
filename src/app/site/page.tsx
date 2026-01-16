import { Navbar } from "@/components/site/theme_1/navbar";
import Hero from "@/components/sections/hero/default";
import Screenshot from "@/components/ui/screenshot";
import { ArrowRight } from "lucide-react";

export default function SitePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero
        title="uComis é a ferramenta ideal para gerenciar suas comissões"
        description="Conheça o sistema moderno para gestão de comissões de vendas. Simplifique cálculos, acompanhe vendedores e automatize pagamentos."
        badge={false}
        buttons={[
          {
            href: "/onboarding",
            text: "Começar agora",
            variant: "default",
          },
          {
            href: "#funcionalidades",
            text: "Novo: Integração com Pipedrive",
            variant: "outline",
            iconRight: <ArrowRight className="ml-2 size-4" />,
          },
        ]}
        mockup={
          <Screenshot
            srcLight="/images/landing/light-desktop-1.png"
            srcDark="/images/landing/desktop-1.png"
            alt="Dashboard do uComis - Sistema de gestão de comissões"
            width={1248}
            height={765}
            className="w-full"
          />
        }
      />
    </div>
  );
}
