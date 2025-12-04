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

      if (eventosRes.data) setEventos(eventosRes.data as EventoAgenda[]);
      if (reservasRes.data) setReservas(reservasRes.data as ReservaEspaco[]);
      if (feriadosRes.data) setFeriados(feriadosRes.data as Feriado[]);
    } catch (err: any) {
      setError('Erro ao carregar dados do calendÃ¡rio');
      console.error(err);
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

      if (editandoEvento) {
        await atualizarEvento(editandoEvento.id, eventoData);
      } else {
        if (!user) throw new Error('UsuÃ¡rio nÃ£o autenticado');
        await criarEvento(eventoData, user.id);
      }

      await carregarDados();
      setViewMode('calendario');
      setEditandoEvento(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento');
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
          <p className="text-slate-600 text-sm">Gerenciar eventos e reservas de espaÃ§os</p>
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
              <p className="text-slate-600">Carregando calendÃ¡rio...</p>
            </div>
          ) : (
            <CalendarGrid
              calendarMes={calendarMes}
              onSelectEvento={handleVisualizarEvento}
              onEditarEvento={handleEditarEvento}
              onNovoEvento={handleNovoEvento}
            />
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
        />
      )}
    </div>
  );
}