import React from "react";
import { Spring } from "react-spring";

class AnimateBalance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            animating: false,
        };
    }

    animatingStyle = {
        fontSize: "2rem",
        color: "#ffd700",
    };
    staticStyle = {
        fontSize: "1rem",
        color: "#ffffff",
    };

    render() {
        return (
            <Spring
                from={{ number: 0 }}
                to={{ number: `${this.props.value}` }}
                config={{ tension: 280, friction: 120, restDisplacementThreshold: 0.1 }}
                onStart={() => {
                    this.setState({ animating: true });
                }}
                onRest={() => {
                    this.setState({ animating: false });
                }}
            >
                {({ number }) => (
                    <span style={this.state.animating ? this.animatingStyle : this.staticStyle}>
                        {number.toFixed(0)}
                    </span>
                )}
            </Spring>
        );
    }
}

export default AnimateBalance;
