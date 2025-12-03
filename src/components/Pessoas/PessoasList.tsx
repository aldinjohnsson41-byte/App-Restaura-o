import { useState, useEffect } from 'react';
import { supabase, Pessoa, Cargo, Ministerio, GrupoFamiliar } from '../../lib/supabase';
import { Search, Edit, Trash2, Eye, Plus, Filter } from 'lucide-react';

interface PessoasListProps {
  onEdit: (pessoa: Pessoa) => void;
  onView: (pessoa: Pessoa) => void;
  onNew: () => void;
  refreshTrigger?: number;
}

export default function PessoasList({ onEdit, onView, onNew, refreshTrigger }: PessoasListProps) {
  const [pessoas, setPessoas] = useState<
    (Pessoa & {
      cargo?: Cargo;
      ministerio?: Ministerio;
      grupo_familiar?: GrupoFamiliar;
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [gruposFamiliares, setGruposFamiliares] = useState<GrupoFamiliar[]>([]);

  const [filters, setFilters] = useState({
    nome: '',
    cargo_id: '',
    ministerio_id: '',
    grupo_familiar_id: '',
    e_membro: '',
    estado_civil: '',
  });

  useEffect(() => {
    loadPessoas();
    loadFilterData();
  }, [refreshTrigger]);

  useEffect(() => {
    loadPessoas();
  }, [filters]);

  const loadFilterData = async () => {
    const [cargosRes, ministeriosRes, gruposRes] = await Promise.all([
      supabase.from('cargos').select('*').order('nome'),
      supabase.from('ministerios').select('*').order('nome'),
      supabase.from('grupos_familiares').select('*').order('nome'),
    ]);

    if (cargosRes.data) setCargos(cargosRes.data);
    if (ministeriosRes.data) setMinisterios(ministeriosRes.data);
    if (gruposRes.data) setGruposFamiliares(gruposRes.data);
  };

  const loadPessoas = async () => {
    setLoading(true);

    let query = supabase
      .from('pessoas')
      .select(`
        *,
        cargo:cargo_id(*),
        ministerio:ministerio_id(*),
        grupo_familiar:grupo_familiar_id(*)
      `)
      .order('nome_completo');

    if (filters.nome) {
      query = query.ilike('nome_completo', `%${filters.nome}%`);
    }

    if (filters.cargo_id) {
      query = query.eq('cargo_id', filters.cargo_id);
    }

    if (filters.ministerio_id) {
      query = query.eq('ministerio_id', filters.ministerio_id);
    }

    if (filters.grupo_familiar_id) {
      query = query.eq('grupo_familiar_id', filters.grupo_familiar_id);
    }

    if (filters.e_membro !== '') {
      query = query.eq('e_membro', filters.e_membro === 'true');
    }

    if (filters.estado_civil) {
      query = query.eq('estado_civil', filters.estado_civil);
    }

    const { data, error } = await query;

    if (data && !error) {
      const formatted = data.map((item) => ({
        ...item,
        cargo: Array.isArray(item.cargo) ? item.cargo[0] : item.cargo,
        ministerio: Array.isArray(item.ministerio) ? item.ministerio[0] : item.ministerio,
        grupo_familiar: Array.isArray(item.grupo_familiar) ? item.grupo_familiar[0] : item.grupo_familiar,
      }));
      setPessoas(formatted);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pessoa? Esta ação não pode ser desfeita.')) {
      return;
    }

    const { error } = await supabase.from('pessoas').delete().eq('id', id);

    if (!error) {
      loadPessoas();
    } else {
      alert('Erro ao excluir pessoa');
    }
  };

  const clearFilters = () => {
    setFilters({
      nome: '',
      cargo_id: '',
      ministerio_id: '',
      grupo_familiar_id: '',
      e_membro: '',
      estado_civil: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-slate-900">Pessoas</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={onNew}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Pessoa
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={filters.nome}
                  onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cargo</label>
              <select
                value={filters.cargo_id}
                onChange={(e) => setFilters({ ...filters, cargo_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ministério</label>
              <select
                value={filters.ministerio_id}
                onChange={(e) => setFilters({ ...filters, ministerio_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {ministerios.map((ministerio) => (
                  <option key={ministerio.id} value={ministerio.id}>
                    {ministerio.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Grupo Familiar</label>
              <select
                value={filters.grupo_familiar_id}
                onChange={(e) => setFilters({ ...filters, grupo_familiar_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {gruposFamiliares.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Membro</label>
              <select
                value={filters.e_membro}
                onChange={(e) => setFilters({ ...filters, e_membro: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estado Civil</label>
              <select
                value={filters.estado_civil}
                onChange={(e) => setFilters({ ...filters, estado_civil: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="solteiro">Solteiro</option>
                <option value="casado">Casado</option>
                <option value="viúvo">Viúvo</option>
                <option value="divorciado">Divorciado</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm transition"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando...</p>
        </div>
      ) : pessoas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600">Nenhuma pessoa encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Membro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Ministério
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Grupo Familiar
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pessoas.map((pessoa) => (
                  <tr key={pessoa.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {pessoa.nome_completo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{pessoa.telefone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          pessoa.e_membro
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {pessoa.e_membro ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {pessoa.cargo?.nome || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {pessoa.ministerio?.nome || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {pessoa.grupo_familiar?.nome || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onView(pessoa)}
                          className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(pessoa)}
                          className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pessoa.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-slate-600">
        Total: {pessoas.length} pessoa(s)
      </div>
    </div>
  );
}
