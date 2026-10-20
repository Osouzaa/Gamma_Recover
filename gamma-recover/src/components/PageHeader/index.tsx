import { Actions, PageHeading } from './styles';
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <PageHeading>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <Actions>{actions}</Actions>}
    </PageHeading>
  );
}
