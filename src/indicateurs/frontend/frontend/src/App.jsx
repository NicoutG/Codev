import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./auth/Login"
import Dashboard from "./pages/Dashboard"
import IndicatorList from "./pages/IndicatorList"
import IndicatorCreate from "./pages/IndicatorCreate"
import IndicatorEdit from "./pages/IndicatorEdit"
import IndicatorResults from "./pages/IndicatorResults"
import DataImport from "./pages/DataImport"
import FormulaireList from "./pages/FormulaireList"
import FormulaireCreate from "./pages/FormulaireCreate"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/indicators"
            element={
              <ProtectedRoute>
                <IndicatorList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/indicators/new"
            element={
              <ProtectedRoute requireRole="modificateur">
                <IndicatorCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/indicators/:id/edit"
            element={
              <ProtectedRoute requireRole="modificateur">
                <IndicatorEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/indicators/:id/results"
            element={
              <ProtectedRoute>
                <IndicatorResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute requireRole="modificateur">
                <DataImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formulaires"
            element={
              <ProtectedRoute>
                <FormulaireList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formulaires/new"
            element={
              <ProtectedRoute requireRole="modificateur">
                <FormulaireCreate />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
