import { useOutletContext } from 'react-router-dom'
import type { Company } from '../api/types'
export const useCompany = () => useOutletContext<Company>()
