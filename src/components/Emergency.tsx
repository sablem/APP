import { useState, useEffect } from 'react';
import { supabase, EmergencyContact } from '../lib/supabase';
import { Phone, AlertCircle, Globe, MessageSquare } from 'lucide-react';

export const Emergency = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('country');

    setContacts(data || []);
    setLoading(false);
  };

  const countries = ['all', ...Array.from(new Set(contacts.map(c => c.country)))];

  const filteredContacts = contacts.filter(
    contact => filterCountry === 'all' || contact.country === filterCountry
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      suicide_prevention: 'bg-red-50 border-red-200 text-red-800',
      crisis: 'bg-orange-50 border-orange-200 text-orange-800',
      mental_health: 'bg-blue-50 border-blue-200 text-blue-800',
      substance_abuse: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    };
    return colors[category] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">Loading emergency contacts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Emergency Resources</h2>
            <p className="text-gray-600">Immediate help is available 24/7</p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Si vous êtes en danger immédiat
        </h3>
        <p className="text-red-800 mb-4">
          Appelez immédiatement les services d'urgence (19 pour la police, 15 pour l'ambulance au Maroc).
        </p>
        <p className="text-red-800 font-medium">
          Vous n'êtes pas seul. De l'aide est disponible maintenant.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => setFilterCountry(country)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterCountry === country
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {country === 'all' ? 'Tous les pays' : country}
          </button>
        ))}
      </div>

      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No emergency contacts found for this country</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-xl shadow-sm p-6 border-2 ${getCategoryColor(contact.category)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {contact.name}
                  </h3>
                  <span className="inline-block px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-medium">
                    {getCategoryLabel(contact.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {contact.available_24_7 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      24/7
                    </span>
                  )}
                  {contact.supports_text && (
                    <MessageSquare className="w-5 h-5 text-gray-600" title="Supports text messages" />
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{contact.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white bg-opacity-70 rounded-lg">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-teal-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="text-lg font-bold text-gray-800">{contact.phone_number}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone_number}`}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                  >
                    Call Now
                  </a>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{contact.country}</span>
                  </div>
                  {contact.languages.length > 1 && (
                    <span className="text-gray-600">
                      Languages: {contact.languages.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Additional Campus Resources</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-teal-600 mr-2">•</span>
            <span>Check with your university's student health center for counseling services</span>
          </li>
          <li className="flex items-start">
            <span className="text-teal-600 mr-2">•</span>
            <span>Many universities offer free or low-cost therapy sessions for students</span>
          </li>
          <li className="flex items-start">
            <span className="text-teal-600 mr-2">•</span>
            <span>Resident advisors and student affairs offices can help connect you with resources</span>
          </li>
          <li className="flex items-start">
            <span className="text-teal-600 mr-2">•</span>
            <span>Online therapy platforms often have student discounts available</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
