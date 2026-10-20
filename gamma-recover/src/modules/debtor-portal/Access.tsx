import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { openPortalSession } from '../../services/portalSession';
import {
  Button,
  Field,
  Form,
  Input,
  Panel,
  PanelBody,
  Select,
  Stack,
  Alert,
} from '../../components/ui';
import { Access } from './styles';
export default function PortalAccess() {
  const { data: db } = useDatabase();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [debtorId, setDebtorId] = useState('dv-10');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  return (
    <Access>
      <h1>Seu espaço de negociação</h1>
      <p>
        Consulte contratos fictícios, conheça as condições disponíveis e acompanhe seus acordos
        demonstrativos.
      </p>
      <Panel>
        <PanelBody>
          {stage === 0 ? (
            <Stack>
              <h2>Acesso à demonstração</h2>
              <p>
                Escolha uma pessoa fictícia e explore o fluxo de negociação. Nenhuma consulta a
                dados reais ? realizada.
              </p>
              <Button $variant="primary" onClick={() => setStage(1)}>
                Iniciar acesso demonstrativo
              </Button>
              <Link to="/">Voltar ao painel administrativo</Link>
            </Stack>
          ) : stage === 1 ? (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                setStage(2);
              }}
            >
              <h2>Identificação demonstrativa</h2>
              <Field>
                Pessoa fictícia
                <Select value={debtorId} onChange={(e) => setDebtorId(e.target.value)}>
                  {db?.debtors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.document}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button $variant="primary">Continuar para verificação</Button>
              <Button type="button" onClick={() => setStage(0)}>
                Voltar
              </Button>
            </Form>
          ) : (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (code !== '123456') {
                  setError('Código demonstrativo inválido. Use 123456.');
                  return;
                }
                if (!db?.debtors.some((d) => d.id === debtorId)) {
                  setError('Pessoa fictícia indisponível.');
                  return;
                }
                try {
                  openPortalSession(debtorId);
                  navigate('/portal/dividas');
                } catch {
                  setError(
                    'Não foi possível abrir a sessão. Habilite o armazenamento desta página.',
                  );
                }
              }}
            >
              <h2>Verificação demonstrativa</h2>
              <Alert>
                Nenhum código foi enviado. Digite <strong>123456</strong> para simular a
                verificação.
              </Alert>
              <Field>
                Código demonstrativo
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="off"
                />
              </Field>
              {error && (
                <Alert $error role="alert">
                  {error}
                </Alert>
              )}
              <Button $variant="primary">Acessar sessão demonstrativa</Button>
              <Button type="button" onClick={() => setStage(1)}>
                Voltar
              </Button>
            </Form>
          )}
        </PanelBody>
      </Panel>
    </Access>
  );
}
