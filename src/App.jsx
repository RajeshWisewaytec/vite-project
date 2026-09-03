import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

// BSC Testnet USDT Contract & ERC-20 ABI
const USDT_ADDRESS = "0x9a9759fCB2d2632BE7B1da5B380d02Fe8F3B4300";
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

function App() {
  const [account, setAccount] = useState("");
  const [nativeBalance, setNativeBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "", txHash: "" });

  // 1. Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus({ type: "error", message: "MetaMask is not installed." });
      return;
    }
    try {
      setLoading(true);
      setStatus({ type: "", message: "", txHash: "" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await fetchBalances(accounts[0], provider);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Failed to connect wallet." });
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Native BNB & USDT Balances
  const fetchBalances = async (userAccount, provider) => {
    if (!userAccount) return;
    try {
      // Fetch Native Balance (tBNB)
      const rawNative = await provider.getBalance(userAccount);
      setNativeBalance(ethers.formatEther(rawNative));

      // Fetch USDT Token Balance
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
      const decimals = await usdtContract.decimals();
      const rawUsdt = await usdtContract.balanceOf(userAccount);
      setUsdtBalance(ethers.formatUnits(rawUsdt, decimals));
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  };

  // 3. Send USDT Token Transfer
  const sendUSDT = async (e) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    try {
      setLoading(true);
      setStatus({ type: "info", message: "Please confirm the transaction in MetaMask..." });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

      const decimals = await usdtContract.decimals();
      const parsedAmount = ethers.parseUnits(amount, decimals);

      const tx = await usdtContract.transfer(recipient, parsedAmount);
      setStatus({
        type: "info",
        message: "Transaction submitted! Waiting for confirmation...",
        txHash: tx.hash,
      });

      await tx.wait(1);
      setStatus({
        type: "success",
        message: `Successfully transferred ${amount} USDT!`,
        txHash: tx.hash,
      });

      setAmount("");
      setRecipient("");
      await fetchBalances(account, provider);
    } catch (err) {
      console.error("Transfer error:", err);
      setStatus({
        type: "error",
        message: err.reason || err.shortMessage || err.message || "Transfer failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-connect if already connected & listen to account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          fetchBalances(accounts[0], provider);
        }
      });

      const handleAccounts = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          fetchBalances(accounts[0], provider);
        } else {
          setAccount("");
          setNativeBalance("0");
          setUsdtBalance("0");
        }
      };

      window.ethereum.on("accountsChanged", handleAccounts);
      return () => window.ethereum.removeListener("accountsChanged", handleAccounts);
    }
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="app-title">⚡ Web3 Token Transfer</span>
        </div>
        <div className="wallet-btn-container">
          {account ? (
            <span className="wallet-btn wallet-btn-address">
              <span className="wallet-indicator-dot"></span>
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          ) : (
            <button className="wallet-btn wallet-btn-connect" onClick={connectWallet} disabled={loading}>
              {loading ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}
        </div>
      </header>

      {/* Main Section */}
      <main className="main-content">
        <h1 className="hero-title">Token Transfer Portal</h1>
        <p className="hero-subtitle">Transfer USDT tokens quickly and easily.</p>

        {!account ? (
          <div className="wallet-card connect-prompt-card">
            <h3>Connect Your Wallet</h3>
            <p className="wallet-note">Connect MetaMask to view balances and transfer tokens.</p>
            <button className="wallet-btn wallet-btn-connect full-width" onClick={connectWallet} disabled={loading}>
              {loading ? "Connecting..." : "Connect MetaMask Wallet"}
            </button>
          </div>
        ) : (
          <div className="transfer-grid">
            {/* Wallet Overview Card */}
            <div className="wallet-card">
              <div className="wallet-card-header">
                <h3>Wallet Overview</h3>
                <span className="status-pill status-connected">Connected</span>
              </div>

              <div className="wallet-info-grid" style={{ marginBottom: "16px" }}>
                <div className="wallet-info-item">
                  <label>Active Account</label>
                  <div className="wallet-code-block">{account}</div>
                </div>
              </div>

              <div className="balances-row">
                <div className="balance-box">
                  <label>Gas Balance (tBNB)</label>
                  <div className="balance-value">
                    {parseFloat(nativeBalance).toFixed(4)} <small>tBNB</small>
                  </div>
                </div>

                <div className="balance-box">
                  <label>USDT Balance</label>
                  <div className="balance-value token-highlight">
                    {parseFloat(usdtBalance).toLocaleString()} <small>USDT</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Form Card */}
            <div className="wallet-card">
              <div className="wallet-card-header">
                <h3>Send USDT</h3>
                <span className="token-badge">USDT</span>
              </div>

              <form onSubmit={sendUSDT}>
                <div className="form-group">
                  <label>Recipient EVM Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value.trim())}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Amount (USDT)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {status.message && (
                  <div className={`wallet-alert wallet-alert-${status.type || "info"}`}>
                    <div>{status.message}</div>
                    {status.txHash && (
                      <div className="tx-hash-box" style={{ marginTop: "8px" }}>
                        <small>Tx Hash: </small>
                        <a
                          href={`https://testnet.bscscan.com/tx/${status.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-hash-link"
                        >
                          {status.txHash.slice(0, 10)}...{status.txHash.slice(-8)} ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="transfer-btn"
                  disabled={loading || !recipient || !amount || parseFloat(amount) <= 0}
                >
                  {loading ? "Processing..." : `Send ${amount ? amount : ""} USDT`}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;