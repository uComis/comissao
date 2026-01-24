'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RecuperarSenhaPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const logoSrc = isDark ? '/images/logo/uComis_white.png' : '/images/logo/uComis_black.png'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      toast.error(error)
    } else {
      setEmailSent(true)
      toast.success('Email de recuperação enviado!')
    }
  }

  if (emailSent) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex min-h-screen items-center justify-center bg-background p-4"
      >
        <div className="w-full max-w-sm space-y-8 text-center">
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

          <div className="space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
            >
              <Mail className="h-8 w-8 text-primary" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-2xl font-semibold tracking-tight">
                Verifique seu email
              </h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para
              </p>
              <p className="text-sm font-medium">
                {email}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="space-y-3 pt-4"
            >
              <p className="text-sm text-muted-foreground">
                Clique no link no email para redefinir sua senha.
              </p>
              <p className="text-xs text-muted-foreground">
                O link expira em 1 hora. Não recebeu? Verifique a pasta de spam.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="pt-4"
            >
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
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
            Esqueceu sua senha?
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite seu email e enviaremos um link de recuperação
          </p>
        </motion.div>

        {/* Recovery Form */}
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
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
              autoFocus
            />
          </div>

          <Button 
            className="w-full" 
            type="submit" 
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar link de recuperação
          </Button>
        </motion.form>

        {/* Back to login */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center"
        >
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm">
              <ArrowLeft className="mr-2 h-3 w-3" />
              Voltar ao login
            </Button>
          </Link>
        </motion.div>

        {/* Help text */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center space-y-2 pt-4"
        >
          <p className="text-xs text-muted-foreground">
            Lembrou sua senha?{' '}
            <Link 
              href="/login" 
              className="text-primary hover:underline font-medium"
            >
              Fazer login
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Não tem uma conta?{' '}
            <Link 
              href="/auth/cadastro" 
              className="text-primary hover:underline font-medium"
            >
              Criar conta
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
