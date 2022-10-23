import { ConnectWallet } from "@thirdweb-dev/react";
import "./styles/Home.css";

export default function Home() {
  return (
    <div className="container">
      <main className="main">
        <h1 className="title">
          Welcome to Balinese Arts!
        </h1>

        <p className="description">
          Here you can see my collectios of Balinese art.
        </p>

        <div className="connect">
          <ConnectWallet />
        </div>

        <div className="grid">
          <a href="/" className="card">
            <h2>Bali Paintings &rarr;</h2>
            <p>
              Here you can see Paintings collections.
              <br/><br/>
            </p>
          </a>

          <a href="/" className="card">
            <h2>Bali Statues&rarr;</h2>
            <p>
            This is a collection of Balinese Statues made of wood.
            <br/><br/>
            </p>
          </a>

          <a href="/" className="card">
            <h2>Bali Crafts &rarr;</h2>
            <p>
            This is a collection of knick-knacks made by Balinese craftsmen.
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}
