import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trophy, Users, MapPin, Calendar, Plus, UserPlus, UserMinus } from 'lucide-react';

type SportsEvent = {
  id: string;
  creator_id: string;
  name: string;
  sport_type: string;
  location: string;
  scheduled_at: string;
  team_a_size: number;
  team_b_size: number;
  description: string;
  status: string;
  created_at: string;
};

type Participant = {
  id: string;
  event_id: string;
  user_id: string;
  team: string;
  profiles: {
    full_name: string;
  };
};

export const SportsEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sport_type: 'football',
    location: '',
    scheduled_at: '',
    team_a_size: 5,
    team_b_size: 5,
    description: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data: eventsData } = await supabase
      .from('sports_events')
      .select('*')
      .in('status', ['open', 'full'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at');

    if (eventsData) {
      setEvents(eventsData);

      for (const event of eventsData) {
        const { data: participantsData } = await supabase
          .from('sports_event_participants')
          .select('*, profiles(full_name)')
          .eq('event_id', event.id);

        setParticipants(prev => ({
          ...prev,
          [event.id]: participantsData || [],
        }));
      }
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from('sports_events')
      .insert([
        {
          ...formData,
          creator_id: user.id,
        },
      ]);

    if (!error) {
      setShowCreateForm(false);
      setFormData({
        name: '',
        sport_type: 'football',
        location: '',
        scheduled_at: '',
        team_a_size: 5,
        team_b_size: 5,
        description: '',
      });
      loadEvents();
    }
  };

  const joinTeam = async (eventId: string, team: 'team_a' | 'team_b') => {
    if (!user) return;

    const { error } = await supabase
      .from('sports_event_participants')
      .insert([
        {
          event_id: eventId,
          user_id: user.id,
          team,
        },
      ]);

    if (!error) {
      loadEvents();
      updateEventStatus(eventId);
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('sports_event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (!error) {
      loadEvents();
      updateEventStatus(eventId);
    }
  };

  const updateEventStatus = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const eventParticipants = participants[eventId] || [];
    const teamACount = eventParticipants.filter(p => p.team === 'team_a').length;
    const teamBCount = eventParticipants.filter(p => p.team === 'team_b').length;

    const newStatus = (teamACount >= event.team_a_size && teamBCount >= event.team_b_size)
      ? 'full'
      : 'open';

    await supabase
      .from('sports_events')
      .update({ status: newStatus })
      .eq('id', eventId);
  };

  const getTeamCounts = (eventId: string) => {
    const eventParticipants = participants[eventId] || [];
    return {
      teamA: eventParticipants.filter(p => p.team === 'team_a').length,
      teamB: eventParticipants.filter(p => p.team === 'team_b').length,
    };
  };

  const isUserInEvent = (eventId: string): string | null => {
    const eventParticipants = participants[eventId] || [];
    const userParticipation = eventParticipants.find(p => p.user_id === user?.id);
    return userParticipation?.team || null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Événements Sportifs</h2>
          <p className="text-gray-600">Rejoignez ou créez des matchs et activités sportives</p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un événement
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nouvel événement sportif</h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'événement
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de sport
                </label>
                <select
                  value={formData.sport_type}
                  onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                >
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="tennis">Tennis</option>
                  <option value="jogging">Jogging</option>
                  <option value="cyclisme">Cyclisme</option>
                  <option value="natation">Natation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="Ex: Stade universitaire"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille Équipe A
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.team_a_size}
                  onChange={(e) => setFormData({ ...formData, team_a_size: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille Équipe B
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.team_b_size}
                  onChange={(e) => setFormData({ ...formData, team_b_size: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Ajoutez des détails supplémentaires..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition"
              >
                Créer l'événement
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun événement disponible</p>
          <p className="text-sm text-gray-400 mt-1">Créez le premier événement!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const counts = getTeamCounts(event.id);
            const userTeam = isUserInEvent(event.id);

            return (
              <div key={event.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{event.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Trophy className="w-4 h-4 mr-1" />
                        {event.sport_type}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.location}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(event.scheduled_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  {event.status === 'full' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                      Complet
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="text-gray-700 mb-4">{event.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-800">Équipe A</span>
                      <span className="text-sm text-blue-600">
                        {counts.teamA}/{event.team_a_size}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {participants[event.id]?.filter(p => p.team === 'team_a').map((p) => (
                        <div key={p.id} className="text-sm text-blue-700 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {p.profiles.full_name || 'Utilisateur'}
                        </div>
                      ))}
                    </div>
                    {!userTeam && counts.teamA < event.team_a_size && (
                      <button
                        onClick={() => joinTeam(event.id, 'team_a')}
                        className="w-full mt-2 flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Rejoindre
                      </button>
                    )}
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-green-800">Équipe B</span>
                      <span className="text-sm text-green-600">
                        {counts.teamB}/{event.team_b_size}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {participants[event.id]?.filter(p => p.team === 'team_b').map((p) => (
                        <div key={p.id} className="text-sm text-green-700 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {p.profiles.full_name || 'Utilisateur'}
                        </div>
                      ))}
                    </div>
                    {!userTeam && counts.teamB < event.team_b_size && (
                      <button
                        onClick={() => joinTeam(event.id, 'team_b')}
                        className="w-full mt-2 flex items-center justify-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Rejoindre
                      </button>
                    )}
                  </div>
                </div>

                {userTeam && (
                  <button
                    onClick={() => leaveEvent(event.id)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Quitter l'événement
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
