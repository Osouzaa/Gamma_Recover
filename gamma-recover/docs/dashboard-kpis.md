# Dashboard de carteira, vencimentos e território

## Leitura e escopo

O dashboard continua demonstrativo, com uma única base IndexedDB. Não consulta ERP, não faz previsão de pagamento e não altera obrigações ao consultar filtros. Todos os cálculos financeiros usam centavos inteiros nos serviços.

A seção **Carteira, vencimentos e território** mostra a posição atual, no dia de São Paulo. Seus filtros de base, carteira, vencimento e cidade intersectam a empresa selecionada no cabeçalho. A troca de empresa limpa os filtros locais para evitar carteira/cidade de outro contexto. Gráficos, indicadores, tabela de registros e exportação usam a mesma população filtrada.

**Recuperação e operação** conserva os indicadores anteriores e seu filtro de período próprio: recebimentos confirmados, formalizações, eficiência, situações dos acordos, cobertura e pendências. Os filtros de cidade/carteira da análise não atribuem produtividade a contratos, pois o histórico antigo de contatos não identifica cada contrato.

## Bases disponíveis

| Base               | Inclusão                                                    | Exclusão                                                      |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------- |
| Dívidas sem acordo | Valor original dos contratos sem acordo não cancelado       | Dívidas com acordo ativo, atrasado, cumprido ou rompido       |
| Parcelas em aberto | Parcelas não pagas de acordos não cancelados e não rompidos | Recebidas, canceladas e fora do acompanhamento por rompimento |
| Visão consolidada  | União das duas bases anteriores                             | Não soma dívida original e parcelas do mesmo acordo           |

O valor em análise não substitui o saldo oficial no sistema de origem. Suspensão, contestação, bloqueio e carteira inativa não apagam valores financeiros; restringem o **elegível para negociar**, que considera apenas dívidas sem acordo com operação liberada. Cancelamento de acordo devolve a dívida à base original conforme as regras existentes.

## Definições dos indicadores

| Indicador                   | Definição                                                                  |
| --------------------------- | -------------------------------------------------------------------------- |
| Valor em análise            | Soma dos valores dos registros após todos os filtros locais e da empresa   |
| Valor vencido               | Vencimento estritamente anterior à referência                              |
| Valor a vencer              | Vencimento igual ou posterior à referência; o valor de hoje é discriminado |
| Percentual vencido          | Vencido / valor em análise; sem denominador, exibe travessão               |
| Vencidos há menos de 5 anos | Vencimento posterior à referência menos 60 meses e anterior à referência   |
| Vencidos há 5 anos ou mais  | Vencimento menor ou igual à referência menos 60 meses                      |
| Pessoas e contratos         | Contagem de identificadores distintos, não de parcelas                     |
| Até 30 dias                 | Vencimento de hoje até referência + 30 dias, inclusive                     |
| Cobertura geográfica        | Valor com cidade e UF / valor em análise; não é percentual de pessoas      |
| Participação da cidade      | Valor da cidade / valor total filtrado, incluindo localização desconhecida |

O aniversário de cinco anos é calculado por calendário, limitando o dia ao último dia do mês quando necessário. Cinco anos completos nunca entram em “menos de cinco anos”. É uma classificação temporal, sem inferência sobre prescrição. Usa o vencimento original na base de dívidas e o vencimento da parcela na base de parcelas.

As faixas de atraso são exclusivas e reconciliam com o valor em análise: hoje/futuro; 1–30; 31–90; 91–180; 181–365 dias; 366 dias até dois anos completos; mais de dois e menos de cinco anos; cinco anos ou mais. A agenda mensal cobre o mês atual e os cinco seguintes, somente a partir de hoje. Obrigações posteriores a essa janela permanecem no total a vencer, sem serem antecipadas no gráfico.

## Localização e qualidade dos dados

`Debtor.location` é um campo opcional com cidade e UF brasileira válida. A localização pertence à pessoa e é compartilhada pelos seus contratos. Administrador e Operador podem editar/remover pela ficha do devedor, com validação de contexto, transação e auditoria. Financeiro apenas consulta. Não se infere cidade pelo telefone.

Base antiga sem localização continua íntegra, classificada como **Localização não informada**. A versão nova não preenche esses dados automaticamente. Novas demonstrações incluem cidades exemplificativas em pessoas fictícias; isso não representa distribuição de clientes reais. A localização pode ser preenchida sem restaurar a base.

As chaves geográficas normalizam caixa e acentos e distinguem UF. O gráfico mostra até sete localidades e agrupa as demais; a tabela conserva todas as cidades, valores exatos, vencidos, pessoas e participações. Selecionar uma cidade na tabela aplica o filtro à análise. As tabelas complementares tornam os valores dos gráficos consultáveis sem depender de hover.

## CSV e compatibilidade

O modelo ampliado aceita dez colunas, mantendo os formatos anteriores de cinco e oito:

```text
documento;nome;contrato;valor;vencimento;telefone;whatsapp;email;cidade;uf
DEMO-GEO;Pessoa Fictícia;DEMO-CTR-GEO;1250,50;2027-01-10;;;;Campinas;SP
```

Cidade e UF são fornecidas juntas ou ambas vazias. UF é normalizada em maiúsculas. Localização conflitante com cadastro existente recusa todo o lote; corrija explicitamente a ficha antes de importar. Campos ausentes/vazios não removem localização já cadastrada. O modelo baixado pela tela inclui as novas colunas e a prévia mantém a validação atômica existente.

**Exportar análise** gera `analise-carteira.csv` com os registros filtrados, data de referência, base de cada registro, empresa, carteira, contrato/parcela, pessoa fictícia, localização, vencimento, valor em BRL e situação. Preserva neutralização de fórmulas CSV. **Exportar indicadores** conserva o resumo da seção de recuperação, com seu período próprio.

Não há migração destrutiva nem mudança de versão da base. Campos antigos permanecem legíveis. Como nos campos opcionais anteriores, não operar builds novos e antigos simultaneamente: leitores antigos podem descartar localização ao gravar. Preservar uma cópia IndexedDB antes de rollback.

## Verificação

Testes verificam reconciliação dos totais, fronteira de cinco anos e ano bissexto, isolamento de empresa/carteira/cidade, bases sem localização, recebidos/cancelados/rompidos, ausência de dupla contagem, elegibilidade, CSV seguro, conflito de importação e preservação de obrigações. Navegador verifica filtros, valores conhecidos, exportação, edição de localização, leitura sem mutação e layout em desktop/celular.
