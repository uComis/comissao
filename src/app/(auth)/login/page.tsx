'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { GoogleOneTap } from '@/components/google-one-tap'

export default function LoginPage() {
  const { signInWithGoogle, signInWithPassword, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.png' : '/images/logo/uComis_black.png'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    const { error } = await signInWithPassword(email, password)

    if (error) {
      setLoading(false)
      toast.error(error)
    } else {
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    await signInWithGoogle()
    setLoading(false)
  }

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center mb-4">
            <Image
              src={logoSrc}
              alt="uComis"
              width={180}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure o Supabase para acessar o sistema
            </p>
            <p className="text-sm text-muted-foreground">
              Adicione as variáveis no arquivo{' '}
              <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>
            </p>
            <pre className="bg-muted p-4 rounded-lg text-xs text-left overflow-auto">
              {`NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key`}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <GoogleOneTap />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-screen items-center justify-center p-4"
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex justify-center"
        >
          <Image
            src={logoSrc}
            alt="uComis"
            width={160}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </motion.div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Suas comissões, sob controle
          </h1>
          <p className="text-sm text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </motion.div>

        {/* Google Login */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Button 
            className="w-full" 
            variant="outline" 
            onClick={handleGoogleLogin}
            disabled={loading}
            size="lg"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
            Continuar com Google
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            className="w-full" 
            type="submit" 
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </motion.form>

        {/* Footer Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center space-y-2 text-sm"
        >
          <Link 
            href="/auth/recuperar-senha" 
            className="block text-muted-foreground hover:text-primary transition-colors"
          >
            Esqueci minha senha
          </Link>
          <div className="text-muted-foreground">
            Não tem uma conta?{' '}
            <Link 
              href="/auth/cadastro" 
              className="text-primary hover:underline font-medium"
            >
              Criar conta
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
    </>
  )
}
