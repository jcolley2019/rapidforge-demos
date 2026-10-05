import { Route, Routes } from 'react-router-dom'
import PickerPage from './PickerPage'
import HeritagePage from './variants/heritage/HeritagePage'
import GeospatialPage from './variants/geospatial/GeospatialPage'
import CleanProPage from './variants/cleanpro/CleanProPage'
import TexasPage from './variants/texas/TexasPage'
import AerialPage from './variants/aerial/AerialPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PickerPage />} />
      <Route path="/heritage" element={<HeritagePage />} />
      <Route path="/geospatial" element={<GeospatialPage />} />
      <Route path="/cleanpro" element={<CleanProPage />} />
      <Route path="/texas" element={<TexasPage />} />
      <Route path="/aerial" element={<AerialPage />} />
    </Routes>
  )
}
