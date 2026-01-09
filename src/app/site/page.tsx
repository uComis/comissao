import { Navbar } from "@/components/site/theme_1/navbar";
import Hero from "@/components/sections/hero/default";
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
        mockup={false}
      />
    </div>
  );
}
