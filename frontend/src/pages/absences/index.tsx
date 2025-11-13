import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AbsencesIndex from './AbsencesIndex';
import AbsenceNew from './AbsenceNew';
import AbsenceShow from './AbsenceShow';
import AbsenceEdit from './AbsenceEdit';
import AbsenceJustify from './AbsenceJustify';


const AbsencesPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AbsencesIndex />} />
      <Route path="/new" element={<AbsenceNew />} />
      <Route path="/:id" element={<AbsenceShow />} />
      <Route path="/:id/edit" element={<AbsenceEdit />} />
      <Route path="/:id/justify" element={<AbsenceJustify />} />
    </Routes>
  );
};

export default AbsencesPage;