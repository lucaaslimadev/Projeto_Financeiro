# Sugestões de melhorias – Projeto Financeiro

## Já implementado nesta sessão

- **Saldo total**: card com botão "Ajustar saldo" que abre modal para definir o saldo (persistido no backend, campo `User.balance`).
- **Contas a vencer**: seção no dashboard com lista de contas e botão **Pagar** em cada linha (marca como pago e atualiza a lista).

---

## 1. Melhorias de função

### Prioridade alta (implementado)
- **Receitas**: tipo `INCOME` no backend; em "Nova transação" há aba **Receita** (valor positivo, data, categoria). Dashboard exibe card **Receitas do mês** e gráficos consideram só despesas na pizza por categoria.
- **Conciliação com saldo**: ao clicar em "Ajustar saldo" e salvar, o backend cria uma transação tipo `ADJUSTMENT` com a diferença (novo − antigo) e atualiza o saldo — fica histórico.
- **Filtro de mês/ano no dashboard**: seletores de mês e ano no topo do dashboard; resumo, contas a vencer, gráficos e transações usam o período escolhido.
- **Exportar relatório**: botão **Exportar CSV** no dashboard; gera arquivo com transações do mês/ano selecionado (Data; Descrição; Categoria; Valor; Tipo; Status).

### Prioridade média
- **Metas de gasto por categoria**: definir teto por categoria (ex.: Alimentação R$ 1.500) e alerta ao ultrapassar.
- **Lembretes**: notificações no app (ou e-mail) X dias antes do vencimento (hoje só Telegram).
- **Múltiplas contas/carteiras**: saldo por "conta" (conta corrente, poupança, carteira) em vez de um único saldo.
- **Histórico de alteração de saldo**: log de quando e quanto foi ajustado.

### Prioridade baixa
- **Tags/labels** em transações (ex.: "reembolsável", "imposto").
- **Anexos**: foto do comprovante na transação.
- **Dashboard compartilhado**: visão conjunta para mais de um usuário (família).

---

## 2. Melhorias de interface (UX/UI)

- **Feedback visual ao pagar**: toast ou mensagem de sucesso ao clicar em "Pagar" (ex.: "Conta marcada como paga").
- **Estados vazios**: ilustração ou ícone grande + texto quando não houver transações, alertas ou contas (em vez de só texto).
- **Loading**: skeleton nos cards do dashboard enquanto carrega (evita "pulo" de layout).
- **Confirmação em ações destrutivas**: "Excluir transação?" com Cancelar/Excluir antes de deletar.
- **Atalhos**: teclado (ex.: N = nova transação, / = busca) para usuários avançados.
- **Busca global**: campo no topo para buscar transações por descrição ou valor.

---

## 3. Como deixar as telas menos parecidas (diferenciação visual)

Hoje muitas páginas usam o mesmo padrão: título + card(s) + lista/tabela. Dá para variar por seção:

### Por tipo de conteúdo
- **Dashboard**: manter grid de cards + gráficos + listas (visão geral).
- **Transações**: layout focado em **tabela** (ou lista densa), filtros em barra fixa, botão "Nova transação" em destaque. Cores neutras, foco em leitura.
- **Cartões**: layout em **cards horizontais** (um card por cartão), com limite, fatura e destaque visual por cartão (borda, ícone, cor).
- **Contas fixas**: lista **compacta** (uma linha por conta) com ícone + dia do vencimento em badge; formulário de nova conta em drawer lateral em vez de modal.
- **Relatórios**: **gráficos em destaque** (full width), pouco texto, filtros de período em cima; sensação de "painel analítico".
- **Configurações**: **formulários em seções** (conta, Telegram, tema), sem tabelas; visual de "página de perfil".

### Por identidade visual por seção
- **Cores de destaque por módulo** (sem quebrar o tema):
  - Dashboard: neutro (como hoje).
  - Transações: azul (links, botão primário).
  - Cartões: roxo ou índigo (header do bloco, ícones).
  - Contas fixas: âmbar/laranja (alertas, vencimento).
  - Relatórios: verde/teal (gráficos, crescimento).
  - Configurações: cinza (neutro).
- **Tipografia**: mesmo sistema, mas títulos de seção com peso ou tamanho diferente (ex.: Relatórios com título maior e mais claro).
- **Densidade**: Transações e Contas fixas mais **compactas** (menos padding, linhas mais altas); Relatórios e Dashboard mais **arejados**.

### Componentes que ajudam a diferenciar
- **Dashboard**: cards com ícone + número (como hoje); pode usar borda colorida sutil por tipo (saldo = verde, gasto = vermelho).
- **Transações**: tabela com zebra (linhas alternadas), hover na linha, ações (Pagar, Excluir) ao passar o mouse.
- **Cartões**: cada cartão como um "card" visual (borda, sombra, cor de destaque), não só linhas.
- **Contas fixas**: lista com **avatar/ícone** por categoria (ex.: casa, wifi) e **badge** com o dia (ex.: "Dia 10").
- **Relatórios**: gráficos grandes, cards de KPI em cima (total gasto, média/dia, maior categoria).
- **Configurações**: agrupamento em cards por tema ("Conta", "Integrações", "Aparência") com descrição curta em cada.

### Resumo prático
1. **Transações**: tabela densa + barra de filtros; cor azul de destaque.
2. **Cartões**: layout em cards (um por cartão), não tabela; cor roxa/índigo.
3. **Contas fixas**: lista compacta com ícone + badge de dia; drawer para adicionar; cor âmbar.
4. **Relatórios**: gráficos em destaque + KPIs; cor verde/teal.
5. **Configurações**: formulários em blocos; neutro.

Assim cada área ganha uma "cara" própria sem mudar a estrutura global (sidebar + topbar).
