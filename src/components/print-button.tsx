'use client'

export function PrintButton() {
  return (
    <div className="fixed bottom-6 right-6 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-black text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors font-medium"
      >
        Imprimir / Salvar PDF
      </button>
    </div>
  )
}

