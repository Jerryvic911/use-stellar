import { useState, useEffect, useCallback, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, parseHorizonBalance } from "../utils"
import type { Asset, Balance } from "../types"

export interface UseBalanceOptions {
  address?: string | null
  asset?: Asset
  watch?: boolean
}

export interface UseBalanceReturn {
  balance: string | null
  balances: Balance[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches the XLM or asset balance for the connected wallet or any Stellar address.
 *
 * @param options - Configuration options
 * @param options.address - The Stellar address to fetch balances for. Defaults to the connected wallet.
 * @param options.asset - The asset to return in `balance`. Defaults to XLM.
 * @param options.watch - When true, re-fetches every 10 seconds.
 * @returns `{ balance, balances, loading, error, refetch }`
 *
 * @example
 * const { balance, loading } = useBalance({ asset: "XLM", watch: true })
 */
export function useBalance({
  address,
  asset = "XLM",
  watch = false,
}: UseBalanceOptions = {}): UseBalanceReturn {
  const { network, wallet } = useStellarContext()
  const resolvedAddress = address ?? wallet.address

  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestRef = useRef(0)

  const fetchBalances = useCallback(async () => {
    if (!resolvedAddress) return

    const fetchId = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      const server = getHorizonServer(network)
      const account = await server.loadAccount(resolvedAddress)

      if (fetchId !== requestRef.current) return

      const parsed = account.balances.map(parseHorizonBalance)
      setBalances(parsed)
    } catch (err) {
      if (fetchId !== requestRef.current) return
      setError(err instanceof Error ? err.message : "Failed to fetch balance")
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [resolvedAddress, network])

  useEffect(() => {
    fetchBalances()

    if (watch) {
      const interval = setInterval(fetchBalances, 10_000)
      return () => {
        requestRef.current = -1
        clearInterval(interval)
      }
    }

    return () => {
      requestRef.current = -1
    }
  }, [fetchBalances, watch])

  const match = balances.find(b => {
    if (asset === "XLM") return b.asset === "XLM"
    if (typeof asset === "object" && typeof b.asset === "object") {
      return b.asset.code === asset.code && b.asset.issuer === asset.issuer
    }
    return false
  })
  const balance = match?.balance ?? null

  return { balance, balances, loading, error, refetch: fetchBalances }
}
