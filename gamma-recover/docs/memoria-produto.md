# Memória de produto — Gamma Recover

## Padrão aprovado em 20/10/2026

O usuário aprovou aplicar as propostas de Operação, Indicadores, Réguas e Conversas à plataforma e seguir esse padrão nas próximas entregas. A implementação e os limites estão em `docs/padrao-operacional.md`; a identidade permanece Gamma e o escopo permanece demonstrativo.

## Decisão de 20/10/2026

Após a análise do estudo de mercado, o usuário escolheu manter a demonstração por enquanto. Backend, banco centralizado, usuários reais e integração ERP de produção continuam fora do escopo. A primeira evolução entregue é suspensão/retomada de cobrança por contrato, com motivo e histórico, preservando acordos e recebimentos. Cobertura e lacunas estão em `docs/estudo-mercado-gap-analysis.md`.

Registro de 19/10/2026, salvo a pedido do usuário. As prioridades abaixo são recomendações discutidas; seu registro não autoriza implementar todas elas automaticamente.

## Objetivo e fluxo

CRM de cobrança integrado: empresa contratante → carteira → importação → devedor → atendimento → negociação → acordo → conciliação → relatórios. Cada dívida mantém vínculo com a empresa contratante. Portal do devedor fora do escopo inicial.

## Estado atual

Base funcional demonstrativa em React, com persistência local em IndexedDB. Login e perfis demonstrativos; sem backend, autenticação de produção ou compartilhamento de dados entre computadores. Há empresas e anexo PDF opcional, carteiras, importação, canais de contato, atendimento, negociações, acordos, conciliação e relatórios. Campanhas não enviam mensagens.

Conversas permite somente rascunhos locais. O usuário escolheu a API oficial da Meta; número único da Gamma ou números por contratante ainda não foi definido. A política oficial, verificada em 19/10/2026, lista “debt collection” entre os serviços proibidos: https://whatsappbusiness.com/policy/. Esclarecer elegibilidade antes de ativar comunicação real; não prometer integração já funcional.

## Prioridades recomendadas

1. Fechar primeiro o fluxo diário do operador: responsabilidade pelo atendimento, distribuição e transferência da fila, prevenção de atendimento simultâneo, retornos e promessas.
2. Evoluir suspensão por contrato ou empresa, com motivo, autor e histórico. Hoje o bloqueio da pessoa é global; contestação afeta apenas o contrato. Suspensão não apaga dívida nem cancela automaticamente acordos ou pagamentos.
3. Preparar operação real: backend, banco centralizado, anexos no servidor, identidade e permissões por empresa/equipe, backups com restauração, auditoria durável e monitoramento de erros.
4. Melhorar revisão e correção de importações, duplicidades e conflitos nos contatos.
5. Conforme o contrato comercial, definir comissões da Gamma, prestação de contas e repasses; conciliação da dívida não substitui esse controle.
6. Definir confirmação dos pagamentos: manual, arquivo da contratante ou integração. Pix e boleto dependem de a Gamma assumir essa etapa.

## Direção de design

Operação de cobrança: o usuário relatou dificuldade em entender a tabela seguida de detalhes e botões. A direção passa a ser fila lateral e um caso por vez, com ação principal de registrar atendimento e abas Contato/Histórico/Tarefas. Manter a proteção de texto não salvo e os vínculos por contrato. Ver o comportamento em `docs/padrao-operacional.md`.

Identidade Gamma, cores e componentes estão coerentes nas telas revisadas; a experiência completa ainda precisa de revisão no fluxo real de trabalho.

- Priorizar ficha de atendimento que reúna pessoa, empresa, contrato, canais, histórico e próxima ação.
- Fila deve destacar retornos de hoje, promessas vencidas e atendimentos sem responsável.
- Diferenciar situação da dívida, do acordo e do atendimento.
- Modais para cadastro e ações pontuais; páginas de detalhes para históricos extensos.
- Manter padrões compartilhados, exemplos de preenchimento, foco visível, erros claros e adaptação ao celular.
- Modal de empresa ampliado para 840 px, com duas colunas quando há espaço e barra de rolagem estilizada.

Próximo passo recomendado: consolidar regras e fluxo operacional antes de adicionar novas telas isoladas. Evolução de produção depende de escopo explícito; o projeto atual permanece demonstrativo.
