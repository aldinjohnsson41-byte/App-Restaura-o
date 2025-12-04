import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCalendar } from '../hooks/useCalendar';
import { EventoAgenda, ReservaEspaco, Feriado } from '../types/calendar';
import { gerarCalendarMes, obterNomeMes, adicionarMeses, formatarData } from '../utils/calendarUtils';
import CalendarGrid from '../components/Calendar/CalendarGrid';
import EventoForm from '../components/Calendar/EventoForm';
import EventoDetalhes from '../components/Calendar/EventoDetalhes';

type ViewMode = 'calendario' | 'form' | 'detalhes';

interface CalendarPageProps {
  onBack: () => void;
}

export default function CalendarPage({ onBack }: CalendarPageProps) {
  const { user } = useAuth();
  const { verificarConflitos, criarEvento, atualizarEvento, loading: calendarLoading } = useCalendar();

  const [dataAtual, setDataAtual] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendario');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [reservas, setReservas] = useState<ReservaEspaco[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);

  const [selectedEvento, setSelectedEvento] = useState<EventoAgenda | null>(null);
  const [editandoEvento, setEditandoEvento] = useState<EventoAgenda | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Carregando dados do calendário...'); // Debug

      const [eventosRes, reservasRes, feriadosRes] = await Promise.all([
        supabase
          .from('eventos_agenda')
          .select(`*, espaco:espaco_id(*)`)
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

      console.log('📅 Eventos carregados:', eventosRes.data); // Debug

      if (eventosRes.data) setEventos(eventosRes.data as EventoAgenda[]);
      if (reservasRes.data) setReservas(reservasRes.data as ReservaEspaco[]);
      if (feriadosRes.data) setFeriados(feriadosRes.data as Feriado[]);
    } catch (err: any) {
      setError('Erro ao carregar dados do calendário');
      console.error('❌ Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigarMes = (direcao: 'anterior' | 'proxima') => {
    const novaData = new Date(dataAtual);
    if (direcao === 'anterior') {
      novaData.setMonth(novaData.getMonth() - 1);
    } else {
      novaData.setMonth(novaData.getMonth() + 1);
    }
    setDataAtual(novaData);
  };

  const handleNovoEvento = () => {
    setEditandoEvento(null);
    setSelectedEvento(null);
    setViewMode('form');
  };

  const handleEditarEvento = (evento: EventoAgenda) => {
    setEditandoEvento(evento);
    setViewMode('form');
  };

  const handleVisualizarEvento = (evento: EventoAgenda) => {
    setSelectedEvento(evento);
    setViewMode('detalhes');
  };

  const handleSalvarEvento = async (eventoData: any) => {
    try {
      setError('');
      console.log('💾 Salvando evento...', eventoData); // Debug

      // ✅ Validar conflitos apenas se não for dia inteiro
      if (!eventoData.dia_inteiro && eventoData.hora_inicio && eventoData.hora_fim) {
        const conflitos = await verificarConflitos(
          eventoData.espaco_id,
          eventoData.data_evento,
          eventoData.hora_inicio,
          eventoData.hora_fim,
          editandoEvento?.id
        );

        if (conflitos.existe) {
          setError(`Conflito detectado: ${conflitos.conflitos.map(c => c.nome).join(', ')}`);
          return;
        }
      }

      // ✅ Criar ou atualizar evento
      if (editandoEvento) {
        console.log('✏️ Atualizando evento existente:', editandoEvento.id);
        await atualizarEvento(editandoEvento.id, eventoData);
      } else {
        console.log('➕ Criando novo evento');
        if (!user) throw new Error('Usuário não autenticado');
        await criarEvento(eventoData, user.id);
      }

      // ✅ CORREÇÃO PRINCIPAL: Recarregar dados ANTES de voltar ao calendário
      console.log('🔄 Recarregando dados após salvar...');
      await carregarDados();

      // ✅ Limpar estados e voltar ao calendário
      setViewMode('calendario');
      setEditandoEvento(null);
      setSelectedEvento(null);

      console.log('✅ Evento salvo com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao salvar evento:', err);
      setError(err.message || 'Erro ao salvar evento');
    }
  };

  const handleExcluirEvento = async () => {
    if (!selectedEvento) return;

    if (!confirm('Deseja realmente excluir este evento?')) return;

    try {
      setError('');
      console.log('🗑️ Excluindo evento:', selectedEvento.id);

      const { error: deleteError } = await supabase
        .from('eventos_agenda')
        .delete()
        .eq('id', selectedEvento.id);

      if (deleteError) throw deleteError;

      // ✅ Recarregar dados após excluir
      console.log('🔄 Recarregando dados após excluir...');
      await carregarDados();

      // Voltar ao calendário
      setViewMode('calendario');
      setSelectedEvento(null);

      console.log('✅ Evento excluído com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao excluir evento:', err);
      setError(err.message || 'Erro ao excluir evento');
    }
  };

  const handleCancelar = () => {
    setViewMode('calendario');
    setEditandoEvento(null);
    setSelectedEvento(null);
    setError('');
  };

  const calendarMes = gerarCalendarMes(
    dataAtual.getMonth(),
    dataAtual.getFullYear(),
    feriados,
    eventos,
    reservas
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Agenda da Igreja</h2>
          <p className="text-slate-600 text-sm">Gerenciar eventos e reservas de espaços</p>
        </div>
        {viewMode === 'calendario' && (
          <button
            onClick={handleNovoEvento}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {viewMode === 'calendario' && (
        <>
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <button
              onClick={() => handleNavigarMes('anterior')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>

            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">
                {obterNomeMes(dataAtual.getMonth())} de {dataAtual.getFullYear()}
              </h3>
            </div>

            <button
              onClick={() => handleNavigarMes('proxima')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>

            <button
              onClick={() => setDataAtual(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition"
            >
              Hoje
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Carregando calendário...</p>
            </div>
          ) : (
            <>
              <CalendarGrid
                calendarMes={calendarMes}
                onSelectEvento={handleVisualizarEvento}
                onEditarEvento={handleEditarEvento}
                onNovoEvento={handleNovoEvento}
              />
              
              {/* Contador de eventos */}
              <div className="text-sm text-slate-600 text-center">
                📅 Total: {eventos.length} evento(s) | 🏢 {reservas.length} reserva(s)
              </div>
            </>
          )}
        </>
      )}

      {viewMode === 'form' && (
        <EventoForm
          evento={editandoEvento}
          onSalvar={handleSalvarEvento}
          onCancelar={handleCancelar}
          loading={calendarLoading}
        />
      )}

      {viewMode === 'detalhes' && selectedEvento && (
        <EventoDetalhes
          evento={selectedEvento}
          onEditar={() => handleEditarEvento(selectedEvento)}
          onVoltar={handleCancelar}
          onExcluir={handleExcluirEvento}
        />
      )}
    </div>
  );
}