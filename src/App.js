import React, { Component } from "react";
import { Navbar, NavbarBrand, Nav, Container, Row, Col, Button } from "reactstrap";
import sha256 from "./sha256";
import logo from "./cyber-quest-white.png";
import "./App.css";

const api = "https://api.blockchain.bengalloway.io";

class App extends Component {
    constructor(props) {
        super(props);
        this.setUser = this.setUser.bind(this);
        this.fetchChain = this.fetchChain.bind(this);
        this.fetchTransactions = this.fetchTransactions.bind(this);
        this.mine = this.mine.bind(this);
        this.send = this.send.bind(this);
        this.recalculateBalance = this.recalculateBalance.bind(this);

        this.state = {
            user: null,
            balance: 0,
            chain: { chain: [] },
            transactions: { unconfirmed_transactions: [] },
            mineStatus: null,
            sendStatus: null,
            sendAmount: "",
            sendRecipient: "",
            verifyPreviousProof: "",
            verifyProof: "",
            verifyPreviousHash: "",
            verifyProofHash: sha256(""),
        };
    }
    promiseState = async (state) => new Promise((resolve) => this.setState(state, resolve));

    recalculateBalance() {
        const chain = this.state.chain.chain;
        const transactionList = chain.reduce((accumulator, block) => {
            return [...accumulator, ...block.transactions];
        }, []);
        const creditTransactions = transactionList.filter((transaction) => transaction.recipient === this.state.user);
        const debitTransactions = transactionList.filter((transaction) => transaction.sender === this.state.user);
        const creditAmount = creditTransactions.reduce(
            (accumulator, transaction) => accumulator + transaction.amount,
            0
        );
        const debitAmount = debitTransactions.reduce((accumulator, transaction) => accumulator + transaction.amount, 0);
        const balance = creditAmount - debitAmount;
        this.setState({ balance });
    }

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
            })
            .then(this.recalculateBalance);
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
        if (!(Number(this.state.sendAmount) > 0)) return false;
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
                                        <Col sm="12" className="px-1 column-chrome">
                                            <h3 className="heading">Chain</h3>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col
                                            id="chain-pre"
                                            sm="12"
                                            className="panel-height column-overflow border px-0"
                                        >
                                            <pre className="my-0">
                                                {JSON.stringify(this.state.chain.chain, null, 2)}
                                            </pre>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm="12" className="py-3 px-0 column-chrome">
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
                                <input
                                    type="text"
                                    id="amount"
                                    value={this.state.sendAmount}
                                    onChange={this.handleAmountChange}
                                />
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
                <div className="footer px-0 pt-3 pb-1 bg-dark text-white">
                    <Container fluid>
                        <Row>
                            <Col sm="1" className="d-flex align-items-center">
                                <h6 className="heading">Verify</h6>
                            </Col>
                            <Col sm="11" className="d-flex align-items-center">
                                <Container fluid>
                                    <Row>
                                        <Col sm="12">
                                            SHA256 hash of (&nbsp;
                                            <input
                                                type="text"
                                                id="verifyPreviousProof"
                                                className="mono-font"
                                                value={this.state.verifyPreviousProof}
                                                placeholder={"previous_proof"}
                                                onInput={this.handleVerifyChange}
                                                size={15}
                                            />
                                            &nbsp;+&nbsp;
                                            <input
                                                type="text"
                                                id="verifyProof"
                                                className="mono-font"
                                                value={this.state.verifyProof}
                                                placeholder={"proof"}
                                                onInput={this.handleVerifyChange}
                                                size={15}
                                            />
                                            &nbsp;+&nbsp;
                                            <input
                                                type="text"
                                                id="verifyPreviousHash"
                                                className="mono-font"
                                                value={this.state.verifyPreviousHash}
                                                placeholder={"previous_hash"}
                                                onInput={this.handleVerifyChange}
                                                size={70}
                                            />
                                            &nbsp;)
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm="12" className="py-3">
                                            =&nbsp;
                                            <input
                                                type="text"
                                                className="mono-font"
                                                disabled
                                                value={this.state.verifyProofHash}
                                                size={70}
                                            />
                                        </Col>
                                    </Row>
                                </Container>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        );
    }
}

export default App;
