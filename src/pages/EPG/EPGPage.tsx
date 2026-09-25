import React, { useState } from 'react';
import { Calendar, Clock, Tv, Play } from 'lucide-react';
import { Channel, EPGProgram } from '../../types/iptv';

interface EPGPageProps {
  channels: Channel[];
  epgPrograms: EPGProgram[];
  onPlayChannel: (channel: Channel) => void;
}

export const EPGPage: React.FC<EPGPageProps> = ({ channels, epgPrograms, onPlayChannel }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];
  const channelPrograms = epgPrograms.filter((p) => activeChannel && p.channelId === activeChannel.id);

  const nowMs = Date.now();

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 font-sans no-scrollbar">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-500" />
          <span>Guia de Programação (EPG)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Acompanhe a grade de horários dos seus canais em tempo real.
        </p>
      </div>

      {/* Main EPG Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Channels Selector List */}
        <div className="bg-dark-card border border-dark-border/60 rounded-3xl p-4 space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Selecione o Canal
          </h3>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                activeChannel?.id === channel.id
                  ? 'bg-brand-600/90 text-white font-semibold shadow-md'
                  : 'hover:bg-dark-cardHover text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {channel.logo ? (
                  <img src={channel.logo} alt={channel.name} className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 rounded bg-dark-border flex items-center justify-center text-xs font-bold shrink-0">
                    TV
                  </div>
                )}
                <span className="text-xs truncate">{channel.name}</span>
              </div>
              <Play className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
            </button>
          ))}
        </div>

        {/* Right: EPG Timetable Schedule */}
        {activeChannel && (
          <div className="lg:col-span-2 bg-dark-card border border-dark-border/60 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border/60 pb-4">
              <div className="flex items-center gap-3">
                {activeChannel.logo && (
                  <img src={activeChannel.logo} alt={activeChannel.name} className="w-10 h-10 object-contain rounded-xl bg-dark-bg p-1 border border-dark-border" />
                )}
                <div>
                  <h3 className="text-base font-extrabold text-white">{activeChannel.name}</h3>
                  <span className="text-xs text-slate-400">{activeChannel.categoryName}</span>
                </div>
              </div>

              <button
                onClick={() => onPlayChannel(activeChannel)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Assistir Canal</span>
              </button>
            </div>

            {/* Timetable List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Programação do Dia
              </h4>

              {channelPrograms.length > 0 ? (
                channelPrograms.map((program) => {
                  const startMs = new Date(program.start).getTime();
                  const endMs = new Date(program.end).getTime();
                  const isCurrent = nowMs >= startMs && nowMs <= endMs;

                  return (
                    <div
                      key={program.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-brand-900/20 border-brand-500/60 shadow-lg'
                          : 'bg-dark-bg/60 border-dark-border/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 font-mono text-xs font-bold">
                          <Clock className={`w-3.5 h-3.5 ${isCurrent ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span className={isCurrent ? 'text-brand-300' : 'text-slate-300'}>
                            {new Date(program.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(program.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {isCurrent && (
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white font-bold text-[10px] uppercase tracking-wider animate-pulse">
                            No Ar Agora
                          </span>
                        )}
                      </div>

                      <h5 className="text-sm font-bold text-white mb-1">{program.title}</h5>
                      {program.desc && (
                        <p className="text-xs text-slate-400 leading-relaxed">{program.desc}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 italic">
                  Nenhum programa EPG agendado para este canal no momento.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
