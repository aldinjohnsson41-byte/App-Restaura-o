import { useState, useEffect } from 'react';
import { supabase, Ocorrencia, TipoOcorrencia } from '../../lib/supabase';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface OcorrenciasTabProps {
  pessoaId: string;
}

export default function OcorrenciasTab({ pessoaId }: OcorrenciasTabProps) {
  const { user } = useAuth();
  const [ocorrencias, setOcorrencias] = useState<(Ocorrencia & { tipo_ocorrencia?: TipoOcorrencia })[]>([]);
  const [tiposOcorrencias, setTiposOcorrencias] = useState<TipoOcorrencia[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo_ocorrencia_id: '',
    data_ocorrencia: new Date().toISOString().split('T')[0],
    descricao: '',
  });

  useEffect(() => {
    loadOcorrencias();
    loadTiposOcorrencias();
  }, [pessoaId]);

  const loadOcorrencias = async () => {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*, tipos_ocorrencias:tipo_ocorrencia_id(*)')
      .eq('pessoa_id', pessoaId)
      .order('data_ocorrencia', { ascending: false });

    if (data && !error) {
      const formatted = data.map(item => ({
        ...item,
        tipo_ocorrencia: Array.isArray(item.tipos_ocorrencias)
          ? item.tipos_ocorrencias[0]
          : item.tipos_ocorrencias as TipoOcorrencia | undefined
      }));
      setOcorrencias(formatted);
    }
  };

  const loadTiposOcorrencias = async () => {
    const { data } = await supabase
      .from('tipos_ocorrencias')
      .select('*')
      .order('nome');

    if (data) setTiposOcorrencias(data);
  };

  const registrarHistorico = async (acao: string) => {
    await supabase.from('historico_pessoas').insert({
      pessoa_id: pessoaId,
      acao,
      created_by: user?.id,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('ocorrencias').insert({
        pessoa_id: pessoaId,
        ...formData,
        created_by: user?.id,
      });

      if (error) throw error;

      await registrarHistorico('Ocorrência registrada');

      setFormData({
        tipo_ocorrencia_id: '',
        data_ocorrencia: new Date().toISOString().split('T')[0],
        descricao: '',
      });
      setShowForm(false);
      loadOcorrencias();
    } catch (err) {
      alert('Erro ao salvar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta ocorrência?')) return;

    const { error } = await supabase.from('ocorrencias').delete().eq('id', id);

    if (!error) {
      await registrarHistorico('Ocorrência excluída');
      loadOcorrencias();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Ocorrências</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Ocorrência
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Ocorrência *
              </label>
              <select
                required
                value={formData.tipo_ocorrencia_id}
                onChange={(e) => setFormData({ ...formData, tipo_ocorrencia_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {tiposOcorrencias.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data da Ocorrência *
              </label>
              <input
                type="date"
                required
                value={formData.data_ocorrencia}
                onChange={(e) => setFormData({ ...formData, data_ocorrencia: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrição *
            </label>
            <textarea
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {ocorrencias.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Nenhuma ocorrência registrada</p>
          </div>
        ) : (
          ocorrencias.map((ocorrencia) => (
            <div
              key={ocorrencia.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    {ocorrencia.tipo_ocorrencia?.nome || 'N/A'}
                  </span>
                  <p className="text-sm text-slate-600 mt-2">
                    {new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(ocorrencia.id)}
                  className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-700">{ocorrencia.descricao}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
