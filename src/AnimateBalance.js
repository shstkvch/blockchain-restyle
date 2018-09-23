import React from "react";
import AnimateOnChange from "react-animate-on-change";

const AnimateBalance = (props) => (
    <AnimateOnChange baseClassName="" animationClassName="pulse" animate={props.value}>
        {props.value}
    </AnimateOnChange>
);

export default AnimateBalance;
