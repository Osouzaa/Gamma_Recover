import type { Creditor, Database } from '../../types/domain';
import { date } from '../../utils/format';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import { Alert, Button, DetailList, Stack } from '../../components/ui';
export function CompanyDetail({
  company,
  db,
  onClose,
}: {
  company: Creditor;
  db: Database;
  onClose: () => void;
}) {
  const profile = company.profile;
  const portfolios = db.portfolios.filter((p) => p.creditorId === company.id);
  const imports = db.imports.filter((i) => portfolios.some((p) => p.id === i.portfolioId));
  return (
    <Modal title={company.name} onClose={onClose}>
      <Stack>
        <DetailList>
          <dt>Documento fictício</dt>
          <dd>{company.document}</dd>
          <dt>Nome fantasia</dt>
          <dd>{profile?.tradeName || 'Não informado'}</dd>
          <dt>Contato</dt>
          <dd>
            {profile
              ? `${profile.contactName} · ${profile.phone} · ${profile.email}`
              : 'Cadastro a complementar'}
          </dd>
          <dt>Endereço</dt>
          <dd>{profile?.address || 'Não informado'}</dd>
          <dt>Responsável Gamma</dt>
          <dd>{profile?.manager || 'Não informado'}</dd>
          <dt>Observações</dt>
          <dd>{profile?.notes || 'Nenhuma'}</dd>
        </DetailList>
        <h3>Contrato de prestação de serviços</h3>
        <DetailList>
          <dt>Referência</dt>
          <dd>{profile?.contract.reference || 'Não informada'}</dd>
          <dt>Vigência</dt>
          <dd>
            {profile?.contract.startDate
              ? date(profile.contract.startDate)
              : 'Sem início informado'}{' '}
            até {profile?.contract.endDate ? date(profile.contract.endDate) : 'prazo não informado'}
          </dd>
          <dt>Condições</dt>
          <dd>{profile?.contract.terms || 'Não informadas'}</dd>
        </DetailList>
        {profile?.contract.attachment ? (
          <Button
            onClick={() => {
              const attachment = profile.contract.attachment!;
              const bytes = Uint8Array.from(atob(attachment.data.split(',')[1]), (c) =>
                c.charCodeAt(0),
              );
              const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
              const link = document.createElement('a');
              link.href = url;
              link.download = attachment.name;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Baixar contrato: {profile.contract.attachment.name}
          </Button>
        ) : (
          <p>Sem contrato anexado.</p>
        )}
        <Alert>
          As condições comerciais são cadastrais. Comissões e repasses não são calculados nesta
          versão.
        </Alert>
        <h3>Carteiras vinculadas</h3>
        <DataTable
          rows={portfolios}
          rowKey={(p) => p.id}
          columns={[
            { key: 'name', label: 'Carteira', render: (p) => p.name },
            {
              key: 'count',
              label: 'Dívidas',
              render: (p) => db.debts.filter((d) => d.portfolioId === p.id).length,
            },
          ]}
        />
        <h3>Histórico de importações</h3>
        <DataTable
          rows={imports}
          rowKey={(i) => i.id}
          columns={[
            { key: 'date', label: 'Data', render: (i) => date(i.date) },
            { key: 'filename', label: 'Arquivo', render: (i) => i.filename },
            {
              key: 'portfolio',
              label: 'Carteira',
              render: (i) => portfolios.find((p) => p.id === i.portfolioId)?.name,
            },
            { key: 'actor', label: 'Importado por', render: (i) => i.actor || 'Registro anterior' },
            { key: 'count', label: 'Contratos', render: (i) => i.count },
          ]}
        />
      </Stack>
    </Modal>
  );
}
