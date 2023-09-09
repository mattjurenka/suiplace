import { TransactionBlock } from "@mysten/sui.js/transactions"
import { PACKAGE_ID, PLACE } from "../deployed_addresses.json"

export const get_set_pixel_trx = (x: number, y: number, color: number): TransactionBlock => {
    const trx = new TransactionBlock()
    trx.moveCall({
        target: `${PACKAGE_ID}::board::set_pixel_at`,
        arguments: [trx.object(PLACE), trx.pure(x), trx.pure(y), trx.pure(color)]
    })
    return trx
}