import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, Plus, Trash2, User } from 'lucide-react';

type GratitudePost = {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
};

type PostLike = {
  post_id: string;
};

export const GratitudeWall = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
    loadMyLikes();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('gratitude_wall_posts')
      .select('*, profiles(full_name)')
      .eq('is_moderated', true)
      .order('created_at', { ascending: false })
      .limit(50);

    setPosts(data || []);
  };

  const loadMyLikes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('gratitude_wall_likes')
      .select('post_id')
      .eq('user_id', user.id);

    setMyLikes((data || []).map((like: PostLike) => like.post_id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('gratitude_wall_posts')
      .insert([
        {
          user_id: user.id,
          content: content.trim(),
          is_anonymous: isAnonymous,
        },
      ]);

    if (!error) {
      const { data: currentStats } = await supabase
        .from('user_activity_stats')
        .select('gratitude_posts')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabase
        .from('user_activity_stats')
        .upsert({
          user_id: user.id,
          gratitude_posts: (currentStats?.gratitude_posts || 0) + 1,
          updated_at: new Date().toISOString(),
        });

      setContent('');
      setIsAnonymous(false);
      setShowForm(false);
      loadPosts();
    }

    setLoading(false);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = myLikes.includes(postId);

    if (isLiked) {
      await supabase
        .from('gratitude_wall_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setMyLikes(myLikes.filter(id => id !== postId));
    } else {
      const { error } = await supabase
        .from('gratitude_wall_likes')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
          },
        ]);

      if (!error) {
        setMyLikes([...myLikes, postId]);
      }
    }

    loadPosts();
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message?')) return;

    await supabase
      .from('gratitude_wall_posts')
      .delete()
      .eq('id', postId);

    loadPosts();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mur de Gratitude</h2>
        <p className="text-gray-600">Partagez votre reconnaissance et soutenez les autres</p>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-6 mb-6 border border-teal-200">
        <div className="flex items-start">
          <Heart className="w-6 h-6 text-teal-600 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Un espace de positivité</h3>
            <p className="text-sm text-gray-700">
              Exprimez votre gratitude, partagez un moment positif, ou encouragez vos camarades.
              Chaque message contribue à créer une communauté bienveillante.
            </p>
          </div>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 flex items-center justify-center px-4 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition font-medium shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Partager un message de gratitude
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nouveau message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Partagez quelque chose pour lequel vous êtes reconnaissant..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">{content.length}/500 caractères</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                Publier de manière anonyme
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {loading ? 'Publication...' : 'Publier'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setContent('');
                  setIsAnonymous(false);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun message pour le moment</p>
          <p className="text-sm text-gray-400 mt-1">Soyez le premier à partager votre gratitude!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    {post.is_anonymous ? (
                      <User className="w-5 h-5 text-teal-600" />
                    ) : (
                      <span className="text-teal-600 font-semibold">
                        {post.profiles?.full_name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {post.is_anonymous ? 'Anonyme' : post.profiles?.full_name || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {post.user_id === user?.id && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center pt-3 border-t border-gray-100">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                    myLikes.includes(post.id)
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${myLikes.includes(post.id) ? 'fill-red-600' : ''}`}
                  />
                  <span className="text-sm font-medium">{post.likes_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
