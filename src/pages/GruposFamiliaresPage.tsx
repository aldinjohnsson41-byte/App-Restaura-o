import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Plus } from "lucide-react";

// =============================
// GRUPO FAMILIAR — REESCRITO COMPLETO
// Opção A: Adicionar membros via MODAL com busca
// =============================

export default function GrupoFamiliarForm({ grupoId, onSaved }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const [lider1, setLider1] = useState(null);
  const [lider2, setLider2] = useState(null);
  const [coLider1, setCoLider1] = useState(null);
  const [coLider2, setCoLider2] = useState(null);

  const [pessoas, setPessoas] = useState([]);
  const [membros, setMembros] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState("");

  // Ocorrências
  const [ocorrencias, setOcorrencias] = useState([]);
  const [tiposOcorrencia, setTiposOcorrencia] = useState([]);

  useEffect(() => {
    carregarPessoas();
    carregarTiposOcorrencia();
    if (grupoId) carregarGrupo();
  }, [grupoId]);

  async function carregarPessoas() {
    const { data } = await supabase.from("pessoas").select("id, nome").order("nome");
    setPessoas(data || []);
  }

  async function carregarTiposOcorrencia() {
    const { data } = await supabase.from("tipos_ocorrencia").select("id, nome");
    setTiposOcorrencia(data || []);
  }

  async function carregarGrupo() {
    const { data: grupo } = await supabase
      .from("grupos_familiares")
      .select("*, membros:grupo_membros(pessoa_id), ocorrencias(*)")
      .eq("id", grupoId)
      .single();

    if (!grupo) return;

    setNome(grupo.nome);
    setDescricao(grupo.descricao);

    // Carregar membros
    setMembros(grupo.membros?.map(m => m.pessoa_id) || []);

    // Carregar lideranças
    setLider1(grupo.lider1_id);
    setLider2(grupo.lider2_id);
    setCoLider1(grupo.co_lider1_id);
    setCoLider2(grupo.co_lider2_id);

    setOcorrencias(grupo.ocorrencias || []);
  }

  async function salvarGrupo() {
    if (!nome.trim()) return alert("O nome é obrigatório");

    let save;

    if (!grupoId) {
      save = await supabase
        .from("grupos_familiares")
        .insert({ nome, descricao, lider1_id: lider1, lider2_id: lider2, co_lider1_id: coLider1, co_lider2_id: coLider2 })
        .select()
        .single();
    } else {
      save = await supabase
        .from("grupos_familiares")
        .update({ nome, descricao, lider1_id: lider1, lider2_id: lider2, co_lider1_id: coLider1, co_lider2_id: coLider2 })
        .eq("id", grupoId)
        .select()
        .single();
    }

    if (save.error) return alert("Erro ao salvar grupo");

    const id = grupoId || save.data.id;

    await supabase.from("grupo_membros").delete().eq("grupo_id", id);

    for (const memb of membros) {
      await supabase.from("grupo_membros").insert({ grupo_id: id, pessoa_id: memb });
    }

    alert("Grupo salvo!");
    if (onSaved) onSaved();
  }

  function removerMembro(id) {
    setMembros(prev => prev.filter(m => m !== id));
  }

  function adicionarMembro(id) {
    if (!membros.includes(id)) {
      setMembros(prev => [...prev, id]);
    }
  }

  const pessoasFiltradas = pessoas.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Grupo Familiar</h1>

      <div className="space-y-3">
        <label>Nome do grupo</label>
        <input className="w-full border p-2 rounded" value={nome} onChange={e => setNome(e.target.value)} />

        <label>Descrição</label>
        <textarea className="w-full border p-2 rounded" value={descricao} onChange={e => setDescricao(e.target.value)} />

        {/* Lideranças */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Líder 1</label>
            <select className="w-full border p-2 rounded" value={lider1 || ""} onChange={e => setLider1(e.target.value || null)}>
              <option value="">Selecione</option>
              {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          <div>
            <label>Líder 2</label>
            <select className="w-full border p-2 rounded" value={lider2 || ""} onChange={e => setLider2(e.target.value || null)}>
              <option value="">Selecione</option>
              {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          <div>
            <label>Co-Líder 1</label>
            <select className="w-full border p-2 rounded" value={coLider1 || ""} onChange={e => setCoLider1(e.target.value || null)}>
              <option value="">Selecione</option>
              {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          <div>
            <label>Co-Líder 2</label>
            <select className="w-full border p-2 rounded" value={coLider2 || ""} onChange={e => setCoLider2(e.target.value || null)}>
              <option value="">Selecione</option>
              {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* MEMBROS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Membros</h2>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Adicionar membro
          </button>
        </div>

        <div className="space-y-2">
          {membros.map(id => {
            const pessoa = pessoas.find(p => p.id === id);
            if (!pessoa) return null;
            return (
              <div key={id} className="flex justify-between items-center border p-2 rounded">
                <span>{pessoa.nome}</span>
                <button onClick={() => removerMembro(id)} className="text-red-600"><X /></button>
              </div>
            );
          })}

          {membros.length === 0 && <p className="text-gray-500 text-sm">Nenhum membro adicionado.</p>}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-4 rounded space-y-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Adicionar Membro</h3>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>

            <input
              placeholder="Buscar pessoa"
              className="w-full border p-2 rounded"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />

            <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-2">
              {pessoasFiltradas.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b py-2">
                  <span>{p.nome}</span>
                  <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => adicionarMembro(p.id)}>Adicionar</button>
                </div>
              ))}

              {pessoasFiltradas.length === 0 && <p>Nenhuma pessoa encontrada.</p>}
            </div>
          </div>
        </div>
