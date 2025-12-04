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
            pessoa:pessoa_id(
              id,
              nome_completo,
              email,
              telefone
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

    console.log('📅 Eventos carregados:', eventosRes.data); 
    
    if (eventosRes.data) {
      console.log('👥 Participantes do primeiro evento:', eventosRes.data[0]?.participantes);
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