import React from "react";
import PulseLoader from "react-spinners/PulseLoader";
import GridLoader from "react-spinners/GridLoader";

// The specified colour is Bootstrap green
const Loader = (props) => {
    if (props.mine) return <GridLoader sizeUnit={"px"} size={38} color={"#28a745"} />;
    return <PulseLoader sizeUnit={"px"} size={38} color={"#28a745"} />;
};

export default Loader;
