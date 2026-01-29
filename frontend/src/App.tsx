import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./components/MainLayout";
import NoteList from "./pages/Note";
import TodoList from "./pages/Todo";
import Checkin from "./pages/Checkin/index";
import Weight from "./pages/Weight/index";
import Dashboard from "./pages/Dashboard";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 使用 AuthGuard 包裹受保护路由 */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="note/*" element={<NoteList />} />
          <Route path="todo/*" element={<TodoList />} />
          <Route path="checkin/*" element={<Checkin />} />
          <Route path="weight/*" element={<Weight />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
