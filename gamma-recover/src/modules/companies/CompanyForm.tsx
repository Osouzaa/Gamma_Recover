import { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { CompanySection, CompanyGrid, UploadArea, FormActions } from './formStyles';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { CreditorService, companySchema } from '../../services/admin';
import { emptyCompanyProfile, readContract } from '../../services/companySchema';
import type { Creditor } from '../../types/domain';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Alert, Button, Field, Form, Input, Row, Textarea } from '../../components/ui';
export function CompanyForm({
  company,
  onClose,
}: {
  company: Creditor | null;
  onClose: () => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<Error>();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      document: company?.document || 'DEMO-',
      profile: company?.profile || structuredClone(emptyCompanyProfile),
    },
  });
  const attachment = watch('profile.contract.attachment');
  return (
    <Modal wide title={company ? 'Editar empresa' : 'Nova empresa contratante'} onClose={onClose}>
      <Form
        onSubmit={handleSubmit((values) =>
          action.mutate(() => CreditorService.saveCompany(scope, values, company?.id), {
            onSuccess: onClose,
          }),
        )}
      >
        <Alert>
          Ambiente demonstrativo. Use somente empresas, contatos e contratos fictícios. Configure a
          política de negociação antes de iniciar a operação.
        </Alert>
        <CompanySection>
          <h3>Dados da empresa</h3>
          <p>Identificação e contatos da empresa contratante.</p>
          <CompanyGrid>
            <Field>
              Razão social
              <Input
                autoFocus
                placeholder="Ex.: Horizonte Serviços Ltda. (fictícia)"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <small>{errors.name?.message}</small>
            </Field>
            <Field>
              CNPJ / documento fictício
              <Input
                aria-invalid={!!errors.document}
                {...register('document')}
                placeholder="DEMO-CNPJ-001"
              />
              <small>{errors.document?.message}</small>
            </Field>
            <Field>
              Nome fantasia
              <Input placeholder="Ex.: Horizonte Serviços" {...register('profile.tradeName')} />
            </Field>
            <Field>
              Contato responsável
              <Input
                placeholder="Ex.: Ana Exemplo"
                aria-invalid={!!errors.profile?.contactName}
                {...register('profile.contactName')}
              />
              <small>{errors.profile?.contactName?.message}</small>
            </Field>
            <Field>
              Telefone
              <Input
                type="tel"
                placeholder="(00) 00000-0000"
                aria-invalid={!!errors.profile?.phone}
                {...register('profile.phone')}
              />
              <small>{errors.profile?.phone?.message}</small>
            </Field>
            <Field>
              E-mail
              <Input
                type="email"
                placeholder="contato@example.invalid"
                aria-invalid={!!errors.profile?.email}
                {...register('profile.email')}
              />
              <small>{errors.profile?.email?.message}</small>
            </Field>
            <Field>
              Endereço
              <Input
                placeholder="Rua, número, bairro, cidade e UF"
                {...register('profile.address')}
              />
            </Field>
            <Field>
              Responsável interno Gamma
              <Input
                placeholder="Nome de quem acompanha esta empresa"
                aria-invalid={!!errors.profile?.manager}
                {...register('profile.manager')}
              />
              <small>{errors.profile?.manager?.message}</small>
            </Field>
          </CompanyGrid>
        </CompanySection>
        <CompanySection>
          <h3>Contrato de prestação de serviços</h3>
          <p>
            Contrato da Gamma com esta empresa. Os contratos das dívidas são importados nas
            carteiras.
          </p>
          <Field>
            Referência do contrato (opcional)
            <Input
              placeholder="Ex.: SERVICO-DEMO-001"
              {...register('profile.contract.reference')}
            />
          </Field>
          <CompanyGrid>
            <Field>
              Início da vigência
              <Input
                type="date"
                aria-invalid={!!errors.profile?.contract?.startDate}
                {...register('profile.contract.startDate')}
              />
              <small>{errors.profile?.contract?.startDate?.message}</small>
            </Field>
            <Field>
              Fim da vigência
              <Input
                type="date"
                aria-invalid={!!errors.profile?.contract?.endDate}
                {...register('profile.contract.endDate')}
              />
              <small>{errors.profile?.contract?.endDate?.message}</small>
            </Field>
          </CompanyGrid>
          <Field>
            Serviços e condições comerciais
            <Textarea
              placeholder="Descreva os serviços contratados e as condições acordadas..."
              {...register('profile.contract.terms')}
              maxLength={2000}
            />
          </Field>
          <UploadArea $selected={!!attachment} aria-busy={reading}>
            {attachment ? (
              <FileText size={24} aria-hidden="true" />
            ) : (
              <Upload size={24} aria-hidden="true" />
            )}
            <div>
              <strong>{attachment ? attachment.name : 'Anexe o contrato da empresa'}</strong>
              <p>{reading ? 'Lendo arquivo…' : 'PDF de até 2 MB · opcional'}</p>
            </div>
            <label>
              <span>{attachment ? 'Substituir PDF' : 'Selecionar PDF'}</span>
              <input
                aria-label="Contrato PDF opcional (até 2 MB)"
                aria-invalid={!!fileError}
                type="file"
                accept=".pdf,application/pdf"
                disabled={reading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setReading(true);
                  setFileError(undefined);
                  try {
                    setValue('profile.contract.attachment', await readContract(file), {
                      shouldDirty: true,
                    });
                  } catch (error) {
                    setFileError(
                      error instanceof Error ? error : new Error('Falha ao ler arquivo.'),
                    );
                  } finally {
                    setReading(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </UploadArea>
          {attachment && (
            <Row>
              <Button
                type="button"
                onClick={() => {
                  setValue('profile.contract.attachment', undefined, { shouldDirty: true });
                  setFileError(undefined);
                }}
              >
                Remover anexo
              </Button>
            </Row>
          )}
        </CompanySection>
        <CompanySection>
          <Field>
            Observações
            <Textarea
              placeholder="Informações adicionais para a equipe, se necessário..."
              {...register('profile.notes')}
              maxLength={2000}
            />
          </Field>
        </CompanySection>
        <Feedback error={fileError || action.error} />
        {fileError && (
          <Button type="button" onClick={() => setFileError(undefined)}>
            Continuar sem substituir o anexo
          </Button>
        )}
        <FormActions>
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button $variant="primary" disabled={action.isPending || reading || !!fileError}>
            {reading ? 'Lendo contrato…' : action.isPending ? 'Salvando…' : 'Salvar empresa'}
          </Button>
        </FormActions>
      </Form>
    </Modal>
  );
}
