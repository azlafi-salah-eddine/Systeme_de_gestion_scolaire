import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AnneeScolaireProvider } from './contexts/AnneeScolaireContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import NotificationContainer from './components/NotificationContainer'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Unauthorized from './pages/Unauthorized'
import Account from './pages/Account'
import AdminsIndex from './pages/settings/AdminsIndex'
import AdminShow from './pages/settings/AdminShow'
import AdminEdit from './pages/settings/AdminEdit'
import AdminNew from './pages/settings/AdminNew'
import DeletedRecordsIndex from './pages/admin/DeletedRecordsIndex'
import Error404 from './pages/errors/Error404'
import ClasseTimetable from './pages/emploidutemps/ClasseTimetable'
import { useAuth } from './contexts/AuthContext';


// Eleve pages
import ElevesIndex from './pages/eleves/ElevesIndex'
import EleveEdit from './pages/eleves/EleveEdit'
import EleveShow from './pages/eleves/EleveShow'
import EleveNew from './pages/eleves/EleveNew'
import EleveNotes from './pages/eleves/EleveNotes'
// Notes pages
import { NotesIndex, NotesNew, NotesClasseManage } from './pages/notes'
// Controles pages
import { ControlesIndex, ControlesNew, ControleShow, ControleEdit } from './pages/controles'
// Cantine pages
import CantinesIndex from './pages/cantines/CantinesIndex'
import CantineNew from './pages/cantines/CantineNew'
// Menu pages
import MenusIndex from './pages/menus/MenusIndex'
import MenuNew from './pages/menus/MenuNew'
import CantineShow from './pages/cantines/CantineShow'
import CantineEdit from './pages/cantines/CantineEdit'
import MenuShow from './pages/menus/MenuShow'
import MenuEdit from './pages/menus/MenuEdit'
// Transport pages
import { TransportsIndex, TransportNew, TransportEdit, TransportShow } from './pages/transports'
import { ChauffeursIndex, ChauffeurNew, ChauffeurEdit, ChauffeurShow } from './pages/chauffeurs'
import { AccompagnateursIndex, AccompagnateurNew, AccompagnateurEdit, AccompagnateurShow } from './pages/accompagnateurs'
import MatieresIndex from './pages/matieres/MatieresIndex'
import MatiereNew from './pages/matieres/MatiereNew'
import MatiereEdit from './pages/matieres/MatiereEdit'
import MatiereShow from './pages/matieres/MatiereShow'
// Paiements pages
import FraisScolairesIndex from './pages/paiements/FraisScolairesIndex'
import FraisScolaireForm from './pages/paiements/FraisScolaireForm'
import FraisScolaireShow from './pages/paiements/FraisScolaireShow'
import PaiementsElevesIndex from './pages/paiements/PaiementsElevesIndex'
import PaiementEleveShow from './pages/paiements/PaiementEleveShow'
import PaiementElevePaiement from './pages/paiements/PaiementElevePaiement'
// Parents pages
import { ParentsIndex, ParentShow, ParentEdit } from './pages/parents'
// AnneeScolaire pages
import { AnneesScolairesIndex, AnneeScolaireShow, AnneeScolaireEdit, AnneeScolaireNew } from './pages/annees-scolaires'
// Classes pages
import { ClasseShow, ClasseNew, ClasseEdit } from './pages/classes'
import ClassesIndex from './pages/classes/ClassesIndex'
import EmploisDuTempsNew from './pages/emploidutemps/EmploisDuTempsNew';
import EmploisDuTempsIndex from './pages/emploidutemps/EmploisDuTempsIndex';
import ProfesseursIndex from './pages/professeurs/ProfesseursIndex';
import ProfesseurShow from './pages/professeurs/ProfesseurShow';
import ProfesseurNew from './pages/professeurs/ProfesseurNew';
import ProfesseurEdit from './pages/professeurs/ProfesseurEdit';
import ProfesseurTimetable from './pages/professeurs/ProfesseurTimetable';
import ProfesseursClasses from './pages/professeurs/ProfesseursClasses';
import ProfesseursMatieres from './pages/professeurs/ProfesseursMatieres';
// Absences
import AbsencesPage from './pages/absences';
// Salles
import SallesIndex from './pages/salles/SallesIndex'
import SalleForm from './pages/salles/SalleForm'
import SalleShow from './pages/salles/SalleShow'
import NiveauxIndex from './pages/niveaux/NiveauxIndex'
import NiveauForm from './pages/niveaux/NiveauForm'
import NiveauShow from './pages/niveaux/NiveauShow'
// Activités pages
import ActivitesIndex from './pages/activites/ActivitesIndex'
import ActiviteForm from './pages/activites/ActiviteForm'
import ActiviteShow from './pages/activites/ActiviteShow'

const RoleDefaultRedirect: React.FC = () => {
  const { user, isProfesseur, isEleve } = useAuth();
  if (isProfesseur() && user?.professeur_id) {
    return <Navigate to={`/professeurs/${user.professeur_id}/timetable`} replace />;
  }
  if (isEleve() && user?.classe_id) {
    // Rediriger directement vers l'emploi du temps de la classe de l'élève
    return <Navigate to={`/classes/${user.classe_id}/emplois-du-temps/preview`} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const EleveTimetableRedirect: React.FC = () => {
  const { user, isEleve } = useAuth();
  if (!isEleve() || !user?.classe_id) {
    return <Error404 />;
  }
  // Redirection directe vers l'emploi du temps de la classe de l'élève
  return <Navigate to={`/classes/${user.classe_id}/emplois-du-temps/preview`} replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AnneeScolaireProvider>
          <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/" element={<RoleDefaultRedirect />} />
          
          <Route path="/dashboard" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><MainLayout><Account /></MainLayout></ProtectedRoute>} />
          
          {/* Cantine routes */}
          <Route path="/cantines" element={
            <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
              <MainLayout>
                <CantinesIndex />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/cantines/:id" element={
            <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
              <MainLayout>
                <CantineShow />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/cantines/:id/edit" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <CantineEdit />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Parents routes */}
          <Route path="/parents" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ParentsIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/parents/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ParentShow /></MainLayout></ProtectedRoute>} />
          <Route path="/parents/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ParentEdit /></MainLayout></ProtectedRoute>} />

          {/* Matières */}
          <Route path="/matieres" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><MatieresIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/matieres/new" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><MatiereNew /></MainLayout></ProtectedRoute>} />
          <Route path="/matieres/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><MatiereShow /></MainLayout></ProtectedRoute>} />
          <Route path="/matieres/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><MatiereEdit /></MainLayout></ProtectedRoute>} />

          {/* Menu routes */}
          <Route path="/menus" element={
            <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
              <MainLayout>
                <MenusIndex />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/menus/:id" element={
            <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
              <MainLayout>
                <MenuShow />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/menus/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <MenuNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/menus/:id/edit" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <MenuEdit />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/cantines/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <CantineNew />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Salles routes */}
          <Route path="/salles" element={
            <ProtectedRoute>
              <MainLayout>
                <SallesIndex />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/salles/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <SalleForm mode="create" />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/salles/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <SalleShow />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/salles/:id/edit" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <SalleForm mode="edit" />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Classes routes */}
          <Route path="/classes" element={<ProtectedRoute><MainLayout><ClassesIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/classes/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <ClasseNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/classes/:id" element={<ProtectedRoute><MainLayout><ClasseShow /></MainLayout></ProtectedRoute>} />
          <Route path="/classes/:id/edit" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <ClasseEdit />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/classes/:id/emplois-du-temps" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <ClasseTimetable />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/classes/:id/emplois-du-temps/preview" element={
            <ProtectedRoute>
              <MainLayout>
                <ClasseTimetable />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/classes/:id/emplois-du-temps/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <EmploisDuTempsNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/emplois-du-temps" element={<ProtectedRoute adminOnly><MainLayout><EmploisDuTempsIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/niveaux" element={<ProtectedRoute><MainLayout><NiveauxIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/niveaux/:id" element={<ProtectedRoute><MainLayout><NiveauShow /></MainLayout></ProtectedRoute>} />
          <Route path="/niveaux/new" element={<ProtectedRoute adminOnly><MainLayout><NiveauForm mode="create" /></MainLayout></ProtectedRoute>} />
          <Route path="/niveaux/:id/edit" element={<ProtectedRoute adminOnly><MainLayout><NiveauForm mode="edit" /></MainLayout></ProtectedRoute>} />
          {/* Paramètres - Administrateurs (super admin only) */}
          <Route path="/settings/admins" element={<ProtectedRoute requiredRoles={["super_admin"]}><MainLayout><AdminsIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/admins/new" element={<ProtectedRoute requiredRoles={["super_admin"]}><MainLayout><AdminNew /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/admins/:id" element={<ProtectedRoute requiredRoles={["super_admin"]}><MainLayout><AdminShow /></MainLayout></ProtectedRoute>} />
          <Route path="/settings/admins/:id/edit" element={<ProtectedRoute requiredRoles={["super_admin"]}><MainLayout><AdminEdit /></MainLayout></ProtectedRoute>} />
          <Route path="/admin/deleted-records" element={<ProtectedRoute requiredRoles={["super_admin"]}><MainLayout><DeletedRecordsIndex /></MainLayout></ProtectedRoute>} />
          
          {/* Paiements routes */}
          <Route path="/frais-scolaires" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <FraisScolairesIndex />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/frais-scolaires/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <FraisScolaireForm />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/frais-scolaires/:id" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <FraisScolaireShow />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/frais-scolaires/:id/edit" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <FraisScolaireForm />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/paiements-eleves" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><PaiementsElevesIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/paiements-eleves/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><PaiementEleveShow /></MainLayout></ProtectedRoute>} />
          <Route path="/paiements-eleves/:id/paiement" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><PaiementElevePaiement /></MainLayout></ProtectedRoute>} />
          
          <Route path="/professeurs" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ProfesseursIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/professeurs/classes" element={<ProtectedRoute><MainLayout><ProfesseursClasses /></MainLayout></ProtectedRoute>} />
          <Route path="/professeurs/matieres" element={<ProtectedRoute><MainLayout><ProfesseursMatieres /></MainLayout></ProtectedRoute>} />
          <Route path="/professeurs/new" element={<ProtectedRoute adminOnly><MainLayout><ProfesseurNew /></MainLayout></ProtectedRoute>} />
          <Route path="/professeurs/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ProfesseurShow /></MainLayout></ProtectedRoute>} />
          <Route path="/professeurs/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ProfesseurEdit /></MainLayout></ProtectedRoute>} />
          <Route path="/professeurs/:id/timetable" element={<ProtectedRoute><MainLayout><ProfesseurTimetable /></MainLayout></ProtectedRoute>} />

          {/* Absences routes */}
          <Route path="/absences/*" element={<ProtectedRoute><MainLayout><AbsencesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/eleves/absences/*" element={<ProtectedRoute><MainLayout><AbsencesPage /></MainLayout></ProtectedRoute>} />

          {/* Eleve routes */}
          {/* Redirect old /eleves/enroll route to /eleves/new */}
          <Route path="/eleves/enroll" element={
            <ProtectedRoute>
              <MainLayout>
                <Navigate to="/eleves/new" replace />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/eleves" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ElevesIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/eleves/new" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><EleveNew /></MainLayout></ProtectedRoute>} />
          {/* Redirect old /eleves/note route to /notes */}
          <Route path="/eleves/note" element={
            <ProtectedRoute>
              <MainLayout>
                <Navigate to="/notes" replace />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/eleves/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><EleveShow /></MainLayout></ProtectedRoute>} />
          <Route path="/eleves/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><EleveEdit /></MainLayout></ProtectedRoute>} />

          {/* Notes route */}
          <Route path="/notes" element={<ProtectedRoute><MainLayout><NotesIndex /></MainLayout></ProtectedRoute>} />

          {/* Notes d'un élève spécifique */}
          <Route path="/eleves/:eleveId/notes" element={
            <ProtectedRoute>
              <MainLayout>
                <EleveNotes />
              </MainLayout>
            </ProtectedRoute>
          } />


          {/* Notes management routes */}
          <Route path="/notes/new" element={
            <ProtectedRoute>
              <MainLayout>
                <NotesNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/notes/classe/:classeId/manage" element={<ProtectedRoute><MainLayout><NotesClasseManage /></MainLayout></ProtectedRoute>} />
          <Route path="/notes/:id/edit" element={
            <ProtectedRoute>
              <MainLayout>
                <NotesNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          {/* Controles routes */}
          <Route path="/controles" element={<ProtectedRoute><MainLayout><ControlesIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/controles/new" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ControlesNew /></MainLayout></ProtectedRoute>} />
          <Route path="/controles/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ControleShow /></MainLayout></ProtectedRoute>} />
          <Route path="/controles/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ControleEdit /></MainLayout></ProtectedRoute>} />

          {/* Transport routes */}
          <Route path="/transports" element={
            <ProtectedRoute requiredRoles={["admin", "super_admin"]}>
              <MainLayout>
                <TransportsIndex />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/transports/new" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <TransportNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/transports/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <TransportShow />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/transports/:id/edit" element={
            <ProtectedRoute adminOnly>
              <MainLayout>
                <TransportEdit />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Chauffeur routes */}
          <Route path="/chauffeurs" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ChauffeursIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/chauffeurs/new" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ChauffeurNew /></MainLayout></ProtectedRoute>} />
          <Route path="/chauffeurs/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ChauffeurShow /></MainLayout></ProtectedRoute>} />
          <Route path="/chauffeurs/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ChauffeurEdit /></MainLayout></ProtectedRoute>} />

          {/* Accompagnateur routes */}
          <Route path="/accompagnateurs" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><AccompagnateursIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/accompagnateurs/new" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><AccompagnateurNew /></MainLayout></ProtectedRoute>} />
          <Route path="/accompagnateurs/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><AccompagnateurShow /></MainLayout></ProtectedRoute>} />
          <Route path="/accompagnateurs/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><AccompagnateurEdit /></MainLayout></ProtectedRoute>} />

          {/* AnneeScolaire routes */}
          <Route path="/annees-scolaires" element={
            <ProtectedRoute requiredRoles={["super_admin"]}>
              <MainLayout>
                <AnneesScolairesIndex />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/annees-scolaires/new" element={
            <ProtectedRoute requiredRoles={["super_admin"]}>
              <MainLayout>
                <AnneeScolaireNew />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/annees-scolaires/:id" element={
            <ProtectedRoute requiredRoles={["super_admin"]}>
              <MainLayout>
                <AnneeScolaireShow />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/annees-scolaires/:id/edit" element={
            <ProtectedRoute requiredRoles={["super_admin"]}>
              <MainLayout>
                <AnneeScolaireEdit />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Activités: admins + élèves (lecture seule pour élèves) */}
          <Route path="/activites" element={<ProtectedRoute requiredRoles={["admin", "super_admin", "eleve"]}><MainLayout><ActivitesIndex /></MainLayout></ProtectedRoute>} />
          <Route path="/activites/new" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ActiviteForm /></MainLayout></ProtectedRoute>} />
          <Route path="/activites/:id" element={<ProtectedRoute requiredRoles={["admin", "super_admin", "eleve"]}><MainLayout><ActiviteShow /></MainLayout></ProtectedRoute>} />
          <Route path="/activites/:id/edit" element={<ProtectedRoute requiredRoles={["admin", "super_admin"]}><MainLayout><ActiviteForm /></MainLayout></ProtectedRoute>} />

          {/* Routes élève: alias vers les pages existantes */}
          <Route path="/eleves/me/timetable" element={<ProtectedRoute><EleveTimetableRedirect /></ProtectedRoute>} />
          <Route path="/eleves/me/notes" element={<ProtectedRoute><Navigate to="/notes" replace /></ProtectedRoute>} />
          <Route path="/eleves/me/controles" element={<ProtectedRoute><Navigate to="/controles" replace /></ProtectedRoute>} />
          {/* Route catch-all pour les pages 404 */}
          <Route path="*" element={<Error404 />} />
          </Routes>
            </AnneeScolaireProvider>
          </BrowserRouter>
          <NotificationContainer />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
