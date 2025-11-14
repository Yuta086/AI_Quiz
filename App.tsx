import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import MasterListManager from './components/admin/MasterListManager';
import ProjectList from './components/admin/ProjectList';
import ProjectEditor from './components/admin/ProjectEditor';
import SubmissionStatus from './components/admin/SubmissionStatus';
import QuizFlow from './components/quiz/QuizFlow';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/quiz/:id" element={<QuizFlow />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="master-list" element={<MasterListManager />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/new" element={<ProjectEditor />} />
            <Route path="projects/:id/edit" element={<ProjectEditor />} />
            <Route path="projects/:id/status" element={<SubmissionStatus />} />
          </Route>
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;