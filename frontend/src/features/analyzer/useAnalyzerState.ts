import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../lib/useDebouncedValue'
import { DEFAULT_INPUTS, parseInputs, serializeInputs, toRequest, type AnalyzerInputs } from './state'

const DEBOUNCE_MS = 180

function readInputsFromLocation(): AnalyzerInputs {
  if (typeof window === 'undefined') return DEFAULT_INPUTS
  return parseInputs(new URLSearchParams(window.location.search))
}

export function useAnalyzerState() {
  const [inputs, setInputs] = useState<AnalyzerInputs>(readInputsFromLocation)
  const debouncedInputs = useDebouncedValue(inputs, DEBOUNCE_MS)
  const request = useMemo(() => toRequest(debouncedInputs), [debouncedInputs])

  useEffect(() => {
    const query = serializeInputs(debouncedInputs).toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }, [debouncedInputs])

  const update = useCallback((patch: Partial<AnalyzerInputs>) => {
    setInputs((current) => ({ ...current, ...patch }))
  }, [])

  const reset = useCallback(() => setInputs(DEFAULT_INPUTS), [])

  const isDirty = useMemo(() => serializeInputs(inputs).toString().length > 0, [inputs])

  return { inputs, request, update, reset, isDirty }
}
