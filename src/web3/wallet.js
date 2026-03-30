// MetaMask wallet integration for PokeClaude

const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
const POLYGON_PARAMS = {
  chainId: POLYGON_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.connected = false;
    this.listeners = [];
  }

  async connect() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use Web3 features.');
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.address = accounts[0];
      this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.connected = true;

      if (typeof window.ethers !== 'undefined') {
        this.provider = new window.ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      }

      this._setupListeners();
      this._notifyListeners('connected', { address: this.address, chainId: this.chainId });

      return { address: this.address, chainId: this.chainId };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.connected = false;
    this._notifyListeners('disconnected', {});
  }

  async switchToPolygon() {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_PARAMS],
          });
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  async getBalance() {
    if (!this.provider || !this.address) return '0';
    try {
      const balance = await this.provider.getBalance(this.address);
      return window.ethers ? window.ethers.formatEther(balance) : '0';
    } catch {
      return '0';
    }
  }

  getShortAddress() {
    if (!this.address) return '';
    return `${this.address.slice(0, 6)}...${this.address.slice(-4)}`;
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _setupListeners() {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.address = accounts[0];
        this._notifyListeners('accountChanged', { address: this.address });
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = chainId;
      this._notifyListeners('chainChanged', { chainId });
    });
  }

  _notifyListeners(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }
}

// Singleton instance
const walletManager = new WalletManager();
export default walletManager;
export { WalletManager };
