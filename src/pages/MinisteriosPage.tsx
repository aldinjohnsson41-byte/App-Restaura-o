import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, ArrowLeft, Save, X, Calendar, UserPlus } from 'lucide-react';

// Types
type MinistryStatus = 'ativo' | 'inativo';
type MemberRole = 'membro' | 'lider';
type MemberStatus = 'ativo' | 'inativo' | 'afastado';
type ViewType = 'list' | 'form' | 'details';
type TabType = 'dados' | 'membros' | 'escalas';

interface Ministry {
  id: string;
  nome: string;
  descricao?: string;
  status: MinistryStatus;
  cor: string;
  membros_count?: number;
  escalas_count?: number;
}

interface Pessoa {
  id: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
}

interface MinistryMember {
  id: string;
  ministry_id: string;
  pessoa_id: string;
  funcao: MemberRole;
  status: MemberStatus;
  data_entrada: string;
  pessoa: Pessoa;
}

interface Schedule {
  id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  membros: MinistryMember[];
}

interface MinistryFormData {
  nome: string;
  descricao: string;
  status: MinistryStatus;
  cor: string;
}

// Mock Supabase
const mockSupabase = {
  from: (table: string) => ({
    select: (fields?: string) => ({
      eq: (field: string, value: any) => ({
        order: (field: string, options?: any) => ({
          then: (callback: (result: any) => void) => {
            // Simular dados
            if (table === 'ministries') {
              callback({ data: [], error: null });
            } else if (table === 'ministry_members') {
              callback({ data: [], error: null });
            } else if (table === 'pessoas') {
              callback({ 
                data: [
                  { id: '1', nome_completo: 'João Silva', email: 'joao@email.com', telefone: '(11) 98765-4321' },
                  { id: '2', nome_completo: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 98765-1234' },
                  { id: '3', nome_completo: 'Pedro Costa', email: 'pedro@email.com', telefone: '(11) 98765-5678' }
                ], 
                error: null 
              });
            }
            return Promise.resolve({ data: [], error: null });
          }
        }),
        then: (callback: (result: any) => void) => {
          callback({ data: [], error: null });
          return Promise.resolve({ data: [], error: null });
        }
      }),
      order: (field: string, options?: any) => ({
        then: (callback: (result: any) => void) => {
          if (table === 'pessoas') {
            callback({ 
              data: [
                { id: '1', nome_completo: 'João Silva', email: 'joao@email.com', telefone: '(11) 98765-4321' },
                { id: '2', nome_completo: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 98765-1234' },
                { id: '3', nome_completo: 'Pedro Costa', email: 'pedro@email.com', telefone: '(11) 98765-5678' }
              ], 
              error: null 
            });
          }
          return Promise.resolve({ data: [], error: null });
        }
      }),
      then: (callback: (result: any) => void) => {
        callback({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      }
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => ({
          then: (callback: (result: any) => void) => {
            callback({ data: { ...data, id: Date.now().toString() }, error: null });
            return Promise.resolve({ data: { ...data, id: Date.now().toString() }, error: null });
          }
        })
      })
    }),
    update: (data: any) => ({
      eq: (field: string, value: any) => ({
        then: (callback: (result: any) => void) => {
          callback({ data: null, error: null });
          return Promise.resolve({ data: null, error: null });
        }
      })
    }),
    delete: () => ({
      eq: (field: string, value: any) => ({
        then: (callback: (result: any) => void) => {
          callback({ error: null });
          return Promise.resolve({ error: null });
        }
      })
    })
  })
};

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ativo: 'bg-green-100 text-green-800 border-green-200',
    inativo: 'bg-slate-100 text-slate-800 border-slate-200',
    afastado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    membro: 'bg-blue-100 text-blue-800 border-blue-200',
    lider: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.ativo}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Add Member Modal
function AddMemberModal({ 
  isOpen, 
  onClose, 
  pessoas, 
  currentMembers,
  onAdd 
}: { 
  isOpen: boolean;
  onClose: () => void;
  pessoas: Pessoa[];
  currentMembers: MinistryMember[];
  onAdd: (pessoa: Pessoa, funcao: MemberRole) => void;
}) {
  const [selectedPessoa, setSelectedPessoa] = useState<string>('');
  const [funcao, setFuncao] = useState<MemberRole>('membro');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentMemberIds = currentMembers.map(m => m.pessoa_id);
  const availablePessoas = pessoas.filter(p => !currentMemberIds.includes(p.id));
  
  const filteredPessoas = availablePessoas.filter(p =>
    p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    const pessoa = pessoas.find(p => p.id === selectedPessoa);
    if (pessoa) {
      onAdd(pessoa, funcao);
      setSelectedPessoa('');
      setFuncao('membro');
      setSearchTerm('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Adicionar Membro</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar Pessoa
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecione a Pessoa
            </label>
            <select
              value={selectedPessoa}
              onChange={(e) => setSelectedPessoa(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {filteredPessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome_completo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Função
            </label>
            <select
              value={funcao}
              onChange={(e) => setFuncao(e.target.value as MemberRole)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="membro">Membro</option>
              <option value="lider">Líder</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedPessoa}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// Members Tab Component
function MinistryMembersTab({ 
  members, 
  pessoas,
  onAddMember,
  onRemoveMember 
}: { 
  members: MinistryMember[];
  pessoas: Pessoa[];
  onAddMember: (pessoa: Pessoa, funcao: MemberRole) => void;
  onRemoveMember: (member: MinistryMember) => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Membros ({members.length})
          </h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </button>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{member.pessoa.nome_completo}</div>
                  <div className="text-sm text-slate-600">
                    {member.pessoa.email || member.pessoa.telefone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={member.funcao} />
                <StatusBadge status={member.status} />
                <button 
                  onClick={() => onRemoveMember(member)}
                  className="p-2 hover:bg-red-50 rounded-lg transition"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
            <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Nenhum membro cadastrado</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Primeiro Membro
            </button>
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        pessoas={pessoas}
        currentMembers={members}
        onAdd={onAddMember}
      />
    </>
  );
}

// Main App Component
export default function MinistryManagementSystem() {
  const [view, setView] = useState<ViewType>('list');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [members, setMembers] = useState<MinistryMember[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('dados');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<MinistryFormData>({
    nome: '',
    descricao: '',
    status: 'ativo',
    cor: '#3B82F6'
  });

  // Carregar pessoas do sistema
  useEffect(() => {
    loadPessoas();
    loadMinistries();
  }, []);

  const loadPessoas = async () => {
    try {
      const { data } = await mockSupabase
        .from('pessoas')
        .select('*')
        .order('nome_completo');
      
      if (data) {
        setPessoas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    }
  };

  const loadMinistries = async () => {
    setLoading(true);
    try {
      // Aqui você usaria o Supabase real
      // const { data } = await supabase.from('ministries').select('*');
      setMinistries([
        {
          id: '1',
          nome: 'Louvor e Adoração',
          descricao: 'Ministério de música e cânticos',
          status: 'ativo',
          cor: '#3B82F6',
          membros_count: 0,
          escalas_count: 0
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar ministérios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMinistryMembers = async (ministryId: string) => {
    setLoading(true);
    try {
      const { data } = await mockSupabase
        .from('ministry_members')
        .select('*, pessoa:pessoa_id(*)')
        .eq('ministry_id', ministryId)
        .order('funcao', { ascending: false });
      
      if (data) {
        setMembers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (pessoa: Pessoa, funcao: MemberRole) => {
    if (!selectedMinistry) return;
    
    setLoading(true);
    try {
      const now = new Date().toISOString().split('T')[0];
      
      const { data } = await mockSupabase
        .from('ministry_members')
        .insert({
          ministry_id: selectedMinistry.id,
          pessoa_id: pessoa.id,
          funcao: funcao,
          status: 'ativo',
          data_entrada: now
        })
        .select()
        .single();

      if (data) {
        // Adicionar ao estado local
        const newMember: MinistryMember = {
          ...data,
          pessoa: pessoa
        };
        setMembers(prev => [...prev, newMember]);
        
        // Atualizar contagem
        setMinistries(prev => prev.map(m => 
          m.id === selectedMinistry.id 
            ? { ...m, membros_count: (m.membros_count || 0) + 1 }
            : m
        ));
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: MinistryMember) => {
    if (!confirm(`Remover ${member.pessoa.nome_completo} do ministério?`)) return;
    
    setLoading(true);
    try {
      await mockSupabase
        .from('ministry_members')
        .delete()
        .eq('id', member.id);

      setMembers(prev => prev.filter(m => m.id !== member.id));
      
      // Atualizar contagem
      if (selectedMinistry) {
        setMinistries(prev => prev.map(m => 
          m.id === selectedMinistry.id 
            ? { ...m, membros_count: Math.max((m.membros_count || 0) - 1, 0) }
            : m
        ));
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      alert('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMinistry = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    loadMinistryMembers(ministry.id);
    setActiveTab('dados');
    setView('details');
  };

  const handleNewMinistry = () => {
    setSelectedMinistry(null);
    setFormData({
      nome: '',
      descricao: '',
      status: 'ativo',
      cor: '#3B82F6'
    });
    setView('form');
  };

  const filteredMinistries = ministries.filter(ministry => {
    const matchesSearch = ministry.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ministry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Ministérios</h2>
              <p className="text-slate-600 mt-1">Gerencie ministérios, membros e escalas</p>
            </div>
            <button
              onClick={handleNewMinistry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Ministério
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar ministério..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMinistries.map((ministry) => (
              <div
                key={ministry.id}
                className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 cursor-pointer"
                onClick={() => handleViewMinistry(ministry)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: ministry.cor + '20' }}
                    >
                      <Users className="w-6 h-6" style={{ color: ministry.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {ministry.nome}
                      </h3>
                      <StatusBadge status={ministry.status} />
                    </div>
                  </div>
                </div>

                {ministry.descricao && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {ministry.descricao}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {ministry.membros_count || 0}
                    </div>
                    <div className="text-xs text-slate-600">Membros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {ministry.escalas_count || 0}
                    </div>
                    <div className="text-xs text-slate-600">Escalas</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMinistries.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum ministério encontrado
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro ministério'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DETAILS VIEW
  if (view === 'details' && selectedMinistry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('list')}
                className="p-2 hover:bg-white rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedMinistry.cor + '20' }}
                >
                  <Users className="w-6 h-6" style={{ color: selectedMinistry.cor }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedMinistry.nome}</h2>
                  <StatusBadge status={selectedMinistry.status} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200">
              <nav className="flex gap-1 px-6">
                {[
                  { id: 'dados' as TabType, label: 'Dados', icon: Users },
                  { id: 'membros' as TabType, label: 'Membros', icon: UserPlus },
                  { id: 'escalas' as TabType, label: 'Escalas', icon: Calendar }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'dados' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Descrição</h3>
                    <p className="text-slate-900">
                      {selectedMinistry.descricao || 'Sem descrição cadastrada'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Cor</h3>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-slate-300"
                          style={{ backgroundColor: selectedMinistry.cor }}
                        />
                        <span className="text-slate-900 font-mono">{selectedMinistry.cor}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Status</h3>
                      <StatusBadge status={selectedMinistry.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-900 mb-1">
                        {members.length}
                      </div>
                      <div className="text-sm text-blue-700">Membros Ativos</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-900 mb-1">
                        {selectedMinistry.escalas_count || 0}
                      </div>
                      <div className="text-sm text-green-700">Escalas Futuras</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'membros' && (
                <MinistryMembersTab
                  members={members}
                  pessoas={pessoas}
                  onAddMember={handleAddMember}
                  onRemoveMember={handleRemoveMember}
                />
              )}

              {activeTab === 'escalas' && (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhuma escala cadastrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORM VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('list')}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedMinistry ? 'Editar Ministério' : 'Novo Ministério'}
            </h2>
            <p className="text-slate-600 text-sm">Preencha os dados do ministério</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Ministério *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Louvor e Adoração"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva o propósito e atividades do ministério..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MinistryStatus })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cor
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10 w-20 rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => setView('list')}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aqui você salvaria no Supabase
                  alert('Funcionalidade de salvar será implementada com Supabase real');
                  setView('list');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Ministério
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}