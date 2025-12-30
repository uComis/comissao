-- Adicionar flag de super admin (nível SISTEMA) na tabela de perfis
-- Observação: no projeto, o email fica em auth.users, e o perfil fica em public.profiles.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Definir usuário default como super admin (se existir)
UPDATE public.profiles p
SET is_super_admin = true
FROM auth.users u
WHERE u.id = p.user_id
  AND lower(u.email) = lower('marcelostsh@gmail.com');

-- RLS: por enquanto, a lógica de super admin será aplicada no nível da aplicação (backend).
