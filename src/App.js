import React, { Component } from "react";
import { Navbar, NavbarBrand, Nav, Container, Row, Col } from "reactstrap";
import logo from "./cyber-quest-white.png";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.setUser = this.setUser.bind(this);
    this.state = {
      user: "bengal75",
      balance: 0,
    };
  }
  setUser(username) {
    this.setState({
      user: username,
    });
  }
  render() {
    return (
      <div className="App-root d-flex flex-column justify-content-between">
        <Navbar className="top-nav" color="dark" expand="md">
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
              <Col>
                <h3 className="heading">Chain</h3>
                First column
              </Col>
              <Col>
                <h3 className="heading">Commands</h3>
                Second column
              </Col>
            </Row>
          </Container>
        </div>
        <footer className="bg-dark text-white">
          <Container fluid>
            <Row>
              <Col>
                <h3 className="heading">Verify</h3>
                This is the fixed-height footer
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
    );
  }
}

export default App;
