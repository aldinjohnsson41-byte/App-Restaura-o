# Especificação Técnica - Módulo de Agenda da Igreja

## 1. Visão Geral

O módulo de Agenda da Igreja é um sistema completo de gerenciamento de eventos, reservas de espaços físicos e sincronização com calendários externos. Funciona de forma integrada com o sistema de gestão eclesiástica, permitindo uma administração eficiente de todas as atividades da igreja.

### Versão: 1.0.0
### Data: Dezembro 2024
### Status: Implementação Concluída

---

## 2. Arquitetura do Banco de Dados

### 2.1 Tabelas Principais

#### **espacos_fisicos**
Armazena informações dos espaços físicos da igreja disponíveis para eventos.

```sql
- id: uuid (PK)
- nome: text (UNIQUE)
- descricao: text
- capacidade: integer
- localizacao: text
- equipamentos: text[]
- foto_url: text
- ativo: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

**RLS Policies:**
- SELECT: Usuários autenticados podem visualizar
- INSERT/UPDATE/DELETE: Usuários autenticados

---

#### **disponibilidade_espacos**
Define os horários de disponibilidade de cada espaço.

```sql
- id: uuid (PK)
- espaco_id: uuid (FK -> espacos_fisicos)
- dia_semana: integer (0-6, domingo-sábado)
- hora_inicio: time
- hora_fim: time
- disponivel: boolean
- created_at: timestamptz
```

**Propósito:** Definir quais horários cada espaço está disponível para locação.

---

#### **eventos_agenda**
Armazena todos os eventos da agenda da igreja.

```sql
- id: uuid (PK)
- nome: text (NOT NULL)
- descricao: text
- data_evento: date (NOT NULL)
- hora_inicio: time
- hora_fim: time
- dia_inteiro: boolean
- local: text
- espaco_id: uuid (FK)
- status: text ('confirmado', 'pendente', 'cancelado')
- criado_por: uuid (FK -> auth.users)
- google_calendar_id: text
- sincronizado_google: boolean
- data_sincronizacao_google: timestamptz
- observacoes: text
- created_at: timestamptz
- updated_at: timestamptz
```

**RLS Policies:**
- SELECT: Todos os usuários autenticados podem visualizar
- INSERT: Criador do evento
- UPDATE: Apenas o criador
- DELETE: Apenas o criador

**Índices:**
- idx_eventos_data: Para filtros por data
- idx_eventos_espaco: Para eventos por espaço
- idx_eventos_criador: Para eventos por usuário
- idx_eventos_status: Para filtros por status

---

#### **participantes_evento**
Rastreia os participantes confirmados em cada evento.

```sql
- id: uuid (PK)
- evento_id: uuid (FK -> eventos_agenda)
- pessoa_id: uuid (FK -> pessoas)
- confirmacao_presenca: text ('confirmado', 'pendente', 'recusado')
- data_confirmacao: timestamptz
- notificacao_enviada: boolean
- email_enviado_para: text
- created_at: timestamptz
```

**Propósito:** Controlar presenças e enviar notificações aos participantes.

---

#### **reservas_espacos**
Armazena reservas de espaços físicos (pode ser relacionada ou não a um evento).

```sql
- id: uuid (PK)
- espaco_id: uuid (FK -> espacos_fisicos)
- evento_id: uuid (FK -> eventos_agenda, opcional)
- data_reserva: date (NOT NULL)
- hora_inicio: time (NOT NULL)
- hora_fim: time (NOT NULL)
- responsavel_nome: text (NOT NULL)
- responsavel_email: text
- responsavel_telefone: text
- status: text ('confirmada', 'pendente', 'cancelada')
- valor_locacao: numeric(10,2)
- observacoes: text
- criado_por: uuid (FK -> auth.users)
- created_at: timestamptz
- updated_at: timestamptz
```

**RLS Policies:**
- SELECT: Usuários autenticados podem visualizar
- INSERT: Criador da reserva
- UPDATE: Apenas o criador
- DELETE: Apenas o criador

---

#### **feriados**
Cadastra feriados nacionais, estaduais e locais para exibição e bloqueio automático.

```sql
- id: uuid (PK)
- data: date (UNIQUE)
- nome: text (NOT NULL)
- tipo: text ('nacional', 'estadual', 'municipal', 'religioso')
- recorrente: boolean
- mes: integer
- dia: integer
- created_at: timestamptz
```

**Dados Iniciais:** Feriados brasileiros 2024 (Ano Novo, Carnaval, Páscoa, etc.)

---

#### **sincronizacao_google**
Rastreia a sincronização de eventos com Google Calendar.

```sql
- id: uuid (PK)
- usuario_id: uuid (FK -> auth.users)
- evento_id: uuid (FK -> eventos_agenda)
- google_calendar_id: text
- google_event_id: text
- direcao: text ('exportacao', 'importacao')
- status_sincronizacao: text ('sucesso', 'erro', 'pendente')
- mensagem_erro: text
- ultima_sincronizacao: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

**Propósito:** Manter histórico de sincronizações e permitir rastreamento de erros.

---

#### **configuracoes_notificacoes**
Define preferências de notificação por usuário.

```sql
- id: uuid (PK)
- usuario_id: uuid (FK -> auth.users, UNIQUE)
- notificar_novo_evento: boolean
- notificar_confirmacao: boolean
- notificar_cancelamento: boolean
- notificar_alteracao: boolean
- notificar_convite_evento: boolean
- notificar_lembretes_evento: boolean
- antecedencia_lembrete: integer (em horas)
- email_primario: text (NOT NULL)
- email_secundario: text
- created_at: timestamptz
- updated_at: timestamptz
```

---

## 3. Fluxos de Trabalho

### 3.1 Criação de Evento

```
1. Usuário acessa página de Agenda
2. Clica em "Novo Evento"
3. Preenchimento do formulário:
   - Nome do evento (obrigatório)
   - Data e hora
   - Opção de "dia inteiro"
   - Local/descrição
   - Seleção de espaço (opcional)
   - Adição de participantes
4. Sistema verifica conflitos:
   - Conflito de horário no mesmo espaço
   - Conflito com reservas existentes
5. Evento criado com status "confirmado"
6. Notificações enviadas aos participantes
7. Sincronização com Google Calendar (se ativada)
```

**Validações:**
- Nome obrigatório
- Data deve ser no futuro ou hoje
- Se não for "dia inteiro", hora_inicio < hora_fim
- Verificação automática de conflitos

---

### 3.2 Reserva de Espaço

```
1. Usuário acessa "Reservas de Espaços"
2. Seleciona espaço e data/horário
3. Sistema verifica disponibilidade:
   - Espaço não está reservado neste horário
   - Espaço não tem evento confirmado neste horário
   - Horário está dentro da disponibilidade do espaço
4. Preenche dados do responsável
5. Reserva criada com status "confirmada"
6. Notificação ao administrador
```

**Validações:**
- Responsável: nome obrigatório
- Data não pode ser no passado
- Horário deve respeitar disponibilidade do espaço
- Sem sobreposição de reservas

---

### 3.3 Sincronização com Google Calendar

```
1. Usuário ativa sincronização (conexão OAuth)
2. Sistema obtém autorização do Google
3. Para cada novo evento:
   a. Cria evento no Google Calendar
   b. Armazena google_calendar_id
   c. Registra no histórico de sincronização
4. Possibilita atualização/exclusão sincronizada
5. Importação de eventos externos
```

**Componentes:**
- Edge Function: `sync_google_calendar`
- Tokens OAuth armazenados de forma segura
- Tratamento automático de erros

---

### 3.4 Notificações

```
Trigger: Ação importante ocorre
  ├─ Novo evento criado
  ├─ Evento cancelado
  ├─ Confirmação de presença
  ├─ Alteração de evento
  └─ Lembrete (24h antes)

Processo:
1. Sistema identifica ação
2. Verifica preferências de notificação do usuário
3. Reúne participantes que devem ser notificados
4. Chama Edge Function: send_event_notifications
5. Emails enviados com template HTML
6. Registra notificação no histórico
```

**Templates de Email:**
- Novo evento
- Confirmação de presença
- Cancelamento
- Lembrete
- Alteração de horário/local

---

## 4. APIs e Edge Functions

### 4.1 Edge Function: send_event_notifications

**Endpoint:** `POST /functions/v1/send_event_notifications`

**Autenticação:** JWT Bearer Token

**Payload:**
```typescript
{
  tipo: 'novo_evento' | 'confirmacao_presenca' | 'cancelamento' | 'lembrete',
  evento: {
    evento_id: string,
    nome: string,
    data_evento: string,
    hora_inicio?: string,
    descricao?: string,
    local?: string,
    participantes: Array<{
      id: string,
      pessoa_id: string,
      email: string,
      nome: string,
      confirmacao_presenca: string
    }>
  },
  participantes?: Array<{id, email, nome}>
}
```

**Response:**
```typescript
{
  sucesso: boolean,
  mensagem: string,
  resultados: Array<{
    email: string,
    sucesso: boolean
  }>
}
```

**Funcionalidades:**
- Geração automática de templates HTML
- Envio de emails via Resend API
- Logging de envios
- Tratamento de erros

---

### 4.2 Edge Function: sync_google_calendar

**Endpoint:** `POST /functions/v1/sync_google_calendar`

**Autenticação:** JWT Bearer Token

**Ações:**
- `exportar`: Cria evento no Google Calendar
- `importar`: Importa evento do Google Calendar

**Payload (Exportação):**
```typescript
{
  acao: 'exportar',
  evento: {
    evento_id: string,
    nome: string,
    descricao?: string,
    data_evento: string,
    hora_inicio?: string,
    hora_fim?: string,
    dia_inteiro: boolean,
    local?: string
  },
  refresh_token: string,
  calendar_id: string
}
```

**Response:**
```typescript
{
  sucesso: boolean,
  google_event_id: string,
  google_calendar_link: string
}
```

**Funcionalidades:**
- Autenticação OAuth com Google
- Criação/atualização de eventos
- Sincronização bidirecional
- Tratamento de fusos horários
- Recordatórios automáticos

---

## 5. Tipos TypeScript

### 5.1 EventoAgenda
```typescript
interface EventoAgenda {
  id: string;
  nome: string;
  descricao?: string;
  data_evento: string;
  hora_inicio?: string;
  hora_fim?: string;
  dia_inteiro: boolean;
  local?: string;
  espaco_id?: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  criado_por: string;
  google_calendar_id?: string;
  sincronizado_google: boolean;
  data_sincronizacao_google?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  espaco?: EspacoFisico;
  participantes?: ParticipanteEvento[];
}
```

### 5.2 ReservaEspaco
```typescript
interface ReservaEspaco {
  id: string;
  espaco_id: string;
  evento_id?: string;
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
  responsavel_nome: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  valor_locacao?: number;
  observacoes?: string;
  criado_por: string;
  created_at: string;
  updated_at: string;
  espaco?: EspacoFisico;
}
```

### 5.3 CalendarDay
```typescript
interface CalendarDay {
  data: string;
  dia: number;
  mes: number;
  ano: number;
  ehMes: boolean;
  ehHoje: boolean;
  ehFeriado: boolean;
  feriado?: Feriado;
  eventos: EventoAgenda[];
  reservas: ReservaEspaco[];
}
```

---

## 6. Componentes React

### 6.1 CalendarPage
- Componente principal da página de agenda
- Gerencia estado do calendário
- Navegação entre meses
- Integração com formulários e detalhes

### 6.2 CalendarGrid
- Exibição do calendário mensal em grid
- 7 colunas (dias da semana)
- Highlight de feriados
- Exibição de eventos e reservas

### 6.3 CalendarDayCell
- Célula individual do dia
- Mostra até 2 eventos resumidos
- Exibe feriados com cores
- Clique para ver detalhes

### 6.4 EventoForm
- Formulário de criação/edição de eventos
- Validação em tempo real
- Detecção de conflitos
- Seleção de participantes

### 6.5 EventoDetalhes
- Visualização completa de um evento
- Listagem de participantes
- Informações de sincronização
- Ações de edição/exclusão

---

## 7. Hooks Customizados

### 7.1 useCalendar

**Funções:**
- `verificarConflitos()`: Detecta conflitos de horário
- `criarEvento()`: Cria novo evento com validações
- `atualizarEvento()`: Atualiza evento existente
- `deletarEvento()`: Deleta evento com cascata
- `criarReserva()`: Cria nova reserva com validações

**Estado:**
```typescript
{
  loading: boolean,
  error: string | null,
  setError: (error: string) => void
}
```

---

## 8. Utilitários (calendarUtils.ts)

### 8.1 Geração de Calendário
- `gerarCalendarMes()`: Gera estrutura do mês
- `criarDiaCalendario()`: Cria dia com eventos

### 8.2 Formatação
- `formatarData()`: YYYY-MM-DD
- `formatarDataBR()`: DD/MM/YYYY
- `formatarHora()`: HH:MM
- `formatarDataHoraBR()`: DD/MM/YYYY às HH:MM

### 8.3 Validações
- `verificarSobreposicaoHorario()`: Detecta conflitos
- `calcularDuracaoEvento()`: Calcula duração em horas
- `obterCoresPorStatus()`: Cores por status de evento
- `obterCoresPorTipoFeriado()`: Cores por tipo de feriado

---

## 9. Fluxo de Validações

### 9.1 Criação de Evento

```
1. Validação Básica:
   ├─ Nome não vazio
   ├─ Data válida
   └─ Se não "dia inteiro": hora_inicio < hora_fim

2. Validação de Conflitos:
   ├─ Busca eventos no mesmo espaço, mesma data
   ├─ Verifica sobreposição de horário
   ├─ Busca reservas no mesmo espaço
   └─ Retorna diagnóstico com detalhes

3. Validação de Disponibilidade:
   ├─ Verifica se espaço tem disponibilidade
   ├─ Valida horário dentro de disponibilidade
   └─ Bloqueia se fora do horário

4. Criação Segura:
   ├─ Transação com rollback automático
   ├─ Adiciona participantes
   └─ Registra criador
```

### 9.2 Criação de Reserva

```
1. Validação de Dados:
   ├─ Responsável obrigatório
   ├─ Data não no passado
   └─ Horário válido

2. Conflito com Eventos:
   ├─ Busca eventos confirmados
   ├─ Verifica sobreposição
   └─ Rejeita se houver conflito

3. Conflito com Reservas:
   ├─ Busca reservas confirmadas
   ├─ Verifica sobreposição
   └─ Rejeita se houver conflito

4. Confirmação:
   ├─ Status = "confirmada"
   └─ Notifica administrador
```

---

## 10. Segurança (RLS - Row Level Security)

### 10.1 Permissões por Tabela

**eventos_agenda:**
- SELECT: Todos os autenticados veem todos os eventos
- INSERT: Apenas usuários autenticados
- UPDATE: Apenas criador do evento
- DELETE: Apenas criador do evento

**reservas_espacos:**
- SELECT: Todos os autenticados
- INSERT: Apenas criador
- UPDATE: Apenas criador
- DELETE: Apenas criador

**configuracoes_notificacoes:**
- SELECT: Apenas o próprio usuário
- INSERT: Apenas para si mesmo
- UPDATE: Apenas para si mesmo

### 10.2 Proteção de Dados

- Tokens Google armazenados em secrets do Supabase
- Senhas e keys nunca em variáveis de ambiente do cliente
- Edge Functions acessam secrets de forma segura
- Logs de acesso registrados para auditoria

---

## 11. Performance e Otimizações

### 11.1 Índices de Banco de Dados

```sql
CREATE INDEX idx_eventos_data ON eventos_agenda(data_evento);
CREATE INDEX idx_eventos_espaco ON eventos_agenda(espaco_id);
CREATE INDEX idx_eventos_criador ON eventos_agenda(criado_por);
CREATE INDEX idx_eventos_status ON eventos_agenda(status);
CREATE INDEX idx_participantes_evento ON participantes_evento(evento_id);
CREATE INDEX idx_participantes_pessoa ON participantes_evento(pessoa_id);
CREATE INDEX idx_reservas_espaco ON reservas_espacos(espaco_id);
CREATE INDEX idx_reservas_data ON reservas_espacos(data_reserva);
CREATE INDEX idx_feriados_data ON feriados(data);
CREATE INDEX idx_sincronizacao_usuario ON sincronizacao_google(usuario_id);
```

### 11.2 Cache Frontend

- Calendário carregado una vez por mês
- Dados cacheados em estado local
- Refresh manual ou ao criar/editar evento

### 11.3 Lazy Loading

- Eventos carregados sob demanda
- Participantes carregados ao abrir detalhes
- Sincronização assíncrona em background

---

## 12. Integração com Google Calendar

### 12.1 Fluxo de Autenticação

```
1. Usuário clica "Sincronizar com Google"
2. Redirecionado para Google OAuth consent screen
3. Usuário autoriza acesso ao calendário
4. Sistema recebe authorization_code
5. Exchange code por access_token + refresh_token
6. Tokens armazenados de forma segura
7. Sincronização ativada
```

### 12.2 Sincronização Bidirecional

**Exportação (Igreja → Google):**
- Novo evento criado
- Sistema chama Edge Function
- Google Calendar atualizado
- google_calendar_id armazenado

**Importação (Google → Igreja):**
- Eventos do Google Calendar
- Importados para eventos_agenda
- Criador definido como sistema
- Status: pendente (aguarda confirmação)

---

## 13. Notificações

### 13.1 Tipos de Notificação

| Tipo | Quando | Destinatário |
|------|--------|--------------|
| Novo Evento | Evento criado | Participantes adicionados |
| Confirmação | Presença confirmada | Criador do evento |
| Cancelamento | Evento cancelado | Todos os participantes |
| Alteração | Evento alterado | Participantes confirmados |
| Lembrete | 24h antes | Participantes confirmados |

### 13.2 Configuração por Usuário

Cada usuário pode ativar/desativar:
- Notificação de novo evento
- Notificação de confirmação
- Notificação de cancelamento
- Notificação de alteração
- Notificação de convite
- Lembretes (com antecedência customizável)

---

## 14. Cenários de Uso

### 14.1 Culto Semanal
```
Evento: "Culto Domingo"
Data: Todos os domingos
Hora: 18:00-19:30
Espaço: Auditório Principal
Participantes: Todos os membros
Status: Confirmado
Sincronização: Sim (recorrente no Google)
```

### 14.2 Reunião de Liderança
```
Evento: "Reunião de Liderança"
Data: Segunda-feira
Hora: 19:00-20:00
Espaço: Sala de Reunião 1
Participantes: Líderes e diáconos
Status: Confirmado
Notificação: Sim (24h antes)
```

### 14.3 Reserva para Terceiros
```
Reserva: "Casamento - Família Silva"
Data: Sábado 15/04
Hora: 16:00-23:00
Espaço: Espaço de Eventos
Responsável: João Silva
Valor: R$ 500,00
Status: Confirmada
Notificação: Ao administrador
```

---

## 15. Tratamento de Erros

### 15.1 Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Conflito de horário | Evento/reserva sobrepõe | Alterar horário ou espaço |
| Espaço indisponível | Fora do horário de funcionamento | Consultar disponibilidade |
| Email inválido | Participante sem email | Adicionar email na ficha |
| Sincronização falhou | Token expirado | Renovar autorização Google |
| Notificação não enviada | Erro do provedor | Reintentar automático |

### 15.2 Logging e Monitoramento

- Erros registrados com timestamp
- Stack trace armazenado para debug
- Email ao administrador se erro crítico
- Dashboard de status de sincronização

---

## 16. Estrutura de Arquivos

```
src/
├── components/Calendar/
│   ├── CalendarGrid.tsx
│   ├── CalendarDayCell.tsx
│   ├── EventoForm.tsx
│   ├── EventoDetalhes.tsx
│   └── ReservaForm.tsx (futuro)
├── pages/
│   └── CalendarPage.tsx
├── hooks/
│   └── useCalendar.ts
├── types/
│   └── calendar.ts
├── utils/
│   └── calendarUtils.ts
└── lib/
    └── supabase.ts
```

---

## 17. Roadmap Futuro

### Fase 2 (v1.1)
- [ ] Eventos recorrentes
- [ ] Convites RSVP via email
- [ ] Importação de feriados dinâmica
- [ ] Notificações SMS
- [ ] Dashboard de utilização de espaços

### Fase 3 (v1.2)
- [ ] Agendamento automático de salas
- [ ] Integração com Outlook/Hotmail
- [ ] Geração de relatórios em PDF
- [ ] Controle de acesso por grupos
- [ ] QR code para check-in de eventos

### Fase 4 (v2.0)
- [ ] App mobile nativa
- [ ] Videochamada integrada
- [ ] IA para sugestão de horários
- [ ] Pagamentos online para locação
- [ ] Análise de ocupação e tendências

---

## 18. Dependências

### npm packages
```json
{
  "@supabase/supabase-js": "^2.57.4",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "lucide-react": "^0.344.0"
}
```

### APIs Externas
- Google Calendar API (sincronização)
- Resend API (emails)
- Supabase Edge Functions (processamento)

---

## 19. Exemplo de Fluxo Completo

### Criação e Notificação de Evento

```typescript
// 1. Usuário cria evento
const evento = {
  nome: "Culto Especial",
  data_evento: "2024-12-25",
  hora_inicio: "18:00",
  hora_fim: "19:30",
  espaco_id: "auditorio-1",
  participantes_ids: ["pessoa1", "pessoa2"],
  status: "confirmado"
};

// 2. Sistema valida conflitos
const conflitos = await verificarConflitos(
  "auditorio-1",
  "2024-12-25",
  "18:00",
  "19:30"
);

// 3. Se OK, cria evento
if (!conflitos.existe) {
  const novoEvento = await criarEvento(evento, userId);

  // 4. Sincroniza com Google
  await fetch('/functions/v1/sync_google_calendar', {
    method: 'POST',
    body: JSON.stringify({
      acao: 'exportar',
      evento: novoEvento,
      refresh_token: userGoogleToken,
      calendar_id: 'primary'
    })
  });

  // 5. Envia notificações
  await fetch('/functions/v1/send_event_notifications', {
    method: 'POST',
    body: JSON.stringify({
      tipo: 'novo_evento',
      evento: novoEvento,
      participantes: participantes
    })
  });
}
```

---

## 20. Conclusão

O módulo de Agenda da Igreja oferece uma solução completa, integrada e segura para o gerenciamento de eventos e reservas. Com suporte a sincronização com Google Calendar, notificações automáticas e validação inteligente de conflitos, garante eficiência operacional e melhor experiência do usuário.

A arquitetura modular permite fácil expansão futura e manutenção do código. O uso de RLS garante segurança dos dados, enquanto as Edge Functions fornecem processamento seguro de tarefas críticas.

---

**Documento atualizado em:** Dezembro 2024
**Versão:** 1.0.0
**Status:** Pronto para produção
