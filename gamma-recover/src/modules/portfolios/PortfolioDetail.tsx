import { Link } from 'react-router-dom';
import type { Database, Portfolio } from '../../types/domain';
import { date, money } from '../../utils/format';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { Muted, Panel, PanelHeader, PanelBody, Stack, Status, Row } from '../../components/ui';
export function PortfolioDetail({
  portfolio,
  db,
  onClose,
}: {
  portfolio: Portfolio;
  db: Database;
  onClose: () => void;
}) {
  const debts = db.debts.filter((d) => d.portfolioId === portfolio.id);
  const imports = db.imports.filter((i) => i.portfolioId === portfolio.id);
  return (
    <Modal title={portfolio.name} onClose={onClose}>
      <Stack>
        <Row>
          <Status>{portfolio.active ? 'Ativo' : 'Inativo'}</Status>
          <Muted>Criada em {date(portfolio.createdAt)}</Muted>
        </Row>
        <p>{db.creditors.find((c) => c.id === portfolio.creditorId)?.name}</p>
        <Panel>
          <PanelHeader>
            <h2>{debts.length} contratos vinculados</h2>
          </PanelHeader>
          <DataTable
            rows={debts}
            rowKey={(d) => d.id}
            pageSize={4}
            columns={[
              {
                key: 'ref',
                label: 'Contrato / pessoa',
                render: (d) => (
                  <>
                    {d.reference}
                    <small>{db.debtors.find((v) => v.id === d.debtorId)?.name}</small>
                  </>
                ),
              },
              {
                key: 'value',
                label: 'Valor original',
                numeric: true,
                render: (d) => money(d.amount),
              },
              {
                key: 'link',
                label: 'Cadastro',
                render: (d) => <Link to={`/devedores/${d.debtorId}`}>Consultar</Link>,
              },
            ]}
          />
        </Panel>
        <Panel>
          <PanelHeader>
            <h2>Histórico de importações</h2>
          </PanelHeader>
          <PanelBody>
            {imports.length ? (
              imports.map((i) => (
                <p key={i.id}>
                  {date(i.date)} · {i.filename} · {i.count} contratos
                </p>
              ))
            ) : (
              <Muted>Nenhuma importação nesta carteira.</Muted>
            )}
          </PanelBody>
        </Panel>
      </Stack>
    </Modal>
  );
}
