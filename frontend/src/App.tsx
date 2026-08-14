import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { PromptManager } from './pages/PromptManager';
import { LeadsList } from './pages/LeadsList';
import { LeadDetails } from './pages/LeadDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="leads/:id" element={<LeadDetails />} />
          <Route path="chat" element={<Chat />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="prompt" element={<PromptManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
