import "dotenv/config"

import { Ed25519Keypair  } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64 } from "@mysten/sui.js/utils";

import { execSync } from "child_process";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, SuiObjectChange } from "@mysten/sui.js/client";
import { writeFileSync } from "fs";

const privkey = process.env.DEPLOYER_B64_PRIVKEY
if (!privkey) {
    console.log("Error: DEPLOYER_B64_PRIVKEY not set as env variable.")
    process.exit(1)
}
const keypair = Ed25519Keypair.fromSecretKey(fromB64(privkey).slice(1))
const path_to_contracts = path.join(dirname(fileURLToPath(import.meta.url)), "../../contracts")

const client = new SuiClient({ url: "https://fullnode.devnet.sui.io:443"})

console.log("Building move code...")
const { modules, dependencies } = JSON.parse(execSync(
    `sui move build --dump-bytecode-as-base64 --path ${path_to_contracts}`,
    { encoding: "utf-8" }
))

console.log("Deploying from address:", keypair.toSuiAddress())
const deploy_trx = new TransactionBlock()
const [upgradeCap] = deploy_trx.publish({
    modules,
    dependencies,
});

deploy_trx.transferObjects([upgradeCap], deploy_trx.pure(keypair.toSuiAddress()));
const { objectChanges, balanceChanges } = await client.signAndExecuteTransactionBlock({
    signer: keypair, transactionBlock: deploy_trx, options: {
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
        showInput: false,
        showObjectChanges: true,
        showRawInput: false
    }
})

const parse_cost = (amount: string) => Math.abs(parseInt(amount)) / 1_000_000_000

if (balanceChanges) {
    console.log("Cost to deploy:", parse_cost(balanceChanges[0].amount), "SUI")
}

if (!objectChanges) {
    console.log("Error: RPC did not return objectChanges")
    process.exit(1)
}
const published_event = objectChanges.find(obj => obj.type == "published")
if (published_event?.type != "published") {
    process.exit(1)
}

const find_one_by_type = (changes: SuiObjectChange[], type: string) => {
    const object_change = changes.find(change => change.type == "created" && change.objectType == type)
    if (object_change?.type == "created") {
        return object_change.objectId
    }
}

const package_id = published_event.packageId
const place_type = `${package_id}::board::Place` 

const place_id = find_one_by_type(objectChanges, place_type)
if (!place_id) {
    console.log("Error: Could not find place creation in results of publish")
    process.exit(1)
}

let deployed_addresses = {
    types: {
        PLACE: place_type
    },
    PACKAGE_ID: package_id,
    PLACE: place_id
}

const read_quadrant_trx = new TransactionBlock()
const [_] = read_quadrant_trx.moveCall({
    target: `${package_id}::board::get_quadrants`,
    arguments: [read_quadrant_trx.object(place_id)]
})

console.log("Getting addresses of quadrants...")
const read_result = await client.devInspectTransactionBlock({
    transactionBlock: read_quadrant_trx, sender: keypair.toSuiAddress()
})

const quadrants = read_result.results?.[0]?.returnValues?.[0]?.[0]
if (!quadrants || quadrants.length != 129) {
    console.log("Incorrect value for quadrants result")
    process.exit(1)
}
const [__, ...bytes] = quadrants
const chunked_address_bytes = Array.from({length: 4}).map((_, i) => bytes.slice(i * 32, (i + 1) * 32))
const addresses = chunked_address_bytes.map(address_bytes => "0x" + address_bytes.map(byte => byte.toString(16).padStart(2, "0")).join(""))

deployed_addresses = Object.assign(deployed_addresses, {
    QUADRANT_ADDRESSES: addresses
})

console.log("Writing addresses to json...")
const path_to_address_file = path.join(dirname(fileURLToPath(import.meta.url)), "../src/deployed_addresses.json")
writeFileSync(path_to_address_file, JSON.stringify(deployed_addresses, null, 4))