// Adicione esta atualização na função carregarDados() do CalendarPage.tsx

const carregarDados = async () => {
  try {
    setLoading(true);
    setError('');

    console.log('📄 Carregando dados do calendário...'); 

    const [eventosRes, reservasRes, feriadosRes] = await Promise.all([
      // ✅ CORREÇÃO: Incluir participantes na query
      supabase
        .from('eventos_agenda')
        .select(`
          *,
          espaco:espaco_id(*),
          participantes:evento_participantes(
            id,
            pessoa_id,
            confirmacao_presenca,
            data_confirmacao,
            notificacao_enviada,
            email_enviado_para,
            created_at,
            pessoa:pessoa_id(
              id,
              nome_completo,
              email,
              telefone,
              whatsapp
            )
          )
        `)
        .order('data_evento'),
      supabase
        .from('reservas_espacos')
        .select(`*, espaco:espaco_id(*)`)
        .order('data_reserva'),
      supabase
        .from('feriados')
        .select('*')
        .order('data')
    ]);

    console.log('📅 Response completo:', eventosRes);
    console.log('❌ Erro na query?:', eventosRes.error);
    console.log('📅 Eventos carregados:', eventosRes.data);
    
    if (eventosRes.data && eventosRes.data.length > 0) {
      console.log('👥 Primeiro evento:', eventosRes.data[0]);
      console.log('👥 Participantes do primeiro evento:', eventosRes.data[0]?.participantes);
      console.log('👥 Quantidade de participantes:', eventosRes.data[0]?.participantes?.length);
    }
    
    if (eventosRes.data) {
      setEventos(eventosRes.data as EventoAgenda[]);
    }
    if (reservasRes.data) setReservas(reservasRes.data as ReservaEspaco[]);
    if (feriadosRes.data) setFeriados(feriadosRes.data as Feriado[]);
  } catch (err: any) {
    setError('Erro ao carregar dados do calendário');
    console.error('❌ Erro ao carregar dados:', err);
  } finally {
    setLoading(false);
  }
};