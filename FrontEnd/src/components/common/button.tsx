import React from "react";
import styled from "styled-components";
import { AiFillHome } from "react-icons/ai"; 

interface ButtonProps {
    bgColor?: string
    textColor?: string
    borderColor?: string
    border?: string
    height?: string
    width?: string
    marginTop?: string
    marginBottom?: string
    marginRight?: string
    marginLeft?: string
    onClick?: () => void;
    children?: React.ReactNode;
}

const HomeButton = styled.div<ButtonProps>`
    margin-left: auto;
    background: ${(props) => props.bgColor || "#f000000"};
  ${(props) =>
    props.border
      ? `border: 2px solid ${props.borderColor || '#9c27b0'};`
      : 'border: none;'};
    border-radius: 50%;
    cursor: pointer;
    font-family: "Do hyeon", serif;
    font-size: 1rem;
    overflow: hidden;
    height:${(props)=>props.height || "50px"};
    width: ${(props)=>props.width || "50px"};
    margin-top:${(props)=>props.marginTop || "0px"};
    margin-bottom:${(props)=>props.marginBottom || "0px"};
    margin-right:${(props)=>props.marginRight || "0px"};
    margin-left:${(props)=>props.marginLeft || "0px"};
    display: flex;
    align-items: center;
    justify-content: center;
`
export default function Button({
    bgColor,
    textColor,
    borderColor,
    border,
    height,
    width,
    marginTop,
    marginBottom,
    marginRight,
    marginLeft,
    onClick
}: ButtonProps) {
    return (
      <HomeButton
        bgColor={bgColor}
        textColor={textColor}
        borderColor={borderColor}
        border={border}
        height={height}
        width={width}
        marginTop={marginTop}
        marginBottom={marginBottom}
        marginRight={marginRight}
        marginLeft={marginLeft}
        onClick={onClick}
      >
       <AiFillHome size={22} color={textColor || "black"} /> 
       </HomeButton>
    );
  }