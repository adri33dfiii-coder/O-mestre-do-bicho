import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Historico = () => {
  const [palpites, setPalpites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('todas');

  const modalidadeEmojis = {
    milhar: '🎯',
    centena: '🎲',
    dezena: '🔢',
    grupo: '🐯'
  };

  const modalidadeNomes = {
    milhar: 'Milhar (ABCD)',
    centena: 'Centena (BCD)',
    dezena: 'Dezena (CD)',
    grupo: 'Grupos/Bichos'
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      const response = await axios.get(`${API}/palpites/historico`);
      setPalpites(response.data || []);
    } catch (err) {
      setError('Erro ao carregar histórico de palpites');
    } finally {
      setLoading(false);
    }
  };

  const palpitesFiltrados = filtroModalidade === 'todas' 
    ? palpites 
    : palpites.filter(p => p.modalidade === filtroModalidade);

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (palpite) => {
    if (palpite.resultado_conferido) {
      return palpite.acertou ? (
        <span className="badge-acerto">✅ Acertou</span>
      ) : (
        <span className="badge-erro">❌ Não acertou</span>
      );
    }
    return <span className="badge-pendente">⏳ Pendente</span>;
  };

  const copiarPalpites = (numeros) => {
    const texto = numeros.join(', ');
    navigator.clipboard.writeText(texto).then(() => {
      alert('📋 Palpites copiados!');
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
        >
          ← Voltar ao Dashboard
        </Link>
        
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Histórico de Palpites
        </h1>
        <p className="text-white/80 text-lg">
          Visualize todos os seus palpites gerados e seus resultados
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🔍 Filtrar por Modalidade</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFiltroModalidade('todas')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtroModalidade === 'todas'
                ? 'bg-green-600 text-white'
                : 'bg-white/20 text-white/80 hover:bg-white/30'
            }`}
          >
            🎯 Todas
          </button>
          
          {Object.entries(modalidadeNomes).map(([key, nome]) => (
            <button
              key={key}
              onClick={() => setFiltroModalidade(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filtroModalidade === key
                  ? 'bg-green-600 text-white'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              {modalidadeEmojis[key]} {nome}
            </button>
          ))}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="feedback-error mb-6">
          {error}
        </div>
      )}

      {/* Lista de palpites */}
      {palpitesFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Nenhum palpite encontrado
          </h2>
          <p className="text-white/80 mb-6">
            {filtroModalidade === 'todas' 
              ? 'Você ainda não gerou nenhum palpite.'
              : `Você ainda não gerou palpites para ${modalidadeNomes[filtroModalidade]}.`
            }
          </p>
          <Link
            to="/"
            className="palpite-button inline-block"
          >
            🎯 Gerar Primeiro Palpite
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              📊 {palpitesFiltrados.length} Palpite{palpitesFiltrados.length !== 1 ? 's' : ''} Encontrado{palpitesFiltrados.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {palpitesFiltrados.map((palpite) => (
            <div key={palpite.id} className="historico-card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Info do palpite */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{modalidadeEmojis[palpite.modalidade]}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {modalidadeNomes[palpite.modalidade]}
                      </h3>
                      <p className="text-white/60 text-sm">
                        Gerado em {formatarData(palpite.data_geracao)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-white/80 text-sm mb-3">
                    <p><strong>Sorteio:</strong> {palpite.horario_sorteio} - {formatarData(palpite.data_sorteio)}</p>
                    <p><strong>Quantidade:</strong> {palpite.numeros.length} números</p>
                  </div>

                  {/* Status */}
                  <div className="mb-3">
                    {getStatusBadge(palpite)}
                  </div>

                  {/* Números */}
                  <div className="bg-black/20 border border-white/20 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {palpite.numeros.slice(0, 10).map((numero, index) => (
                        <span
                          key={index}
                          className="bg-white/20 px-2 py-1 rounded text-white font-mono text-sm"
                        >
                          {numero}
                        </span>
                      ))}
                      {palpite.numeros.length > 10 && (
                        <span className="text-white/60 text-sm">
                          ... e mais {palpite.numeros.length - 10} números
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => copiarPalpites(palpite.numeros)}
                      className="text-green-400 hover:text-green-300 text-sm transition-colors"
                    >
                      📋 Copiar todos os números
                    </button>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/palpites/${palpite.modalidade}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition-colors text-sm"
                  >
                    🔄 Gerar Novos
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumo estatístico */}
      {palpites.length > 0 && (
        <div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            📊 Resumo Estatístico
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(modalidadeNomes).map(([key, nome]) => {
              const count = palpites.filter(p => p.modalidade === key).length;
              return (
                <div key={key} className="text-center">
                  <div className="text-3xl mb-2">{modalidadeEmojis[key]}</div>
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <div className="text-white/80 text-sm">{nome}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="feedback-warning mt-8">
        <div className="text-center">
          <p className="font-semibold mb-2">📝 Sobre o Histórico</p>
          <p className="text-sm">
            Este histórico mostra todos os palpites que você gerou. Os resultados são atualizados 
            automaticamente após cada sorteio para que você possa acompanhar a eficácia dos palpites.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Historico;