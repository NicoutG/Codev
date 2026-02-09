import { BrowserRouter, Routes, Route } from "react-router-dom"
import IndicatorList from "./pages/IndicatorList"
import IndicatorCreate from "./pages/IndicatorCreate"
import IndicatorEdit from "./pages/IndicatorEdit"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndicatorList />} />
        <Route path="/indicators/new" element={<IndicatorCreate />} />
        <Route path="/indicators/:id/edit" element={<IndicatorEdit />} />
      </Routes>
    </BrowserRouter>
  )
}
