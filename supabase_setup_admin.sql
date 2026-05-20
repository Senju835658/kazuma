-- Siga estes passos no SQL Editor do seu projeto Supabase:

-- 1. Primeiro, você deve criar o usuário manualmente na aba "Authentication" -> "Users" -> "Add User"
-- Use o email: gb835658@gmail.com
-- Use a senha: GT200215

-- 2. Após criar o usuário, pegue o "User ID" (UUID) dele na lista de usuários.

-- 3. Execute o comando abaixo substituindo 'COLE_O_USER_ID_AQUI' pelo ID que você copiou:

/*
INSERT INTO public.admins (user_id, email)
VALUES ('COLE_O_USER_ID_AQUI', 'gb835658@gmail.com');
*/

-- Caso a tabela 'admins' ainda não exista, você pode criá-la com este comando:
/*
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Criar política para que admins possam ler a tabela
CREATE POLICY "Admins can view all admins" ON public.admins
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins));
*/
