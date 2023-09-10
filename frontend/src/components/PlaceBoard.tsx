import { useObjectSync } from '../utils/hooks';
import { QUADRANT_ADDRESSES } from "../deployed_addresses.json"
import Quadrant from './Quadrant';
import { SuiObjectData } from '@mysten/sui.js/client';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

export interface PlaceBoardProps {
  color: string
}

export default ({ color }: PlaceBoardProps) => {
  const quadrant_responses = QUADRANT_ADDRESSES.map(address => useObjectSync(address, 3))
  if (!quadrant_responses.every(x => x)) {
    return <div style={{
      width: "800px", height: "800px", border: "1px solid black",
      textAlign: "center",
    }}>
      <h1 style={{marginTop: "16rem"}}>Loading Content...</h1>
    </div>
  }

  const quadrants = (quadrant_responses as SuiObjectData[])
    .map(response => {
      if (response.content?.dataType == "moveObject") {
        return [
          (response.content.fields as any)["board"],
          response.digest
        ] as [number[][], string]
      }
    }) as [number[][], string][]
  return <TransformWrapper>
    <div style={{border: "1px solid black", width: "fit-content"}}>
    <TransformComponent>
      <Quadrant quadrants={quadrants} color={color}/>
    </TransformComponent>
    </div>
  </TransformWrapper>
}