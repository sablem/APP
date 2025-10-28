import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Clock, Search } from 'lucide-react';

type Resource = {
  id: string;
  title: string;
  content: string;
  category: string;
  read_time_minutes: number;
  author: string;
  tags: string[];
  view_count: number;
};

export const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    setResources(data || []);
    setLoading(false);
  };

  const categories = ['all', 'anxiety', 'stress', 'depression', 'sleep', 'relationships'];

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || resource.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      anxiety: 'bg-blue-50 text-blue-700',
      stress: 'bg-orange-50 text-orange-700',
      depression: 'bg-indigo-50 text-indigo-700',
      sleep: 'bg-teal-50 text-teal-700',
      relationships: 'bg-green-50 text-green-700',
    };
    return colors[category] || 'bg-gray-50 text-gray-700';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">Loading resources...</p>
      </div>
    );
  }

  if (selectedResource) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedResource(null)}
          className="mb-4 text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Back to resources
        </button>

        <article className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedResource.category)}`}>
              {selectedResource.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {selectedResource.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
            <span>By {selectedResource.author}</span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {selectedResource.read_time_minutes} min read
            </span>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedResource.content}
            </div>
          </div>

          {selectedResource.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {selectedResource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resources Library</h2>
        <p className="text-gray-600">Educational content about mental health and well-being</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
              filterCategory === category
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No resources found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedResource(resource)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
                    {resource.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800 mt-2">
                    {resource.title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {resource.content.substring(0, 150)}...
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>By {resource.author}</span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {resource.read_time_minutes} min read
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
