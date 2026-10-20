import type { Campaign, Database } from '../../types/domain';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import { Alert, Stack, Status } from '../../components/ui';
export function AudienceDialog({
  campaign,
  db,
  onClose,
}: {
  campaign: Campaign;
  db: Database;
  onClose: () => void;
}) {
  const debts = db.debts.filter((d) => campaign.audience.includes(d.id));
  return (
    <Modal title={campaign.name} onClose={onClose}>
      <Stack>
        <Status>{campaign.status}</Status>
        <Alert>
          Segmentação na criação: atraso mínimo de {campaign.minDays} dias. O público abaixo é a
          seleção preservada da campanha; não representa mensagens enviadas.
        </Alert>
        <DataTable
          rows={debts}
          rowKey={(d) => d.id}
          pageSize={5}
          empty="Nenhum contrato elegível na criação da campanha."
          columns={[
            {
              key: 'name',
              label: 'Pessoa fictícia',
              render: (d) => db.debtors.find((v) => v.id === d.debtorId)?.name,
            },
            { key: 'reference', label: 'Contrato', render: (d) => d.reference },
            {
              key: 'link',
              label: 'Cadastro',
              render: (d) => <Link to={`/devedores/${d.debtorId}`}>Consultar</Link>,
            },
          ]}
        />
      </Stack>
    </Modal>
  );
}
