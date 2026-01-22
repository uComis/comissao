'use client'

// Esta rota dinâmica renderiza o mesmo conteúdo da página principal
// A lógica de qual seção mostrar é baseada na URL (usePathname)
// então ambos os componentes funcionam da mesma forma
import MinhaContaPage from '../page'

export default function MinhaContaSectionPage() {
  return <MinhaContaPage />
}
