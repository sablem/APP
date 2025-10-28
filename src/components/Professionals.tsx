import { useState, useEffect } from 'react';
import { supabase, Professional } from '../lib/supabase';
import { Users, Mail, Phone, Globe, Search } from 'lucide-react';

export const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    const { data } = await supabase
      .from('professionals')
      .select('*')
      .eq('accepts_students', true)
      .order('name');

    setProfessionals(data || []);
    setLoading(false);
  };

  const filteredProfessionals = professionals.filter((prof) => {
    const matchesSearch =
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">Loading professionals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mental Health Professionals</h2>
        <p className="text-gray-600">Connect with qualified professionals who can help</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These professionals are available to support students.
          Reach out directly to schedule a consultation or learn about their services.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, title, or specialization..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredProfessionals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No professionals found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProfessionals.map((professional) => (
            <div
              key={professional.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {professional.name}
                  </h3>
                  <p className="text-teal-600 font-medium">{professional.title}</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
              </div>

              {professional.specializations.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {professional.university && (
                  <div className="flex items-center text-gray-600 text-sm">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{professional.university}</span>
                  </div>
                )}

                {professional.contact_email && (
                  <div className="flex items-center text-gray-600 text-sm">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a
                      href={`mailto:${professional.contact_email}`}
                      className="text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      {professional.contact_email}
                    </a>
                  </div>
                )}

                {professional.contact_phone && (
                  <div className="flex items-center text-gray-600 text-sm">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <a
                      href={`tel:${professional.contact_phone}`}
                      className="text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      {professional.contact_phone}
                    </a>
                  </div>
                )}
              </div>

              {professional.languages.length > 1 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Languages: {professional.languages.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
