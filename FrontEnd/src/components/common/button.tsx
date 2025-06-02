import React, { Children } from "react";
import styled from "styled-components";
import { AiFillHome } from "react-icons/ai"; 
import "./theme.css"

interface ButtonProps {
    color?:string
    bgColor?: string
    textColor?: string
    background?: string
    borderColor?: string
    border?: string
    borderRadius?: string
    height?: string
    width?: string
    padding?:string
    marginTop?: string
    marginBottom?: string
    marginRight?: string
    marginLeft?: string
    hoverOpacity?: string
    transform?: string
    transition?: string 
    onClick?: () => void;
    children?: React.ReactNode;
}

const StyleHomeButton = styled.button<ButtonProps>`
    margin-left: auto;
    background: ${(props) => props.bgColor || "#f000000"};
  ${(props) =>
    props.border
      ? `border: 2px solid ${props.borderColor || '#9c27b0'};`
      : 'border: none;'};
    border-radius: ${(props)=>props.borderRadius||"0"};
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
    
     &:hover {
    opacity: ${(props)=>props.hoverOpacity || 0.8};
    transform: ${(props)=>props.transform || "scale(1.03)"}; 
    transition: ${(props)=>props.transition||"all 0.2s ease-in-out"};
  }
`;
const StyleMenuButton = styled.button<ButtonProps>`
    font-family: "Do hyeon",serif;
    margin-bottom:${(props)=>props.marginBottom || "1.5rem"};
    padding:${(props)=>props.padding || "1rem"};
    font-size: 1.3rem;
    color:${(props)=>props.color ||"#fff"};
    background: ${(props)=>props.background ||   "var(--theme-color)"};
    border: ${(props)=>props.border || "none"};
    border-radius:${(props)=>props.borderRadius||"15px"};
    box-shadow:  0 4px 6px rgba(0, 0, 0, 0.15);
    transition: background 0.3s ease,transform 0.3s ease;
    cursor: pointer;
    &:hover {
    background: var(--theme-hover-color);
    opacity: ${(props)=>props.hoverOpacity || 0.8};
    transform: ${(props)=>props.transform || "scale(1.03)"}; 
    transition: ${(props)=>props.transition||"all 0.2s ease-in-out"};
`
export function HomeButton({
    bgColor,
    textColor,
    borderColor,
    border,
    borderRadius,
    height,
    width,
    marginTop,
    marginBottom,
    marginRight,
    marginLeft,
    hoverOpacity,
    transform,
    transition,
    onClick
}: ButtonProps) {
    return (
      <StyleHomeButton
        bgColor={bgColor}
        textColor={textColor}
        borderColor={borderColor}
        borderRadius={borderRadius}
        border={border}
        height={height}
        width={width}
        marginTop={marginTop}
        marginBottom={marginBottom}
        marginRight={marginRight}
        marginLeft={marginLeft}
        hoverOpacity={hoverOpacity}  
        transform={transform}
        transition={transition}
        onClick={onClick}
      >
       <AiFillHome size={22} color={textColor || "black"} /> 
       </StyleHomeButton>
    );
  }

export function MenuButton({
  children,
  background,
  marginBottom,
  padding,
  color,
  border,
  borderRadius,
  hoverOpacity,
  transform,
  transition,
  onClick
}: ButtonProps){
  return(
    <StyleMenuButton
    background={background}
    marginBottom={marginBottom}
    color={color}
    padding={padding}
    border={border}
    borderRadius={borderRadius}
    hoverOpacity={hoverOpacity}
    transform={transform}
    transition={transition}
    onClick={onClick}
    >
   {children}
    </StyleMenuButton>   
  );
}