import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Receipts from './pages/Receipts'
import AddReceipt from './pages/AddReceipt'
import Areas from './pages/Areas'
import ReceiptDetail from './pages/ReceiptDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kvitton" element={<Receipts />} />
          <Route path="/kvitton/:id" element={<ReceiptDetail />} />
          <Route path="/lagg-till" element={<AddReceipt />} />
          <Route path="/omraden" element={<Areas />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  )
}
