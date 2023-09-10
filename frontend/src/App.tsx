import './App.css'
import { EthosConnectStatus, SignInButton, ethos } from 'ethos-connect';
import PlaceBoard from './components/PlaceBoard';
import { CompactPicker } from 'react-color'
import { useState } from 'react';


function App() {
  const { status } = ethos.useWallet();
  const [color, set_color] = useState("#000000")

  if (status == EthosConnectStatus.Connected) {
    return <div style={{display: "flex", justifyContent: "center", marginTop: "4rem"}}>
      <PlaceBoard color={color} />
      <div style={{ margin: "4rem", width: "512px", lineHeight: "2rem", display: "flex", flexDirection: "column", justifyContent: "center"}}>
        <h1>Sui Place</h1>
        <p style={{marginTop: "4rem", marginBottom: "4rem"}}>
          Are you ready to join the Sui community in placing<br/> a tile on the board? Select a color
          then ctrl+click (win) or cmd+click (mac) to place.
        </p>
        <div style={{marginBottom: "4rem"}}>
          <CompactPicker color={color} onChangeComplete={(new_color) => set_color(new_color.hex)} />
        </div>
        <p style={{marginBottom: "4rem"}}>
          Sui move is currently only available on devnet, make sure your wallet network
          is properly set.
        </p>
        <a href="https://jurenka.software/"><b>Made with ❤️ by https://jurenka.software/</b></a>
      </div>
    </div>
  } else if (status == EthosConnectStatus.Loading) {
    return <div style={{display: "flex", justifyContent: "center"}}>
      <h1 style={{marginTop: "16rem"}}>Loading Wallet...</h1>
    </div>
  } else {
    return <div style={{display: "flex", justifyContent: "center"}}>
      <SignInButton style={{ padding: "1rem", marginTop: "16rem" }} children={<h1>Connect a Wallet to View Sui Place</h1>} />
    </div>
  }
}

export default App
