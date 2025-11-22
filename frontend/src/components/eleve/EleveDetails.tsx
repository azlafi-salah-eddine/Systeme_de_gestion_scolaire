import React from 'react';
import type { Eleve } from '../../types/eleve';

interface EleveDetailsProps {
  eleve: Eleve;
  onEdit?: () => void;
  onDelete?: () => void;
}

const EleveDetails: React.FC<EleveDetailsProps> = ({ eleve, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Parse health info accepting two formats:
  // 1) "Label: Value" on one line
  // 2) Label and value on separate lines (alternating)
  const parseInfosSante = (text?: string): Array<{ label: string; value: string }> => {
    if (!text) return [];
    const entries: Array<{ label: string; value: string }> = [];

    // First pass: colon-separated
    const colonRegex = /([^:\n]+):\s*([^\n]+)(?=\n|$)/g;
    let match;
    while ((match = colonRegex.exec(text)) !== null) {
      const label = match[1].trim();
      const value = match[2].trim();
      if (label && value) entries.push({ label, value });
    }

    if (entries.length > 0) return entries;

    // Second pass: alternating lines (Label on one line, Value on next)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < lines.length; i += 2) {
      const label = lines[i];
      const value = lines[i + 1] ?? '';
      if (label) entries.push({ label, value });
    }

    if (entries.length === 0) {
      return [{ label: 'Détails', value: text }];
    }
    return entries;
  };

  return (
    <div className="space-y-8">
      {/* Identité */}
      <div className="mb-8 last:mb-0">
        <div className="py-2 px-5 bg-gray-100 dark:bg-gray-900 rounded">
          <h6 className="text-slate-400 whitespace-nowrap uppercase font-bold text-xxs tracking-relaxed leading-tight">
            Identité
          </h6>
        </div>
        
        <div className="space-y-0">
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Nom prénom (FR)
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {`${eleve.prenom_fr || eleve.prenom || ''} ${eleve.nom_fr || eleve.nom || ''}`.trim() || '—'}
              </span>
            </div>
          </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Nom prénom (AR)
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {`${eleve.prenom_ar || ''} ${eleve.nom_ar || ''}`.trim() || '—'}
              </span>
        </div>
      </div>

          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Sexe
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                        {eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '—'}
                      </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Âge
                          </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.date_naissance ? `${calculateAge(eleve.date_naissance)} ans` : '—'}
                      </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Date de naissance
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.date_naissance ? formatDate(eleve.date_naissance) : '—'}
                        </span>
                      </div>
                    </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Lieu de naissance (FR)
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.lieu_naissance_fr || '—'}
              </span>
                  </div>
                </div>

          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Lieu de naissance (AR)
                        </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.lieu_naissance_ar || '—'}
                        </span>
                    </div>
                  </div>
                        </div>
                      </div>

      {/* Identifiants */}
      <div className="mb-8 last:mb-0">
        <div className="py-2 px-5 bg-gray-100 dark:bg-gray-900 rounded">
          <h6 className="text-slate-400 whitespace-nowrap uppercase font-bold text-xxs tracking-relaxed leading-tight">
            Identifiants
          </h6>
        </div>
        
        <div className="space-y-0">
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Matricule
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.matricule || '—'}
                      </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                CNE
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.cne || '—'}
                        </span>
                      </div>
                    </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                CIN
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.cin || '—'}
                        </span>
                      </div>
                    </div>
                      </div>
                    </div>

      {/* Informations complémentaires */}
      <div className="mb-8 last:mb-0">
        <div className="py-2 px-5 bg-gray-100 dark:bg-gray-900 rounded">
          <h6 className="text-slate-400 whitespace-nowrap uppercase font-bold text-xxs tracking-relaxed leading-tight">
            Informations complémentaires
          </h6>
                      </div>
        
        <div className="space-y-0">
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Adresse
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.adresse || '—'}
              </span>
                  </div>
                </div>

          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Nationalité
                            </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.nationalite || '—'}
                        </span>
                      </div>
                    </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Date d'inscription
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.date_inscription ? formatDate(eleve.date_inscription) : '—'}
                      </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Ancienne école
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.ancienne_ecole || '—'}
              </span>
              </div>
            </div>  
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Type d'école
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.type_ecole || '—'}
              </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Statut de l'école
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.statut_ecole || '—'}
              </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Langues
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.langues && eleve.langues.length > 0 ? eleve.langues.join(', ') : '—'}
              </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Personne à contacter en urgence
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.personne_urgence || '—'}
              </span>
                    </div>
                  </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Téléphone d'urgence
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.telephone_urgence || '—'}
                            </span>
                          </div>
                    </div>
                  </div>
              </div>

      {/* Scolarité */}
      <div className="mb-8 last:mb-0">
        <div className="py-2 px-5 bg-gray-100 dark:bg-gray-900 rounded">
          <h6 className="text-slate-400 whitespace-nowrap uppercase font-bold text-xxs tracking-relaxed leading-tight">
            Scolarité
          </h6>
        </div>

        <div className="space-y-0">
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Niveau
                        </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {(() => {
                  const niveau = eleve.classe?.niveau;
                  if (!niveau) return 'Niveau non défini';
                  return typeof niveau === 'string' ? (niveau || 'Niveau non défini') : (niveau.nom || 'Niveau non défini');
                })()}
                        </span>
            </div>
            </div>
          
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Classe actuelle
                    </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.classe?.nom || 'Classe non définie'}
                    </span>
                  </div>
              </div>
              
          <div className="group px-5 py-2 flex items-center border-b last:border-b-0 border-gray-200 dark:border-gray-800">
            <div className="md:flex md:items-center flex-grow">
              <span className="text-sm/6 text-slate-400 group-hover:text-slate-600 group-hover:dark:text-slate-300 transition-all duration-300 block md:w-1/2">
                Date d'inscription
              </span>
              <span className="text-sm/6 text-slate-600 group-hover:text-slate-700 dark:text-white group-hover:dark:text-slate-200 transition-all duration-300 block md:w-1/2">
                {eleve.date_inscription ? formatDate(eleve.date_inscription) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EleveDetails;