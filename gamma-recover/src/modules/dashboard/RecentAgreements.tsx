import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Database } from '../../types/domain';
import type { DashboardOverview } from '../../services/dashboard';
import { agreementStatus } from '../../services/domain';
import { date, money } from '../../utils/format';
import { DataTable } from '../../components/DataTable';
import { Panel, PanelHeader, Status } from '../../components/ui';
export function RecentAgreements({ db, overview }: { db: Database; overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader>
        <h2>Acordos recentes</h2>
        <Link to="/acordos">
          Ver todos <ArrowRight size={12} />
        </Link>
      </PanelHeader>
      <DataTable
        rows={overview.recentAgreements}
        rowKey={(a) => a.id}
        pageSize={5}
        empty="Nenhum acordo formalizado no período selecionado."
        columns={[
          {
            key: 'debtor',
            label: 'Devedor / acordo',
            render: (a) => (
              <>
                {
                  db.debtors.find((d) => d.id === db.debts.find((d) => d.id === a.debtId)?.debtorId)
                    ?.name
                }
                <small>{a.id.slice(0, 14)}</small>
              </>
            ),
          },
          {
            key: 'date',
            label: 'Formalização',
            render: (a) => date(a.createdAt),
            sortValue: (a) => a.createdAt,
          },
          {
            key: 'amount',
            label: 'Negociado',
            numeric: true,
            render: (a) => money(a.total),
            sortValue: (a) => a.total,
          },
          {
            key: 'status',
            label: 'Situação atual',
            render: (a) => <Status>{agreementStatus(db, a)}</Status>,
          },
          {
            key: 'actions',
            label: 'Detalhes',
            render: (a) => <Link to={`/acordos?acordo=${a.id}`}>Consultar</Link>,
          },
        ]}
      />
    </Panel>
  );
}
