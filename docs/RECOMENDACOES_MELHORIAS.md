# Recomendações de melhorias – Interface e funções

Documento de priorização: o que implementar primeiro para ter mais impacto com esforço razoável. Complementa o [SUGESTOES_E_MELHORIAS.md](./SUGESTOES_E_MELHORIAS.md).

---

## 1. Interface e UX (rápido impacto)

### Alta prioridade
| Melhoria | Por quê | Onde |
|----------|---------|------|
| **Toast ao marcar "Pagar" / excluir** | Usuário não tem confirmação visual; parece que nada aconteceu. | Dashboard (Contas a vencer), Transações, Contas fixas |
| **Confirmar antes de excluir** | Evitar exclusão acidental (ex.: ajuste de saldo). | Modal "Excluir transação?" com Cancelar / Excluir em Transações e Contas fixas |
| **Skeleton nos cards do dashboard** | Reduz "pulo" de layout e sensação de travamento ao carregar. | Dashboard: cards de saldo, receitas, despesas, etc. |
| **Estados vazios com ícone + texto** | Lista vazia fica mais clara (ex.: "Nenhuma transação neste mês" + ícone de calendário). | Transações, Contas fixas, Relatórios, Cartões |

### Média prioridade
| Melhoria | Por quê |
|----------|---------|
| **Busca por descrição/categoria** | Em muitos lançamentos, achar uma transação específica fica difícil. |
| **Filtro por tipo na lista de transações** | Ver só "Variável", só "Cartão" ou só "Fixa" sem mudar de tela. |
| **Indicador de loading no botão** | "Salvando…" ou spinner no botão ao enviar formulário (Nova transação, Ajustar saldo). |
| **Mensagem de erro amigável na tela de login** | Exibir "E-mail ou senha inválidos" em destaque em vez de só no console. |

---

## 2. Funcionalidades (valor para o usuário)

### Alta prioridade
| Função | Descrição resumida |
|--------|---------------------|
| **Metas por categoria** | Definir teto (ex.: Alimentação R$ 1.500/mês) e alerta (toast ou badge) ao ultrapassar. Usa os dados que já existem em Relatórios por categoria. |
| **Exportar PDF** | Hoje só CSV; PDF com resumo do mês (saldo, totais, top categorias) atende quem quer imprimir ou enviar. |
| **Lembretes no app** | Notificações na própria aplicação (ou e-mail opcional) X dias antes do vencimento, além do Telegram. |

### Média prioridade
| Função | Descrição resumida |
|--------|---------------------|
| **Histórico de ajustes de saldo** | Listar transações tipo `ADJUSTMENT` em Configurações ou em uma seção "Conciliação", com data e valor. |
| **Categorias sugeridas** | Ao criar despesa variável, sugerir categorias já usadas (gasolina, farmácia, etc.) ou lista fixa. |
| **Editar transação** | Corrigir valor, data ou descrição sem precisar excluir e criar de novo. |
| **Duplicar transação** | Botão "Duplicar" na linha para criar outra igual com nova data (útil para despesas repetidas). |

### Prioridade baixa
| Função | Descrição resumida |
|--------|---------------------|
| **Múltiplas contas/carteiras** | Saldo por "conta" (corrente, poupança, carteira) em vez de um único saldo. |
| **Tags em transações** | Ex.: "reembolsável", "imposto"; filtros e relatórios por tag. |
| **Anexo de comprovante** | Upload de foto/PDF na transação (requer armazenamento de arquivos). |

---

## 3. Diferenciação visual por tela

O doc de sugestões já descreve isso em detalhe. Resumo prático:

| Tela | Sugestão de "cara" |
|------|---------------------|
| **Dashboard** | Manter como está; opcional: borda colorida sutil nos cards (verde = saldo, vermelho = gasto). |
| **Transações** | Tabela com zebra (linhas alternadas), hover com ações (Pagar, Excluir); cor de destaque azul. |
| **Cartões** | Um **card visual** por cartão (borda, ícone, limite + fatura), não só lista; cor roxa/índigo. |
| **Contas fixas** | Lista compacta com ícone por tipo + badge "Dia X"; drawer lateral para adicionar; cor âmbar. |
| **Relatórios** | Gráficos em destaque, 1–2 KPIs no topo (total do mês, maior categoria); cor verde/teal. |
| **Configurações** | Blocos por tema (Conta, Telegram, Aparência) com descrição curta; neutro. |

Isso dá identidade por módulo sem mudar a estrutura (sidebar + topbar).

---

## 4. Ordem sugerida de implementação

1. **Primeira leva (1–2 dias)**  
   Toast ao pagar/excluir, confirmação antes de excluir, skeleton no dashboard, estados vazios com ícone.

2. **Segunda leva (2–3 dias)**  
   Metas por categoria (com alerta), exportar PDF, busca em transações, filtro por tipo.

3. **Terceira leva (conforme prioridade)**  
   Lembretes no app, histórico de ajustes, categorias sugeridas, editar/duplicar transação.

4. **Refino visual**  
   Aplicar diferenciação por tela (cores, densidade, componentes) em uma passada única por módulo.

---

## 5. Melhorias técnicas (manutenção e performance)

- **Tratamento de erro global**: interceptor ou boundary que exiba toast quando a API retornar 500 ou timeout.
- **Revalidação após mutação**: garantir que, após criar/editar/excluir, todas as listas e cards que dependem dos dados sejam revalidados (SWR `mutate` já cobre boa parte; revisar casos de edição).
- **Acessibilidade**: contraste de cores, foco em teclado e labels em botões/inputs (especialmente em modais e formulários).
- **Testes E2E**: um fluxo mínimo (login → ver dashboard → criar transação → ver na lista) para evitar regressões em deploy.

---

Este arquivo pode ser usado como backlog: pegar itens por prioridade e ir riscando conforme for implementando.
