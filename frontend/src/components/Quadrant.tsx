import { ethos } from "ethos-connect";
import { memo, useEffect, useRef } from "react"
import { get_set_pixel_trx } from "../utils/place_pixel";

export interface QuadrantProps {
    quadrants: [number[][], string][],
    color: string
}

export default memo(({ quadrants, color }: QuadrantProps) => {
    const ref = useRef<HTMLCanvasElement>(null)
    const { wallet } = ethos.useWallet();


    useEffect(() => {
        if (ref.current) {
            const ctx = ref.current.getContext("2d")
            if (ctx) {
                ctx.imageSmoothingEnabled = false
            }
            const img_data = ctx?.createImageData(400, 400);
            if (!img_data) {
                return
            }
            const img_bytes = img_data.data

            const get_quadrant = (n_pixel: number) => {
                const x = n_pixel % 400 > 200
                const y = Math.floor(n_pixel / 400) > 200
                return quadrants[x ?
                    (y ? 3 : 1) :
                    (y ? 2 : 0)]
            }
            
            console.log("Performing Expensive Computation")
            for (let i = 0; i < img_bytes.length; i += 4) {
                const n_pixel = Math.round(i / 4)
                const quadrant = get_quadrant(n_pixel)

                const x_offset = (n_pixel % 400 >= 200) ?
                    n_pixel % 400 - 200 :
                    n_pixel % 400

                const y_offset = (Math.floor(n_pixel / 400) >= 200) ?
                    Math.floor(n_pixel / 400) - 200 :
                    Math.floor(n_pixel / 400)

                const pixel = quadrant[0][x_offset][y_offset]
                const [R0, R1, G0, G1, B0, B1] = pixel.toString(16).padStart(6, "0")
                img_bytes[i + 0] = parseInt(R0 + R1, 16)
                img_bytes[i + 1] = parseInt(G0 + G1, 16)
                img_bytes[i + 2] = parseInt(B0 + B1, 16)
                img_bytes[i + 3] = 255
            }
            createImageBitmap(img_data).then(bitmap => ctx?.drawImage(bitmap, 0, 0, 800, 800))

        }
    }, [quadrants])

    return <canvas onClick={e => {
        const rect = ref.current?.getBoundingClientRect()
        if (rect && (e.ctrlKey || e.metaKey)) {
            const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * 400)
            const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * 400)
            //wallet?.requestPreapproval({
            //    objectId: PLACE,
            //    totalGasLimit: 1_000_000_000,
            //    chain: Chain.SUI_DEVNET,
            //    target: `${PACKAGE_ID}::board::set_pixel_at`,
            //    description: "",
            //    perTransactionGasLimit: 1_000_000_000,
            //    maxTransactionCount: 25
            //})
            wallet?.signAndExecuteTransactionBlock({
                transactionBlock: get_set_pixel_trx(x, y, parseInt(color.replace("#", ""), 16))
            })
        }
    }} ref={ref} height={800} width={800}/>
}, (prev, next) => (
    JSON.stringify([prev.quadrants.map(([_, digest]) => digest), prev.color]) == 
    JSON.stringify([next.quadrants.map(([_, digest]) => digest), next.color])
))