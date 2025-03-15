async function handleWalletConnect() {
    const walletStatus = document.getElementById('wallet-status');
    const balanceContainer = document.getElementById('balance-container');
    const balanceError = document.getElementById('balance-error');
    
    try {
        // Show connecting status
        walletStatus.textContent = 'Connecting...';
        
        const result = await connectVeChainWallet();
        
        if (result.success) {
            walletStatus.textContent = `Connected: ${formatAddress(result.address)}`;
            document.getElementById('connection-status').classList.remove('error');
            balanceContainer.classList.remove('hidden');
            await updateBalanceDisplay();
        } else {
            throw new Error(result.error || 'Failed to connect');
        }
    } catch (error) {
        console.error('Connection error:', error);
        walletStatus.textContent = 'Error: Could not connect wallet';
        document.getElementById('connection-status').classList.add('error');
        balanceContainer.classList.add('hidden');
    }
}

async function updateBalanceDisplay() {
    const balanceError = document.getElementById('balance-error');
    
    try {
        const balances = await getBalances();
        if (balances) {
            document.getElementById('vet-balance').textContent = `${balances.vet} VET`;
            document.getElementById('vtho-balance').textContent = `${balances.vtho} VTHO`;
            balanceError.classList.add('hidden');
        } else {
            throw new Error('Could not fetch balances');
        }
    } catch (error) {
        console.error('Balance error:', error);
        balanceError.classList.remove('hidden');
    }
}

function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
} 