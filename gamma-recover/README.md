# Gamma Recover

Frontend funcional e demonstrativo da Gamma Estratégia & Consultoria para recuperação de crédito, cobrança e negociação. Interface em português, com identidade Gamma e padrão Enterprise Compact.

## Executar no Windows

Requisitos: Node.js 22.12+ (validado com Node 24), npm e Microsoft Edge para os testes de navegador.

```powershell
cd gamma-recover
npm.cmd ci
npm.cmd run dev
```

Abra o endereço informado pelo Vite. A porta padrão é 5173; outra porta é escolhida se estiver ocupada. `npm.cmd` funciona também quando o PowerShell bloqueia `npm.ps1`.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run preview
npm.cmd run format:check
```

Os testes E2E iniciam seu próprio servidor na porta 4173 e usam Edge headless instalado. Essa porta deve estar livre. As capturas de desktop e mobile ficam em `artifacts/`. A produção estática é gerada em `dist/`; hospedagens devem redirecionar rotas não encontradas para `index.html`.

## Funcionalidades

| Módulo        | Disponível                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Dashboard     | KPIs explicados, comparações válidas, gráficos responsivos, funil, pendências, vencimentos e exportação |
| Carteiras     | Cadastro, edição, ativação, detalhes, indicadores e importação CSV atômica com prévia e histórico       |
| Devedores     | Busca, filtros, cadastro detalhado, contratos, propostas, acordos, contatos e bloqueio                  |
| Cobrança      | Fila, seleção, tentativa, observações, resultado, retorno, promessa e encerramento por contrato/credor  |
| Negociações   | Desconto, entrada, parcelamento, revisão persistida, aprovação excepcional e aceite auditado            |
| Acordos       | Consulta, condições, parcelas, estados, cancelamento sem recebimentos e comprovante TXT demonstrativo   |
| Financeiro    | Vencidas, a vencer, recebidas, referências, divergências e conciliação controlada                       |
| Campanhas     | Cadastro, segmentação por atraso, público elegível e simulação sem envios                               |
| Relatórios    | Carteiras, acordos, recuperação, pagamentos, inadimplência e produtividade; filtros e CSV               |
| Configurações | Credores, políticas, parâmetros, três usuários/perfis fictícios e auditoria                             |

As tabelas permitem ordenação nas colunas indicadas e paginação. Ao salvar, a base compartilhada é atualizada por TanStack Query. Alterações em outras abas são sincronizadas por BroadcastChannel; gravações são serializadas com transações IndexedDB.

## Testar os principais fluxos

1. Em **Carteiras**, crie uma carteira ou use Crédito pessoal. Abra **CSV**, baixe o modelo, selecione o arquivo, revise a prévia e confirme.
2. Localize a pessoa importada em **Devedores**, abra o cadastro e registre um atendimento.
3. Encaminhe o contrato à negociação, ajuste condições, revise e aceite. O acordo abre com seu cronograma; nenhuma parcela é paga automaticamente.
4. Em **Financeiro**, concilie uma parcela com referência fictícia e valor exato. Um valor diferente gera divergência. Dashboard e relatórios refletem recebimentos confirmados.
5. Para aprovação excepcional, simule **25%** no credor Horizonte (máximo 30%, automático até 20%). A proposta ficará pendente; o administrador pode aprová-la na tabela e retomá-la para aceite.
6. Em **Configurações → Usuários e permissões**, alterne os perfis e confira as restrições. A troca é deliberadamente livre neste demonstrador.

## Dados e limites

Cenário inicial: dois credores, três carteiras, 24 pessoas fictícias, 24 contratos, nove acordos com parcelas e um atendimento. Os vencimentos são relativos ao dia da primeira gravação, no fuso de São Paulo. Após gravar, as datas são preservadas.

A persistência é exclusivamente IndexedDB, na base `gamma-recover-demo-v1`, store `state`. Uma cópia legada com essa chave em `localStorage` é importada na primeira transação de gravação; o original não é apagado nem atualizado. Depois disso, IndexedDB é a fonte de dados. Não opere versões antigas e novas simultaneamente. Use **Configurações → Parâmetros → Restaurar demonstração** para reiniciar, mediante confirmação. Dados inválidos não são sobrescritos silenciosamente: a tela de erro oferece restauração confirmada. Falhas de armazenamento impedem a conclusão da alteração.

A aplicação exige IndexedDB disponível no navegador para gravar. Falhas de acesso são exibidas sem confirmar a alteração. O servidor de desenvolvimento usa `vite --host`, permitindo acesso pela rede local. Identificadores usam `crypto.randomUUID` quando disponível, com alternativa UUID v4 por `crypto.getRandomValues` para contextos como HTTP sem essa API.

Não há backend, autenticação ou autorização efetiva de produção, processamento financeiro, canais de comunicação, integrações externas nem armazenamento de dados reais. O comprovante TXT não tem validade financeira.

Há três perfis fixos para demonstração; não há provisionamento de usuários reais, PDF de acordo, boleto, Pix, disparos ou processamento de contestações por equipes externas. A campanha não atribui recebimentos fictícios às pessoas selecionadas.

## Estrutura

- `src/app`: providers, rotas e layout administrativo.
- `src/modules`: páginas e fluxos administrativos por domínio.
- `src/components`: elementos comuns, formulários e tabelas.
- `src/services`: regras, operações, persistência IndexedDB, sessão, validação e relatórios.
- `src/mocks`, `src/types`, `src/theme`, `src/utils`: cenário, contratos TypeScript, tokens e utilitários.
- `src/test` e `e2e`: testes de domínio, componentes e fluxos no Edge.
- `docs`: arquitetura, regras e padrões visuais.

## Evolução Enterprise

A interface atual inclui sidebar de 216px recolhível para 68px, breadcrumb contextual, menu do usuário, tabelas compactas, timeline de contatos, progresso do cronograma e abas acessíveis em Configurações. O dashboard diferencia dados de período de posições atuais. A ajuda de cada indicador explica sua base e os limites das comparações; detalhes das definições estão em `docs/business-rules.md`.

O dashboard somente lê a base. Não há alterações nos valores dos mocks, nas políticas, na geração de parcelas ou na confirmação financeira. A verificação E2E compara os dados antes e depois de consultas e filtros, além de exercitar os fluxos originais. Capturas de referência anteriores ficam em `artifacts/dashboard-before-*.png`; as novas capturas usam `dashboard-desktop.png` e `dashboard-mobile.png`.

## Login e saída do painel

O painel agora abre em `/login`. Use apenas as contas demonstrativas:

| Perfil        | E-mail                | Senha     |
| ------------- | --------------------- | --------- |
| Administrador | admin@gamma.demo      | Gamma@123 |
| Operador      | operador@gamma.demo   | Gamma@123 |
| Financeiro    | financeiro@gamma.demo | Gamma@123 |

A sessão administrativa dura até oito horas e fica em `localStorage`, na chave `gamma-admin-demo-session-v1`, sem senha armazenada. Ao entrar, o perfil demonstrativo correspondente é selecionado; a troca de perfis nas configurações continua disponível para testes. Rotas administrativas exigem sessão, e o login retorna à rota interna solicitada, inclusive suas consultas.

O botão **Sair**, no cabeçalho, encerra a sessão em todas as abas da mesma origem, limpa o contexto do credor e retorna ao login. Não apaga carteiras, dívidas ou acordos. Sessões inválidas/expiradas não dão acesso ao painel.

Esse fluxo é uma simulação frontend. Credenciais públicas e armazenamento do navegador não oferecem autenticação ou autorização de produção; a integração real continua dependente de backend. Os testes E2E entram pela tela de login antes de exercitar os fluxos administrativos.

## Empresas contratantes e importações

Em **Empresas**, o administrador cadastra razão social, nome fantasia, documento fictício `DEMO-…` no campo de CNPJ, contato, telefone, e-mail, endereço e responsável interno Gamma. Somente dados fictícios neste demonstrador. Credores existentes são as mesmas empresas, com o cadastro a complementar; nenhum saldo ou vínculo é recriado.

O contrato de prestação de serviços da Gamma tem referência, vigência e condições comerciais, além de um PDF opcional de até 2 MB. É possível baixar, substituir ou remover o anexo. Ele fica na mesma base IndexedDB, sem upload para servidor. Contratos reais não devem ser anexados. Vigência é cadastral; não suspende automaticamente a cobrança. Condições comerciais não calculam comissões nem repasses.

Fluxo: **Empresas → cadastrar → Política → Carteiras → Nova carteira → CSV**. Novas empresas começam sem desconto e com uma parcela; ajuste a política conforme a contratação. Ao abrir as carteiras de uma empresa, o contexto global é selecionado. Fora desse contexto, o cadastro de carteira exige escolher explicitamente a empresa. O proprietário de uma carteira não pode ser transferido.

A importação mostra empresa, documento e carteira antes da confirmação. Dívidas ficam vinculadas à empresa pela carteira; uma pessoa pode ter dívidas em mais de uma empresa. Referências de dívida devem ser únicas por empresa, inclusive entre carteiras; a mesma referência pode existir em empresas distintas. O histórico na ficha da empresa mostra arquivo, data, carteira, quantidade e usuário das novas importações. Registros antigos sem usuário continuam legíveis.

Esta etapa não inclui backend, usuários reais, distribuição de operadores, envios ou cálculo de comissões. As definições do recebimento direto ou repasse precisam ser fechadas antes de implementar o financeiro da prestação de serviços.

## Registro de atendimento

Em **Operação de cobrança**, selecione um contrato na fila e use **Registrar atendimento**. O modal identifica pessoa, empresa, contrato e saldo antes do formulário. **Salvar atendimento** confirma o registro, fecha o modal e atualiza o histórico; Cancelar, Fechar e Escape descartam o formulário sem gravar. Erros permanecem no modal. O histórico exibido reúne os contatos da pessoa com a empresa selecionada. A seleção da fila é por contrato, inclusive quando uma pessoa possui mais de uma dívida. Restrições do perfil Financeiro, bloqueios e contestações continuam aplicadas.

## Escopo inicial sem portal do devedor

A versão inicial atende exclusivamente a equipe interna. O portal do devedor foi retirado da navegação, do menu de usuário, do login e das rotas. Endereços antigos `/portal` e suas subrotas exibem página não encontrada. A operação de cadastro, cobrança, negociação, acordos e conciliação continua no painel, sem apagar os dados existentes. Os módulos anteriores do portal permanecem fora do roteamento e do build, reservados para eventual retomada futura.

## Tela de acesso

O login destaca e-mail, senha e ação de entrada, com identificação da Gamma e resumo do fluxo administrativo. Em **Experimentar com um perfil de demonstração**, a seleção de perfil apenas preenche as credenciais públicas; a entrada exige clicar em **Entrar**. O painel de demonstração começa recolhido. Login, validação, retorno à rota solicitada e duração da sessão mantêm as mesmas regras. A tela se adapta a dispositivos móveis e conserva os controles de senha e navegação por teclado.

## Canais de contato do contribuinte

O cadastro e a fila de cobrança identificam **WhatsApp**, **Telefone** e **E-mail**, com canal preferencial opcional. Use **Editar canais** para cadastrar, corrigir ou remover dados. Telefone não implica WhatsApp: seu número precisa ser informado separadamente. Os canais pertencem à pessoa, compartilhados entre seus contratos e empresas; as alterações passam pelos serviços e auditoria. Na listagem de Devedores, o filtro de canal ajuda a encontrar cadastros com um determinado canal ou sem canal utilizável.

As ações **Abrir WhatsApp**, **Ligar** e **Escrever e-mail** abrem, respectivamente, conversa no WhatsApp, discador e compositor de e-mail do dispositivo. A equipe decide e executa o envio ou ligação no aplicativo externo. Não há API de mensagens, envio automático, discagem pelo servidor ou confirmação de entrega/leitura. Abrir um canal não gera atendimento automaticamente. Bloqueios, contestações e perfil Financeiro desabilitam ações conforme o contexto. Dados ausentes, telefones fictícios com DDD 00 e e-mails reservados de demonstração não geram links ativos.

No modal de atendimento, informe o canal realmente utilizado. O serviço valida sua disponibilidade e guarda o canal e o destino daquele momento no histórico, sem transformar isso em confirmação de entrega. **Registro interno** permite anotações sem atribuir um contato a canal ausente; atendimentos anteriores exibem **Canal não informado**.

O CSV antigo de cinco colunas continua aceito. O modelo ampliado tem exatamente `documento;nome;contrato;valor;vencimento;telefone;whatsapp;email`; os três novos valores podem ficar vazios. Canais ausentes são preenchidos, enquanto dados utilizáveis divergentes interrompem o lote para revisão, sem substituir silenciosamente o cadastro. Novas importações sem contatos mantêm os campos vazios. Use apenas dados fictícios nesta versão.

## Chat de atendimento: etapa local

O módulo **Conversas** (`/conversas`) reúne conversas por empresa, pessoa e número de WhatsApp. O atalho **Abrir chat no sistema** aparece no cadastro e na fila quando há WhatsApp utilizável e permissão. **Nova conversa** exige escolher um contrato; a abertura é explícita, sem criar registros apenas ao consultar uma URL.

Nesta etapa, o chat permite salvar, editar e excluir **rascunhos locais**, com autor, horário e contrato identificado. O destino fica fixado na conversa; mudar o número no cadastro exige outra conversa, preservando o histórico antigo para consulta. Dados e rascunhos ficam na mesma base IndexedDB e sincronizam entre abas da mesma origem. Administrador e Operador preparam atendimentos; Financeiro somente consulta. Bloqueios, contestação, vínculo da empresa e número vigente são revalidados nos serviços.

**Enviar pelo WhatsApp está desabilitado.** Não há backend de mensageria, mensagens recebidas, token Meta no navegador, envio real, estados de entrega/leitura ou atendimento registrado automaticamente. Os rascunhos não são uma fila de envio automático futuro: qualquer envio real precisará de nova revisão e autorização explícita da equipe.

A API oficial da Meta foi escolhida, mas a integração está em análise: a [política oficial do WhatsApp Business](https://whatsappbusiness.com/policy/), verificada em 19/10/2026, inclui “debt collection” entre os serviços proibidos. O enquadramento da atividade da Gamma precisa ser esclarecido com a Meta; credenciais e templates não resolvem essa restrição por si só. A tela **Ver integração** registra essa pendência. Também permanece aberta a decisão entre número único da Gamma e números por contratante.

O próximo desenho técnico, condicionado à viabilidade do caso de uso, está em `docs/whatsapp-integration.md`. Não há integração Meta ativada ou prometida como aprovada nesta versão.


## Suspensão e evoluééo do produto

No cadastro do devedor, suspenda ou retome a cobrança de um contrato com motivo obrigatório e histórico auditado. Outros contratos continuam independentes. A suspensão bloqueia novos contatos e negociaéées, sem interromper conciliação de acordos existentes. Consulte [a análise de cobertura do estudo de mercado](docs/estudo-mercado-gap-analysis.md) para capacidades atuais, lacunas e critérios das próximas entregas.


## Dashboard de KPIs e território

A seção inicial do Dashboard permite analisar valor vencido, a vencer (incluindo hoje), vencidos há menos de cinco anos e cinco anos ou mais, com faixas de atraso, agenda mensal e distribuição por cidade/UF. Use a visão consolidada sem dupla contagem ou escolha dívidas sem acordo / parcelas abertas. Filtros de carteira, vencimento e cidade controlam gráficos, registros e exportação da análise. Recuperação e operação mantêm o período próprio abaixo.

Cadastre cidade/UF em **Devedores → cadastro → Editar localização** ou use o modelo CSV ampliado com dez colunas. Formatos antigos continuam aceitos; registros antigos sem localização não são preenchidos artificialmente. Não é necessário restaurar a demonstração para usar o novo dashboard.

Definições, cobertura, compatibilidade e fórmulas em [Dashboard de KPIs](docs/dashboard-kpis.md).


## Padrão operacional Gamma

O dashboard separa **Carteira e território** de **Recuperação e operação** em abas. Conversas reúne lista, rascunhos e contexto do contrato, com adaptação ao celular.

Em **Tarefas**, crie uma ação com contrato e prazo; use os filtros Hoje/Atrasadas/Futuras/Concluídas, busque e conclua pelo painel de detalhes. Novos retornos e promessas agendados no atendimento geram tarefas na mesma transação. O responsável é o perfil demonstrativo que registra a ação. Concluir não confirma contato nem pagamento.

Em **Réguas de cobrança**, o Administrador cria etapas por empresa, com dias relativos ao vencimento, canal e ação; edita, pausa e simula. O histórico mostra inclusões e motivos de exclusão. Simular não envia mensagens, cria tarefas ou executa cobranças. Módulos novos iniciam vazios sem restaurar a base. Veja [o padrão aprovado e suas regras](docs/padrao-operacional.md).
