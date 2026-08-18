import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Avatar } from './components/Avatar';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route
              path="/"
              element={
                <>
                  <Avatar />
                  <ChatArea />
                  <ChatInput />
                </>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <footer className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mt-3 text-xs text-gray-400">
              XYZ School Assistant • May hallucinate or provide placeholder data.
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;