import { getProducts } from '@/app/actions/products'
import { ProdutosClient } from './client'

export default async function ProdutosPage() {
  const products = await getProducts()

  return <ProdutosClient initialProducts={products} />
}
