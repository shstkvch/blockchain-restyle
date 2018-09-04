import React, { Component } from "react";
import { Navbar, NavbarBrand, Nav, Container, Row, Col, Button } from "reactstrap";
import logo from "./cyber-quest-white.png";
import "./App.css";

const api = "https://api.blockchain.bengalloway.io";

var sha256 = function sha256(ascii) {
	function rightRotate(value, amount) {
		return (value >>> amount) | (value << (32 - amount));
	}

	var mathPow = Math.pow;
	var maxWord = mathPow(2, 32);
	var lengthProperty = "length";
	var i, j; // Used as a counter across the whole file
	var result = "";

	var words = [];
	var asciiBitLength = ascii[lengthProperty] * 8;

	//* caching results is optional - remove/add slash from front of this line to toggle
	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
	// (we actually calculate the first 64, but extra values are just ignored)
	var hash = (sha256.h = sha256.h || []);
	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
	var k = (sha256.k = sha256.k || []);
	var primeCounter = k[lengthProperty];
	/*/
	var hash = [], k = [];
	var primeCounter = 0;
	//*/

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
			k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
		}
	}

	ascii += "\x80"; // Append '1' bit (plus zero padding)
	while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00"; // More zero padding
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i);
		if (j >> 8) return; // ASCII check: only accept characters in range 0-255
		words[i >> 2] |= j << (((3 - i) % 4) * 8);
	}
	words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
	words[words[lengthProperty]] = asciiBitLength;

	// process each chunk
	for (j = 0; j < words[lengthProperty]; ) {
		var w = words.slice(j, (j += 16)); // The message is expanded into 64 words as part of the iteration
		var oldHash = hash;
		// This is now the "working hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8);

		for (i = 0; i < 64; i++) {
			// var i2 = i + j;
			// Expand the message into 64 words
			// Used below if
			var w15 = w[i - 15],
				w2 = w[i - 2];

			// Iterate
			var a = hash[0],
				e = hash[4];
			var temp1 =
				hash[7] +
				(rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
				((e & hash[5]) ^ (~e & hash[6])) + // ch
				k[i] +
				// Expand the message schedule if needed
				(w[i] =
					i < 16
						? w[i]
						: (w[i - 16] +
						  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
								w[i - 7] +
								(rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | // s1
						  0);
			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
			var temp2 =
				(rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
				((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

			hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
			hash[4] = (hash[4] + temp1) | 0;
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0;
		}
	}

	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i] >> (j * 8)) & 255;
			result += (b < 16 ? 0 : "") + b.toString(16);
		}
	}
	return result;
};

class App extends Component {
	constructor(props) {
		super(props);
		this.setUser = this.setUser.bind(this);
		this.fetchChain = this.fetchChain.bind(this);
		this.fetchTransactions = this.fetchTransactions.bind(this);
		this.mine = this.mine.bind(this);
		this.send = this.send.bind(this);

		this.state = {
			user: "test",
			balance: 0,
			chain: { chain: [] },
			transactions: { unconfirmed_transactions: [] },
			mineStatus: null,
			sendStatus: null,
			sendAmount: "",
			sendRecipient: "",
			verifyPreviousProof: "previous_proof",
			verifyProof: "proof",
			verifyPreviousHash: "previous_hash",
			verifyProofHash: "",
		};
	}
	promiseState = async (state) => new Promise((resolve) => this.setState(state, resolve));

	setUser(username) {
		this.setState({
			user: username,
		});
	}
	handleAmountChange = (e) => {
		this.setState({ sendAmount: e.target.value });
	};
	handleRecipientChange = (e) => {
		this.setState({ sendRecipient: e.target.value });
	};
	handleVerifyChange = () => {
		Promise.all([
			this.promiseState({ verifyPreviousProof: document.getElementById("verifyPreviousProof").value }),
			this.promiseState({ verifyProof: document.getElementById("verifyProof").value }),
			this.promiseState({ verifyPreviousHash: document.getElementById("verifyPreviousHash").value }),
		]).then(() => {
			const verifyProofHash = sha256(
				this.state.verifyPreviousProof + this.state.verifyProof + this.state.verifyPreviousHash
			);
			this.setState({ verifyProofHash });
		});
	};

	fetchChain() {
		fetch(`${api}/chain`)
			.then((response) => response.json())
			.then((chain) => this.setState({ chain }))
			.then(() => {
				const divRef = document.getElementById("chain-pre");
				divRef.scrollTop = divRef.scrollHeight;
			});
	}
	fetchTransactions() {
		fetch(`${api}/transactions`)
			.then((response) => response.json())
			.then((transactions) => this.setState({ transactions }));
	}
	mine() {
		fetch(`${api}/mine`, {
			method: "POST",
			body: JSON.stringify({ requester: this.state.user }),
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((mineStatus) => this.setState({ mineStatus }))
			.then(() => {
				this.fetchChain();
				this.fetchTransactions();
			});
	}
	send() {
		fetch(`${api}/transactions/new`, {
			method: "POST",
			body: JSON.stringify({
				sender: this.state.user,
				recipient: this.state.sendRecipient,
				amount: Number(this.state.sendAmount),
			}),
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((sendStatus) => this.setState({ sendStatus }))
			.then(() => this.fetchTransactions());
	}

	render() {
		return (
			<div className="App-root d-flex flex-column justify-content-between">
				<Navbar className="header" color="dark" expand="md">
					<NavbarBrand className="heading text-white" href="/">
						<img src={logo} className="App-logo" alt="logo" />
						&nbsp;CyberCoin
					</NavbarBrand>
					<Nav className="ml-auto pr-3 text-white" navbar>
						<span className="heading">Balance:</span> {this.state.balance}
					</Nav>
					<Nav className="ml-auto pr-3 text-white" navbar>
						<span className="heading">User:</span> {this.state.user}
					</Nav>
				</Navbar>
				<div className="main-content flex-grow-1 flex-shrink-0">
					<Container fluid>
						<Row>
							<Col id="chain-display" sm="7" className="column-height py-3">
								<Container fluid>
									<Row>
										<Col sm="12" className="px-1">
											<h3 className="heading">Chain</h3>
										</Col>
									</Row>
									<Row>
										<Col id="chain-pre" sm="12" className="panel-height column-overflow border">
											<pre>{JSON.stringify(this.state.chain.chain, null, 2)}</pre>
										</Col>
									</Row>
									<Row>
										<Col sm="12" className="py-3 px-0">
											<Button color="success" onClick={this.fetchChain}>
												Update the chain
											</Button>
										</Col>
									</Row>
								</Container>
							</Col>

							<Col sm="5" className="column-height column-overflow p-3">
								<h3 className="heading">Commands</h3>

								<h4>Send Some Coins</h4>
								<label htmlFor="amount">Amount:&nbsp;</label>
								<input type="text" id="amount" value={this.state.sendAmount} onChange={this.handleAmountChange} />
								<br />
								<label htmlFor="recipient">To:&nbsp;</label>
								<input
									type="text"
									id="recipient"
									value={this.state.sendRecipient}
									onChange={this.handleRecipientChange}
								/>
								<br />
								<Button color="success" onClick={this.send}>
									Send
								</Button>
								<pre>{this.state.sendStatus ? JSON.stringify(this.state.sendStatus, null, 2) : ""}</pre>
								<hr />
								<h4>Unconfirmed Transactions</h4>
								<pre>{JSON.stringify(this.state.transactions.unconfirmed_transactions, null, 2)}</pre>
								<Button color="success" onClick={this.fetchTransactions}>
									Update the transaction list
								</Button>
								<hr />
								<h4>Mine a Block</h4>
								<Button color="success" onClick={this.mine}>
									Mine!
								</Button>
								<pre>{this.state.mineStatus ? JSON.stringify(this.state.mineStatus, null, 2) : ""}</pre>
							</Col>
						</Row>
					</Container>
				</div>
				<div className="footer p-3 bg-dark text-white">
					<Container fluid>
						<Row>
							<Col>
								<h3 className="heading">Verify</h3>
								SHA256 hash of (&nbsp;
								<input
									type="text"
									id="verifyPreviousProof"
									className="mono-font"
									value={this.state.verifyPreviousProof}
									onInput={this.handleVerifyChange}
								/>
								&nbsp;+&nbsp;
								<input
									type="text"
									id="verifyProof"
									className="mono-font"
									value={this.state.verifyProof}
									onInput={this.handleVerifyChange}
								/>
								&nbsp;+&nbsp;
								<input
									type="text"
									id="verifyPreviousHash"
									className="mono-font"
									value={this.state.verifyPreviousHash}
									onInput={this.handleVerifyChange}
									size={70}
								/>
								&nbsp;) =&nbsp;
								<input type="text" className="mono-font" disabled value={this.state.verifyProofHash} size={70} />
							</Col>
						</Row>
					</Container>
				</div>
			</div>
		);
	}
}

export default App;
