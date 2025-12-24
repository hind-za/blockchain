class BlockchainVisualizer {
    constructor() {
        this.blockchain = [];
        this.blockData = '';
        this.difficulty = 2;
        this.chainValid = true;
        this.editingIndex = null;
        this.editValue = '';
        this.message = '';
        this.miningStatus = { mining: false, progress: 0 };

        this.init();
    }

    init() {
        this.render();
        document.getElementById('app').addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('app').addEventListener('input', (e) => this.handleInput(e));
        document.getElementById('app').addEventListener('keypress', (e) => this.handleKeyPress(e));
    }

    // SHA-256 Hash Function using Web Crypto API
    async calculateHash(blockData) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(blockData));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // Proof of Work
    async proofOfWork(blockData, difficulty) {
        let nonce = 0;
        let hash = await this.calculateHash({ ...blockData, nonce });
        const target = '0'.repeat(difficulty);

        while (!hash.startsWith(target)) {
            nonce++;
            hash = await this.calculateHash({ ...blockData, nonce });

            if (nonce % 100 === 0) {
                this.miningStatus = { mining: true, progress: nonce };
                this.render();
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return { hash, nonce };
    }

    // Add Block
    async addBlock() {
        if (!this.blockData.trim()) {
            this.setMessage('⚠️ Entrez des données pour le bloc');
            return;
        }

        if (this.blockchain.length > 0 && !this.chainValid) {
            this.setMessage('❌ CHAÎNE COMPROMISE\n\nImpossible d\'ajouter un bloc. La chaîne a été attaquée et est invalide.');
            return;
        }

        const index = this.blockchain.length;
        const timestamp = new Date().toISOString();
        const previousHash = index === 0 ? '0'.repeat(64) : this.blockchain[index - 1].hash;

        this.miningStatus = { mining: true, progress: 0 };
        this.setMessage('⏳ Minage en cours...');
        this.render();

        const blockDataObj = {
            index,
            timestamp,
            data: this.blockData,
            previousHash
        };

        try {
            const { hash, nonce } = await this.proofOfWork(blockDataObj, this.difficulty);

            const newBlock = {
                index,
                timestamp,
                data: this.blockData,
                previousHash,
                hash,
                nonce,
                valid: true,
                tampered: false
            };

            this.blockchain.push(newBlock);
            this.blockData = '';
            this.miningStatus = { mining: false, progress: 0 };
            this.setMessage(`✅ Bloc ${index} miné avec succès!`);
            this.render();
        } catch (error) {
            this.setMessage('❌ Erreur lors du minage');
            this.miningStatus = { mining: false, progress: 0 };
            this.render();
        }
    }

    // Validate Chain
    async validateChain() {
        let isValid = true;
        const errors = [];

        for (let i = 0; i < this.blockchain.length; i++) {
            const currentBlock = this.blockchain[i];

            const recalculatedHash = await this.calculateHash({
                index: currentBlock.index,
                timestamp: currentBlock.timestamp,
                data: currentBlock.data,
                previousHash: currentBlock.previousHash,
                nonce: currentBlock.nonce
            });

            if (recalculatedHash !== currentBlock.hash) {
                isValid = false;
                errors.push(`Bloc ${i}: Hash invalide`);
            }

            const target = '0'.repeat(this.difficulty);
            if (!currentBlock.hash.startsWith(target)) {
                isValid = false;
                errors.push(`Bloc ${i}: PoW invalide`);
            }

            if (i > 0) {
                const expectedPreviousHash = this.blockchain[i - 1].hash;
                if (currentBlock.previousHash !== expectedPreviousHash) {
                    isValid = false;
                    errors.push(`Bloc ${i}: Chaînage rompu`);
                }
            } else {
                if (currentBlock.previousHash !== '0'.repeat(64)) {
                    isValid = false;
                    errors.push(`Bloc 0: Invalid`);
                }
            }
        }

        this.chainValid = isValid;

        if (isValid) {
            this.setMessage('✅ Chaîne valide et sécurisée');
        } else {
            this.setMessage(`❌ ATTAQUE DÉTECTÉE\n${errors.join(' | ')}`);
        }

        this.render();
    }

    // Tamper Block
    tamperBlock(index) {
        this.editingIndex = index;
        this.editValue = this.blockchain[index].data;
        this.render();
    }

    // Save Tamper
    saveTamper(index) {
        this.blockchain = this.blockchain.map((block, i) => {
            if (i === index) {
                return { ...block, data: this.editValue, tampered: true, valid: false };
            }
            if (i > index) {
                return { ...block, valid: false, tampered: true };
            }
            return block;
        });

        this.editingIndex = null;
        this.chainValid = false;

        const affectedBlocks = this.blockchain.length - index - 1;
        this.setMessage(`⚠️ ATTAQUE SIMULÉE\n${affectedBlocks + 1} bloc(s) compromis`);
        this.render();
    }

    // Reset Chain
    resetChain() {
        this.blockchain = [];
        this.blockData = '';
        this.chainValid = true;
        this.miningStatus = { mining: false, progress: 0 };
        this.setMessage('🔄 Chaîne réinitialisée');
        this.render();
        setTimeout(() => {
            this.setMessage('');
            this.render();
        }, 2000);
    }

    setMessage(msg) {
        this.message = msg;
        this.render();
        // Ne pas effacer le message automatiquement s'il y a une attaque
        if (!msg.includes('COMPROMISE')) {
            setTimeout(() => {
                this.message = '';
                this.render();
            }, 4000);
        }
    }

    handleClick(e) {
        const action = e.target.getAttribute('data-action');
        const index = e.target.getAttribute('data-index');

        if (action === 'add-block') this.addBlock();
        if (action === 'validate') this.validateChain();
        if (action === 'reset') this.resetChain();
        if (action === 'tamper') this.tamperBlock(parseInt(index));
        if (action === 'save-tamper') this.saveTamper(parseInt(index));
    }

    handleInput(e) {
        if (e.target.id === 'block-data') this.blockData = e.target.value;
        if (e.target.id === 'difficulty') {
            const val = parseInt(e.target.value) || 1;
            this.difficulty = Math.max(1, Math.min(5, val));
            this.render();
        }
        if (e.target.getAttribute('data-edit-index')) {
            this.editValue = e.target.value;
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && e.target.id === 'block-data' && !this.miningStatus.mining) {
            this.addBlock();
        }
    }

    render() {
        const html = `
            <div class="min-h-screen bg-white text-gray-900 p-8">
                <div class="max-w-6xl mx-auto">
                    <!-- Header -->
                    <div class="mb-12">
                        <h1 class="text-4xl font-bold mb-2">⛓️ Blockchain Sécurisée
                    </h1>
                        <p class="text-gray-400">SHA-256 + Proof of Work</p>
                    </div>

                    <!-- Control Panel -->
                    <div class="bg-gray-200 border border-gray-300 rounded-lg p-8 mb-8">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Données</label>
                                <input 
                                    type="text" 
                                    id="block-data"
                                    value="${this.blockData}"
                                    placeholder="Entrez les données" 
                                    ${this.miningStatus.mining || !this.chainValid ? 'disabled' : ''}
                                    class="w-full px-4 py-2 bg-white text-gray-900 border border-gray-400 rounded-lg focus:border-yellow-500 outline-none transition disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label class="block text-gray-700 font-semibold mb-2">Difficulté</label>
                                <div class="flex gap-2">
                                    <input 
                                        type="number" 
                                        id="difficulty"
                                        value="${this.difficulty}" 
                                        min="1" 
                                        max="5"
                                        ${this.blockchain.length > 0 ? 'disabled' : ''}
                                        class="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-400 rounded-lg focus:border-yellow-500 outline-none transition disabled:opacity-50"
                                    />
                                    <div class="bg-white px-4 py-2 rounded-lg text-gray-600 text-sm font-mono border border-gray-400">
                                        ${'0'.repeat(this.difficulty)}
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-end">
                                <button 
                                    data-action="add-block"
                                    ${this.miningStatus.mining || !this.chainValid ? 'disabled' : ''}
                                    class="w-full ${!this.chainValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'} disabled:opacity-50 text-black font-bold py-2 rounded-lg transition"
                                >
                                    ${this.miningStatus.mining ? '⏳ Minage...' : !this.chainValid ? '🔒 Chaîne Bloquée' : '⛏️ Miner'}
                                </button>
                            </div>
                        </div>

                        ${this.miningStatus.mining ? `
                            <div class="mb-4 p-3 bg-gray-100 border border-gray-400 rounded-lg">
                                <div class="text-gray-700 text-sm mb-2">Tentatives: ${this.miningStatus.progress.toLocaleString()}</div>
                                <div class="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                                    <div class="h-full bg-yellow-500 w-1/3 animate-pulse"></div>
                                </div>
                            </div>
                        ` : ''}

                        <div class="flex gap-3">
                            <button data-action="validate" class="flex-1 bg-white text-black font-semibold py-2 rounded-lg hover:bg-gray-100 transition border border-gray-400">
                                ✓ Valider
                            </button>
                            <button data-action="reset" class="flex-1 bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 transition">
                                🔄 Réinitialiser
                            </button>
                        </div>

                        ${this.message ? `
                            <div class="mt-4 p-3 ${this.message.includes('COMPROMISE') ? 'bg-red-100 border-red-500 border-l-4' : 'bg-gray-100 border-l-4 border-yellow-500'} text-gray-900 text-sm whitespace-pre-line">
                                ${this.message}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Status Bar -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div class="p-4 border rounded-lg ${this.chainValid ? 'bg-gray-100 border-gray-400' : 'bg-red-100 border-red-400'}">
                            <p class="${this.chainValid ? 'text-gray-700' : 'text-red-600'}">
                                ${this.chainValid ? '✓ Chaîne valide' : '✗ Attaque détectée'}
                            </p>
                        </div>
                        <div class="p-4 bg-gray-100 border border-gray-400 rounded-lg">
                            <p class="text-gray-700">${this.blockchain.length} bloc(s)</p>
                        </div>
                    </div>

                    <!-- Blockchain -->
                    <div class="space-y-0">
                        ${this.blockchain.length === 0 ? `
                            <div class="text-center py-16 text-gray-500 bg-gray-100 border border-gray-400 rounded-lg">
                                <p class="text-lg">Aucun bloc. Commencez par miner! ⛏️</p>
                            </div>
                        ` : this.blockchain.map((block, idx) => `
                            <div>
                                <div class="border rounded-lg p-6 transition ${block.tampered ? 'bg-red-100 border-red-400' : 'bg-gray-100 border-gray-400'}">
                                    <div class="flex justify-between items-center mb-4 pb-3 border-b border-gray-300">
                                        <div>
                                            <h3 class="text-gray-900 font-bold">Bloc #${block.index}</h3>
                                            <p class="text-gray-500 text-xs">${block.timestamp.split('T')[1]}</p>
                                        </div>
                                        <span class="${block.tampered ? 'text-red-600' : 'text-gray-600'} font-bold text-sm">
                                            ${block.tampered ? 'COMPROMIS' : 'VALIDE'}
                                        </span>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div class="space-y-3">
                                            <div class="bg-white p-3 rounded-lg border border-gray-400">
                                                <p class="text-gray-500 text-xs font-semibold mb-1">Index</p>
                                                <p class="text-gray-900 font-mono">${block.index}</p>
                                            </div>

                                            <div class="bg-white p-3 rounded-lg border border-gray-400">
                                                <p class="text-gray-500 text-xs font-semibold mb-1">Données</p>
                                                ${this.editingIndex === idx ? `
                                                    <div class="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            data-edit-index="${idx}"
                                                            value="${this.editValue}"
                                                            class="flex-1 px-2 py-1 bg-white text-gray-900 rounded border border-gray-400 text-xs font-mono"
                                                        />
                                                        <button 
                                                            data-action="save-tamper"
                                                            data-index="${idx}"
                                                            class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold"
                                                        >
                                                            OK
                                                        </button>
                                                    </div>
                                                ` : `<p class="text-gray-900 text-sm">${block.data}</p>`}
                                            </div>

                                            <div class="bg-white p-3 rounded-lg border border-gray-400">
                                                <p class="text-gray-500 text-xs font-semibold mb-1">Nonce</p>
                                                <p class="text-gray-900 font-mono text-sm">${block.nonce.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div class="space-y-3">
                                            <div class="bg-white p-3 rounded-lg border border-gray-400">
                                                <p class="text-gray-500 text-xs font-semibold mb-1">Previous Hash</p>
                                                <p class="text-gray-700 font-mono text-xs break-all">${block.previousHash.substring(0, 24)}...</p>
                                            </div>

                                            <div class="p-3 rounded-lg ${block.tampered ? 'bg-red-200 border-red-400' : 'bg-white border-gray-400'} border">
                                                <p class="text-xs font-semibold mb-1 ${block.tampered ? 'text-red-600' : 'text-gray-500'}">Hash</p>
                                                <p class="font-mono text-xs break-all ${block.tampered ? 'text-red-700' : 'text-gray-700'}">${block.hash.substring(0, 24)}...</p>
                                            </div>

                                            <div class="bg-white p-3 rounded-lg border border-gray-400">
                                                <p class="text-gray-500 text-xs font-semibold mb-1">PoW</p>
                                                <p class="text-gray-700 text-xs">${'0'.repeat(this.difficulty)} (Valide)</p>
                                            </div>
                                        </div>
                                    </div>

                                    ${this.editingIndex !== idx ? `
                                        <button 
                                            data-action="tamper"
                                            data-index="${idx}"
                                            class="text-red-600 hover:text-red-700 font-semibold text-sm transition"
                                        >
                                            Simuler attaque
                                        </button>
                                    ` : ''}
                                </div>

                                ${idx < this.blockchain.length - 1 ? `
                                    <div class="flex justify-center py-4">
                                        ${block.tampered ? `
                                            <div class="text-red-600 font-bold text-5xl">✕</div>
                                        ` : `
                                            <div class="text-gray-600 text-3xl">↓</div>
                                        `}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Info -->
                    <div class="mt-12 p-6 bg-gray-100 border border-gray-400 rounded-lg">
                        <p class="text-gray-600 text-sm space-y-2">
                            <div>✓ Minez des blocs avec Proof of Work</div>
                            <div>✓ Validez l'intégrité de la chaîne</div>
                            <div>✓ Simulez une attaque en modifiant un bloc</div>
                            <div>✓ Visualisez la chaîne rompue avec une croix rouge</div>
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;
    }
}

// Initialize the Blockchain Visualizer
new BlockchainVisualizer();
