import { Route, Routes, useSearchParams } from 'react-router-dom'
import { resolveBriefName, siteContentFor } from './brief/current'
import { SiteContext } from './brief/site-context'
import './presets/vertical-fonts'
import PickerPage from './PickerPage'
import HeritagePage from './variants/heritage/HeritagePage'
import GeospatialPage from './variants/geospatial/GeospatialPage'
import CleanProPage from './variants/cleanpro/CleanProPage'
import TexasPage from './variants/texas/TexasPage'
import AerialPage from './variants/aerial/AerialPage'

export default function App() {
  const [params] = useSearchParams()
  const site = siteContentFor(resolveBriefName(params.get('brief')))!
  return (
    <SiteContext.Provider value={site}>
      <Routes>
        <Route path="/" element={<PickerPage />} />
        <Route path="/heritage" element={<HeritagePage />} />
        <Route path="/geospatial" element={<GeospatialPage />} />
        <Route path="/cleanpro" element={<CleanProPage />} />
        <Route path="/texas" element={<TexasPage />} />
        <Route path="/aerial" element={<AerialPage />} />
      </Routes>
    </SiteContext.Provider>
  )
}
