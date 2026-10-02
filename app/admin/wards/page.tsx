"use client";

import React, { useEffect, useState } from "react";
import {
  FaChurch,
  FaPlus,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";

interface WardItem {
  _id: string;
  name: string;
  slug: string;
  stakeId: string;
}

interface StakeItem {
  _id: string;
  name: string;
  slug: string;
  wards: WardItem[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminWardsPage() {
  const [stakes, setStakes] = useState<StakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Formulário de Nova Estaca
  const [stakeName, setStakeName] = useState("");
  const [stakeSlug, setStakeSlug] = useState("");
  const [savingStake, setSavingStake] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [stakeSuccess, setStakeSuccess] = useState<string | null>(null);

  // Formulário de Nova Ala
  const [selectedStakeId, setSelectedStakeId] = useState("");
  const [wardName, setWardName] = useState("");
  const [wardSlug, setWardSlug] = useState("");
  const [savingWard, setSavingWard] = useState(false);
  const [wardError, setWardError] = useState<string | null>(null);
  const [wardSuccess, setWardSuccess] = useState<string | null>(null);

  // Autenticação Admin
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchStakes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stakes");
      if (!res.ok) throw new Error("Falha ao carregar estacas");
      const data = await res.json();
      setStakes(data);
      if (data.length > 0 && !selectedStakeId) {
        setSelectedStakeId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        fetchStakes();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    try {
      setLoginLoading(true);
      setLoginError(null);
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Senha incorreta. Tente novamente.");
      }

      setIsAuthenticated(true);
      setPasswordInput("");
      fetchStakes();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Senha incorreta. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStakeNameChange = (val: string) => {
    setStakeName(val);
    setStakeSlug(slugify(val));
  };

  const handleWardNameChange = (val: string) => {
    setWardName(val);
    setWardSlug(slugify(val));
  };

  const handleCreateStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeName.trim()) return;

    try {
      setSavingStake(true);
      setStakeError(null);
      setStakeSuccess(null);

      const res = await fetch("/api/stakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: stakeName.trim(), slug: stakeSlug.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar estaca");

      setStakeSuccess(`Estaca "${data.name}" criada com sucesso!`);
      setStakeName("");
      setStakeSlug("");
      await fetchStakes();
      setSelectedStakeId(data._id);
    } catch (err) {
      setStakeError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingStake(false);
    }
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardName.trim() || !selectedStakeId) return;

    try {
      setSavingWard(true);
      setWardError(null);
      setWardSuccess(null);

      const res = await fetch("/api/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeId: selectedStakeId,
          name: wardName.trim(),
          slug: wardSlug.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar ala");

      setWardSuccess(`Ala "${data.name}" criada com sucesso!`);
      setWardName("");
      setWardSlug("");
      await fetchStakes();
    } catch (err) {
      setWardError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingWard(false);
    }
  };

  const copyToClipboard = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(key);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] gap-3">
        <div className="w-9 h-9 border-3 border-slate-200 border-t-[#0f2042] rounded-full animate-spin" />
        <div className="text-[#0f2042] font-bold text-sm tracking-tight">
          Verificando permissões...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col justify-between p-4 sm:p-8">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-start py-2">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <IoIosArrowBack className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </a>
        </div>

        <div className="w-full max-w-md mx-auto my-auto bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xl shadow-slate-200/50 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-[#1e3a8a] flex items-center justify-center text-2xl shadow-xs">
              <FaLock />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Acesso Administrativo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Área reservada para a liderança cadastrar e gerenciar estacas e alas. Digite a senha para continuar.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Senha de Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha"
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 pr-16 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-1 py-0.5"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading || !passwordInput}
              className="mt-2 w-full py-3.5 px-5 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loginLoading ? "Verificando..." : "Entrar no Painel"}</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <a
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              &larr; Voltar para a página inicial
            </a>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-400 py-3 flex flex-col items-center gap-1">
          <span>Painel Administrativo &bull; Calendário de Almoços</span>
          <span className="text-[10px] text-slate-400 max-w-sm">
            Ferramenta comunitária independente. Não oficial de A Igreja de Jesus Cristo dos Santos dos Últimos Dias.
          </span>
        </footer>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 p-3 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8">
        {/* Header Superior */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all border border-slate-200"
              title="Voltar ao Início"
            >
              <IoIosArrowBack className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FaChurch className="text-[#1e3a8a]" />
                Gerenciar Estacas e Alas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Organize grupos de alas por estacas e compartilhe links diretos com os membros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              className="px-4 py-2.5 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all shadow-sm text-center"
            >
              Acessar Calendário
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all shadow-xs"
              title="Sair do painel administrativo"
            >
              <FaSignOutAlt className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Grid de Formulários de Criação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Formulário 1: Nova Estaca */}
          <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1e3a8a] font-bold flex items-center justify-center text-sm border border-blue-100">
                  1
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Cadastrar Nova Estaca
                  </h2>
                  <p className="text-xs text-slate-500">
                    Grupo regional de congregações (ex: Rio de Janeiro Ilha).
                  </p>
                </div>
              </div>

              {stakeError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {stakeError}
                </div>
              )}
              {stakeSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  {stakeSuccess}
                </div>
              )}

              <form onSubmit={handleCreateStake} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Estaca
                  </label>
                  <input
                    type="text"
                    value={stakeName}
                    onChange={(e) => handleStakeNameChange(e.target.value)}
                    placeholder="Ex: Estaca Rio de Janeiro Ilha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slug da URL (gerado automaticamente)
                  </label>
                  <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                    <span>seusite.com/</span>
                    <input
                      type="text"
                      value={stakeSlug}
                      onChange={(e) => setStakeSlug(slugify(e.target.value))}
                      placeholder="ilha"
                      className="bg-transparent font-bold text-slate-800 focus:outline-none ml-0.5 flex-1"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingStake || !stakeName.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaPlus className="w-3 h-3" />
                  {savingStake ? "Cadastrando..." : "Criar Estaca"}
                </button>
              </form>
            </div>
          </section>

          {/* Formulário 2: Nova Ala */}
          <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-100">
                  2
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Cadastrar Nova Ala
                  </h2>
                  <p className="text-xs text-slate-500">
                    Unidade de congregação vinculada a uma estaca.
                  </p>
                </div>
              </div>

              {wardError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {wardError}
                </div>
              )}
              {wardSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  {wardSuccess}
                </div>
              )}

              <form onSubmit={handleCreateWard} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vincular à Estaca
                  </label>
                  <select
                    value={selectedStakeId}
                    onChange={(e) => setSelectedStakeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    required
                  >
                    {stakes.length === 0 && (
                      <option value="">Nenhuma estaca cadastrada</option>
                    )}
                    {stakes.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} (/{s.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Ala
                  </label>
                  <input
                    type="text"
                    value={wardName}
                    onChange={(e) => handleWardNameChange(e.target.value)}
                    placeholder="Ex: Ala Galeão"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slug da URL da Ala
                  </label>
                  <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                    <span>
                      seusite.com/
                      {stakes.find((s) => s._id === selectedStakeId)?.slug ||
                        "estaca"}
                      /
                    </span>
                    <input
                      type="text"
                      value={wardSlug}
                      onChange={(e) => setWardSlug(slugify(e.target.value))}
                      placeholder="galeao"
                      className="bg-transparent font-bold text-slate-800 focus:outline-none ml-0.5 flex-1"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingWard || !wardName.trim() || !selectedStakeId}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0f2042] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaPlus className="w-3 h-3" />
                  {savingWard ? "Salvando..." : "Salvar Ala"}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Lista de Estacas e Alas Ativas */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Estacas e Alas Cadastradas
              </h2>
              <p className="text-xs text-slate-500">
                Copie o link direto de cada ala para enviar no WhatsApp ou acesse seu calendário.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-[#0f2042] rounded-full self-start border border-slate-200">
              {stakes.reduce((acc, s) => acc + (s.wards?.length || 0), 0)} alas ativas
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Carregando dados...
            </div>
          ) : stakes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Nenhuma estaca cadastrada ainda. Use o formulário acima para começar.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {stakes.map((stake) => (
                <div
                  key={stake._id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 flex flex-col gap-4"
                >
                  {/* Cabeçalho da Estaca */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-blue-600" />
                      <h3 className="text-base font-black text-slate-900">
                        {stake.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        /{stake.slug}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {stake.wards?.length || 0} alas
                    </span>
                  </div>

                  {/* Grid de Alas desta Estaca */}
                  {stake.wards?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      Nenhuma ala vinculada a esta estaca ainda.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stake.wards.map((ward) => {
                        const path = `/${stake.slug}/${ward.slug}`;
                        const fullUrl = typeof window !== "undefined"
                          ? `${window.location.origin}${path}`
                          : path;
                        const key = `${stake.slug}-${ward.slug}`;
                        const isCopied = copiedSlug === key;

                        return (
                          <div
                            key={ward._id}
                            className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:border-blue-300 transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-800">
                                  {ward.name}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  /{ward.slug}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-1">
                                {path}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              <a
                                href={path}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0f2042] hover:bg-[#1e3a8a] text-white text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5"
                              >
                                <span>Ver Calendário</span>
                                <FaExternalLinkAlt className="w-2.5 h-2.5" />
                              </a>
                              <button
                                onClick={() => copyToClipboard(fullUrl, key)}
                                title="Copiar link para WhatsApp"
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-all border border-slate-200"
                              >
                                {isCopied ? (
                                  <FaCheck className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <FaCopy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer com Aviso Legal */}
        <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200/80 flex flex-col items-center gap-1">
          <p className="font-semibold text-slate-500">
            Painel Administrativo &bull; Calendário de Almoços
          </p>
          <p className="text-[11px] text-slate-400 max-w-md">
            Ferramenta voluntária independente para uso local. Não é uma publicação ou página oficial de A Igreja de Jesus Cristo dos Santos dos Últimos Dias.
          </p>
        </footer>
      </div>
    </div>
  );
}
