# Conversas e API oficial da Meta

## Estado implementado

Chat local com empresa, contribuinte, destino e contrato identificados. Serviços transacionais permitem preparar conversas e persistir rascunhos, sem envio. O navegador não recebe tokens de provedor. Não há backend/API HTTP de mensagens, webhooks ou mensagens recebidas implementados. Não existe confirmação simulada de envio, entrega ou leitura.

## Viabilidade antes da conexão

O usuário escolheu a API oficial da Meta. A [política oficial do WhatsApp Business](https://whatsappbusiness.com/policy/), consultada em 19/10/2026, lista “debt collection” como serviço proibido. Esclarecer a elegibilidade da operação da Gamma com a Meta antes de ativar comunicação real. Ter conta, número, opt-in ou template não significa aprovação desse caso de uso. Não contornar a restrição por nomes de templates ou classificação diferente da atividade.

## Decisões ainda abertas

- Número único da Gamma ou contas/números separados por empresa.
- Conta empresarial, responsáveis e enquadramento elegível do caso de uso.
- Backend autenticado e base centralizada, que substituirão a autoridade do navegador para mensagens reais.

Nenhum desses pontos é configurável como um falso estado “conectado” na interface atual.

## Fluxo técnico necessário se o caso de uso for elegível

1. Operador autenticado escolhe empresa, pessoa, contrato e destino no CRM.
2. Backend obtém identidade e permissões da sessão do servidor. Revalida propriedade do contrato, canal, restrições e demais condições aplicáveis; o navegador não fornece autoridade.
3. Backend registra uma solicitação idempotente e a envia à API oficial com credenciais mantidas em armazenamento de segredos do servidor. Guardar identificador do provedor, sem registrar tokens nos logs.
4. Aceitação pela API não é entrega: cada estado deve ser confirmado por resposta/evento correspondente, sem inventar estados positivos.
5. Endpoint HTTPS recebe eventos, valida autenticidade e trata repetição e eventos fora de ordem. Mensagens de entrada são persistidas no servidor, e atualizações chegam ao chat com isolamento por empresa.
6. Destinatários ambíguos ficam em triagem. Um número compartilhado pode corresponder à mesma pessoa em várias contratantes; não atribuir uma mensagem recebida à primeira empresa encontrada.
7. Histórico, auditoria e recuperação passam a ser duráveis e compartilhados entre computadores. Rascunhos locais não são disparados automaticamente ao conectar o provedor.

Esse fluxo é uma especificação de integração futura, não um backend já entregue. A ativação depende primeiro da viabilidade do uso e das decisões de conta/número.

## Invariantes do chat local

Conversa única por empresa/pessoa/destino, inclusive em gravações simultâneas entre abas. Rascunho limitado a 4.096 caracteres e vinculado a contrato da mesma empresa e pessoa. Telefone não implica WhatsApp. Alteração do número preserva a conversa anterior em consulta. Bloqueio e contestação impedem alterações de rascunhos. Perfil Financeiro não cria nem altera conversas. Falhas de armazenamento não confirmam gravação.

A coleção `conversations` é opcional em `Database`, preservando bases anteriores. Nenhum saldo, proposta, acordo, parcela ou atendimento é criado pela preparação de uma conversa ou rascunho. Não operar builds antigos e novos simultaneamente: versões anteriores podem descartar os campos adicionados. Preservar cópia da base antes de retornar a build anterior.
