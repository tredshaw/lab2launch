import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Form from './pages/Form'
import Results from './pages/Results'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/analyse" element={<Form />} />
        <Route path="/results/:id" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}
