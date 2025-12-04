import { ArrowLeft, Edit, Trash2, Users, MapPin, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EventoDetalhesProps {
  evento: any;
  onEditar: () => void;
  onVoltar: () => void;
  onExcluir?: () => void;
}

export default function EventoDetalhesCompleto({
  evento,
  onEditar,
  onVoltar,
  onExcluir
}: EventoDetalhesProps) {
  
  const formatarDataBR = (data: string) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHora = (hora: string) => {
    if (!hora) return '';
    return hora.substring(0, 5);
  };

  const obterCoresStatus = (status: string) => {
    const cores = {
      confirmado: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
    };
    return cores[status as keyof typeof cores] || cores.pendente;
  };

  const cores = obterCoresStatus(evento.status);

  const calcularDuracaoEvento = () => {
    if (!evento.multiplos_dias) return '1 dia';
    
    const inicio = new Date(evento.data_evento);
    const fim = new Date(evento.data_fim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return `${dias} dias`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <button
                onClick={onVoltar}
                className="p-2 hover:bg-white/20 rounded-lg transition mt-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{evento.nome}</h2>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm">
                    {evento.status === 'confirmado' && <CheckCircle className="w-4 h-4" />}
                    {evento.status === 'pendente' && <AlertCircle className="w-4 h-4" />}
                    {evento.status === 'cancelado' && <XCircle className="w-4 h-4" />}
                    {evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
                  </div>

                  {evento.dia_inteiro && (
                    <div className="px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm">
                      Dia Inteiro
                    </div>
                  )}

                  {evento.multiplos_dias && (
                    <div className="px-3 py-1 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm">
                      {calcularDuracaoEvento()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ---- BOTÕES ----- */}
            <div className="flex gap-2">
              <button
                onClick={onEditar}
                className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2 font-medium"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>

              {onExcluir && (
                <button
                  onClick={onExcluir}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Descrição */}
          {evento.descricao && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Descrição</h3>
              <p className="text-blue-800 whitespace-pre-wrap">{evento.descricao}</p>
            </div>
          )}

          {/* Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Data */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Data do Evento</p>
                  <p className="font-semibold text-slate-900 text-lg">
                    {formatarDataBR(evento.data_evento)}
                  </p>
                  {evento.multiplos_dias && evento.data_fim && (
                    <p className="text-sm text-slate-600 mt-1">
                      até {formatarDataBR(evento.data_fim)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Horário */}
            {!evento.dia_inteiro && evento.hora_inicio && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">Horário</p>
                    <p className="font-semibold text-slate-900 text-lg">
                      {formatarHora(evento.hora_inicio)} às {formatarHora(evento.hora_fim || '')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Espaço */}
            {evento.espaco && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-1">Espaço da Igreja</p>
                    <p className="font-semibold text-slate-900">{evento.espaco.nome}</p>
                    {evento.espaco.localizacao && (
                      <p className="text-sm text-slate-600">{evento.espaco.localizacao}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

function calcularDuracao(inicio: string, fim: string): string {
  if (!inicio || !fim) return '';

  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);

  const minutos = (hf * 60 + mf) - (hi * 60 + mi);
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (horas === 0) return `${mins} minutos`;
  if (mins === 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
  return `${horas}h ${mins}min`;
}
