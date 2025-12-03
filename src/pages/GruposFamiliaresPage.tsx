// GruposFamiliaresPage.tsx — Reescrito completamente com melhorias solicitadas
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PessoaDetails from "../components/Pessoas/PessoaDetails";
import { FiPlus, FiSearch, FiChevronDown, FiCheck, FiEdit } from "react-icons/fi";
import { api } from "../services/api";

interface GrupoFamiliar {
  id: string;
  nome_grupo: string;
  lider_id: string | null;
  co_lider_1_id: string | null;
  co_lider_2_id: string | null;
}

interface Pessoa {
  id: string;
  nome_completo: string;
}

export default function GruposFamiliaresPage() {
  const navigate = useNavigate();

  // VIEWS
  const [viewMode, setViewMode] = useState<"list" | "details" | "searchPessoa">("list");

  // GRUPO
  const [grupos, setGrupos] = useState<GrupoFamiliar[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoFamiliar | null>(null);

  // MEMBROS
  const [membros, setMembros] = useState<Pessoa[]>([]);

  // PESSOAS (para pesquisa)
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // VIEW DE PESSOA
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null);

  // HISTÓRICO
  const [historico, setHistorico] = useState<any[]>([]);

  const loadGrupos = useCallback(async () => {
    const { data } = await api.get("/grupos");
    setGrupos(data);
  }, []);

  const loadMembros = useCallback(async (grupoId: string) => {
    const { data } = await api.get(`/grupos/${grupoId}/membros`);
    setMembros(data);
  }, []);

  const loadHistorico = useCallback(async (grupoId: string) => {
    const { data } = await api.get(`/grupos/${grupoId}/historico`);
    setHistorico(data);
  }, []);

  const loadPessoas = useCallback(async () => {
    const { data } = await api.get("/pessoas");
    setPessoas(data);
  }, []);

  useEffect(() => {
    loadGrupos();
    loadPessoas();
  }, []);

  const openGrupo = async (grupo: GrupoFamiliar) => {
    setSelectedGrupo(grupo);
    await loadMembros(grupo.id);
    await loadHistorico(grupo.id);
    setViewMode("details");
  };

  const openPessoaFicha = (id: string) => {
    setSelectedPessoaId(id);
  };

  const adicionarMembro = async (pessoa: Pessoa) => {
    if (!selectedGrupo) return;

    await api.post(`/grupos/${selectedGrupo.id}/membros`, { pessoa_id: pessoa.id });

    // Registrar histórico
    await api.post(`/grupos/${selectedGrupo.id}/historico`, {
      descricao: `Membro ${pessoa.nome_completo} adicionado`,
      tipo: "adicao",
      status: "sucesso",
    });

    await loadMembros(selectedGrupo.id);
    await loadHistorico(selectedGrupo.id);

    setViewMode("details");
  };

  const alterarLider = async (campo: "lider" | "co_lider_1" | "co_lider_2", pessoaId: string) => {
    if (!selectedGrupo) return;

    await api.put(`/grupos/${selectedGrupo.id}/lideranca`, {
      campo,
      pessoa_id: pessoaId,
    });

    await api.post(`/grupos/${selectedGrupo.id}/historico`, {
      descricao: `Definido ${campo.replace("_", " ")} para ${pessoas.find(p => p.id === pessoaId)?.nome_completo}`,
      tipo: "lideranca",
      status: "sucesso",
    });

    await loadGrupos();
    const g = grupos.find(g => g.id === selectedGrupo.id) as GrupoFamiliar;
    setSelectedGrupo(g);
    await loadHistorico(selectedGrupo.id);
  };

  const filteredPessoas = pessoas.filter(p => p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()));

  // ==================================================
  // LISTA DE GRUPOS
  // ==================================================
  if (viewMode === "list") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Grupos Familiares</h1>

        <div className="space-y-2">
          {grupos.map(g => (
            <div key={g.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">{g.nome_grupo}</div>
              </div>
              <button
                onClick={() => openGrupo(g)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Abrir
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================================================
  // PESQUISA PARA ADICIONAR NOVO MEMBRO
  // ==================================================
  if (viewMode === "searchPessoa") {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Adicionar Membro</h2>

        <div className="flex items-center gap-2 mb-4">
          <FiSearch />
          <input
            className="border p-2 rounded w-full"
            placeholder="Pesquisar pessoa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filteredPessoas.map(p => (
            <div
              key={p.id}
              onClick={() => adicionarMembro(p)}
              className="p-3 bg-white rounded shadow cursor-pointer hover:bg-green-100"
            >
              {p.nome_completo}
            </div>
          ))}
        </div>

        <button className="mt-4" onClick={() => setViewMode("details")}>Voltar</button>
      </div>
    );
  }

  // ==================================================
  // DETALHES DO GRUPO
  // ==================================================
  return (
    <div className="p-6 space-y-6">
      {selectedPessoaId && (
        <PessoaDetails
          pessoaId={selectedPessoaId}
          onClose={() => setSelectedPessoaId(null)}
        />
      )}

      {!selectedPessoaId && selectedGrupo && (
        <>
          <h1 className="text-2xl font-bold mb-4">{selectedGrupo.nome_grupo}</h1>

          {/* LIDERANÇA */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Liderança</h2>

            {["lider_id", "co_lider_1_id", "co_lider_2_id"].map(campo => (
              <div key={campo} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="font-medium capitalize">{campo.replace("_id", "").replaceAll("_", " ")}</div>
                <select
                  className="border rounded p-2"
                  value={(selectedGrupo as any)[campo] || ""}
                  onChange={e => alterarLider(campo.replace("_id", "") as any, e.target.value)}
                >
                  <option value="">-- selecione --</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>{m.nome_completo}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* MEMBROS */}
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Membros</h2>
              <button
                onClick={() => setViewMode("searchPessoa")}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md"
              >
                <FiPlus /> Adicionar
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {membros.map(m => (
                <div
                  key={m.id}
                  className="p-3 bg-gray-50 rounded-md flex justify-between items-center hover:bg-gray-100 cursor-pointer"
                >
                  <span>{m.nome_completo}</span>

                  <button
                    onClick={() => openPessoaFicha(m.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <h2 className="text-xl font-semibold mb-2">Histórico</h2>

            <div className="space-y-2">
              {historico.map((h, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-medium">{h.descricao}</div>
                    <div className="text-xs text-gray-500">{h.data}</div>
                  </div>

                  {h.status === "sucesso" && (
                    <FiCheck className="text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
