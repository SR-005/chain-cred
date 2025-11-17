// /static/js/credchain.js

let web3;
let contract;
let account;

const CONTRACT_ADDRESS = "0xCCc0F45E8bE87022ea3E553BdD2f64cD6aAeed79"; // Check this matches your latest deployment
const COMPILED_JSON_PATH = "./static/compiledcccode.json"; 

// ---- helper: load ABI from compiled JSON ----
async function loadAbi() {
    try {
        console.log("[credchain] fetching compiled JSON:", COMPILED_JSON_PATH);
        const resp = await fetch(COMPILED_JSON_PATH);
        if (!resp.ok) throw new Error(`Failed to fetch ABI JSON: ${resp.status}`);
        const compiled = await resp.json();

        const abi = compiled?.contracts?.["chaincred.sol"]?.CredChain?.abi;
        if (!abi) throw new Error("ABI not found at expected path in compiledcccode.json");
        return abi;
    } catch (err) {
        console.error("[credchain] loadAbi error:", err);
        throw err;
    }
}

// ---- network switch to Moonbase Alpha ----
async function switchToMoonbase() {
    const chainIdHex = "0x507"; // 1287
    if (!window.ethereum) throw new Error("No ethereum provider (MetaMask)");

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }]
        });
    } catch (err) {
        if (err.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: chainIdHex,
                        chainName: "Moonbase Alpha",
                        rpcUrls: ["https://rpc.api.moonbase.moonbeam.network"],
                        nativeCurrency: { name: "DEV", symbol: "DEV", decimals: 18 },
                        blockExplorerUrls: ["https://moonbase.moonscan.io/"]
                    }]
                });
            } catch (addErr) {
                console.error("[credchain] add chain error:", addErr);
                throw addErr;
            }
        } else {
            throw err;
        }
    }
}

// ---- initialize web3 + contract ----
async function initContract() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    if (!web3) {
        web3 = new Web3(window.ethereum);
    }
    const abi = await loadAbi();
    contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
}

//----------------------------------------------------------
// CONNECT WALLET
//----------------------------------------------------------
export async function connectWallet() {
    if (!window.ethereum) {
        alert("Install MetaMask!");
        throw new Error("No ethereum provider");
    }

    await switchToMoonbase();

    web3 = new Web3(window.ethereum);
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    console.log("[credchain] wallet connected:", account);

    await initContract();
    return account;
}

//----------------------------------------------------------
// HELPER: SEND TRANSACTION
//----------------------------------------------------------
async function sendTx(txObject) {
    if (!account) throw new Error("account not set; call connectWallet() first");
    try {
        const gas = await txObject.estimateGas({ from: account });
        const gasPrice = await web3.eth.getGasPrice();
        
        const receipt = await txObject.send({
            from: account,
            gas,
            gasPrice
        });
        return receipt;
    } catch (err) {
        console.error("[credchain] sendTx error:", err);
        throw err;
    }
}

//----------------------------------------------------------
// ADD PROJECT (Called from Fdashboard.js)
//----------------------------------------------------------
export async function addProjectOnChain(client, name, desc, lang, projectHash, link) {
    if (!contract || !account) await connectWallet();

    // Match Solidity Struct: ProjectInput
    const p = {
        user: account,
        client: client,
        projectName: name,
        description: desc,
        languages: lang,
        projectHash: projectHash,
        link: link
    };

    console.log("[credchain] Adding project:", p);
    return sendTx(contract.methods.addProject(p));
}

//----------------------------------------------------------
// OTHER EXPORTS
//----------------------------------------------------------
export async function verifyUserOnChain() {
    if (!contract || !account) await connectWallet();
    return sendTx(contract.methods.setUserVerified(account, true));
}

export async function submitReviewOnChain(freelancer, index, rating, commentHash) {
    if (!contract || !account) await connectWallet();
    return sendTx(contract.methods.submitReview(freelancer, index, rating, commentHash));
}

// Expose functions to window for use in non-module scripts
window.connectWallet = connectWallet;
window.addProjectOnChain = addProjectOnChain;
window.verifyUserOnChain = verifyUserOnChain;
window.submitReviewOnChain = submitReviewOnChain;
window.cc_account = () => account;