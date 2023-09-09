import { SuiObjectData } from "@mysten/sui.js/client"
import { ethos } from "ethos-connect"
import { useEffect, useState } from "react"

export const useObjectSync = (object_id: string, interval: number): SuiObjectData | null => {
    const [object, set_object] = useState<SuiObjectData | null>(null)
    const { wallet } = ethos.useWallet()

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (wallet) {
                const res = await wallet.client.getObject({
                    id: object_id, options: {
                        showContent: true
                    }
                })
                if (res.data) {
                    set_object(res.data)
                }
            }
        }, interval * 1000)
        return () => clearInterval(intervalId)
    }, [wallet])

    return object
}