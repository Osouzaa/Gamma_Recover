import { Logo } from '../../../../components/Logo';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAdminAuth } from '../../../../app/providers/AdminAuth';
import {
  adminReturnPath,
  demoAccounts,
  loginSchema,
  signInAdmin,
} from '../../../../services/adminSession';
import { useAction } from '../../../../hooks/useDatabase';
import { Alert, Button, Field, Form, Input } from '../../../../components/ui';
import * as S from './styles';
export default function Login() {
  const { session } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const action = useAction();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const selectedEmail = watch('email');
  const from = adminReturnPath(location.state?.from);
  if (session) return <Navigate to={from} replace />;
  return (
    <S.Page>
      <S.BrandPanel>
        <Logo inverse size={48} />
        <S.Introduction>
          <h2>
            Da carteira ao
            <br />
            recebimento.
          </h2>
          <p>
            Empresas, atendimentos e acordos conectados para sua equipe acompanhar cada negociação.
          </p>
          <S.Workflow aria-label="Fluxo da operação">
            <li>
              <span>Empresas e carteiras</span>
              <small>Organize a base de cada contratante.</small>
            </li>
            <li>
              <span>Atendimento e negociação</span>
              <small>Conduza cada contato com histórico e contexto.</small>
            </li>
            <li>
              <span>Acordos e recebimentos</span>
              <small>Acompanhe as condições e a conciliação.</small>
            </li>
          </S.Workflow>
        </S.Introduction>
        <footer>Gamma Estratégia & Consultoria</footer>
      </S.BrandPanel>
      <S.FormArea>
        <S.Content>
          <header>
            <S.AccessLabel>Acesso da equipe</S.AccessLabel>
            <h1>Entrar no Gamma Recover</h1>
            <p>Informe seus dados para acessar a operação.</p>
          </header>
          <Form
            onSubmit={handleSubmit((values) =>
              action.mutate(() => signInAdmin(values), {
                onSuccess: () => navigate(from, { replace: true }),
              }),
            )}
          >
            <Field>
              E-mail
              <Input
                placeholder="seu.email@empresa.com"
                spellCheck={false}
                autoCapitalize="none"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <small id="login-email-error" role="alert">
                  {errors.email.message}
                </small>
              )}
            </Field>
            <Field>
              Senha
              <S.Password>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </S.Password>
              {errors.password && (
                <small id="login-password-error" role="alert">
                  {errors.password.message}
                </small>
              )}
            </Field>
            {action.error && (
              <Alert role="alert" $error>
                {action.error.message}
              </Alert>
            )}
            <Button type="submit" $variant="primary" disabled={action.isPending}>
              <LogIn />
              {action.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </Form>
          <S.DemoAccess>
            <summary>Experimentar com um perfil de demonstração</summary>
            <p>Escolha um perfil para preencher o acesso. Depois, clique em Entrar.</p>
            <S.ProfileList>
              {demoAccounts.map((account) => (
                <button
                  type="button"
                  key={account.email}
                  aria-label={`Usar perfil ${account.role}`}
                  aria-pressed={selectedEmail === account.email}
                  disabled={action.isPending}
                  onClick={() => {
                    setValue('email', account.email, { shouldValidate: true });
                    setValue('password', 'Gamma@123', { shouldValidate: true });
                    action.reset();
                  }}
                >
                  <span>{account.role}</span>
                  <small>{account.email}</small>
                </button>
              ))}
            </S.ProfileList>
            <p>
              Senha dos perfis: <strong>Gamma@123</strong>
            </p>
          </S.DemoAccess>
          <footer>
            Ambiente de demonstração. Use somente contas e dados fictícios. O acesso de produção
            depende de autenticação em backend.
          </footer>
        </S.Content>
      </S.FormArea>
    </S.Page>
  );
}
