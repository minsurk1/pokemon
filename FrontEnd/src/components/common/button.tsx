import React, { CSSProperties } from "react";
import styled from "styled-components";
import { AiFillHome } from "react-icons/ai";

// ✅ 공통 props 타입
interface ButtonProps {
  color?: string;
  bgColor?: string;
  textColor?: string;
  background?: string;
  borderColor?: string;
  border?: string;
  borderRadius?: string;
  height?: string;
  width?: string;
  padding?: string;
  marginTop?: string;
  marginBottom?: string;
  marginRight?: string;
  marginLeft?: string;
  boxShadow?: string;
  hoverOpacity?: string;
  transform?: string;
  transition?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  fontSize?: string;
  cursor?: string;
  style?: CSSProperties;
  disabled?: boolean; // ✅ 추가
}

// =========================
// 🟢 HomeButton 스타일
// =========================
const StyleHomeButton = styled.button<ButtonProps>`
  margin-left: auto;
  background: ${(props) => props.bgColor || "#f000000"};
  ${(props) =>
    props.border
      ? `border: 2px solid ${props.borderColor || "#9c27b0"};`
      : "border: none;"};
  border-radius: ${(props) => props.borderRadius || "0"};
  cursor: pointer;
  font-family: "Do hyeon", serif;
  font-size: 1rem;
  overflow: hidden;
  height: ${(props) => props.height || "50px"};
  width: ${(props) => props.width || "50px"};
  margin-top: ${(props) => props.marginTop || "0px"};
  margin-bottom: ${(props) => props.marginBottom || "0px"};
  margin-right: ${(props) => props.marginRight || "0px"};
  margin-left: ${(props) => props.marginLeft || "0px"};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: ${(props) => props.hoverOpacity || 0.8};
    transform: ${(props) => props.transform || "scale(1.03)"};
    transition: ${(props) => props.transition || "all 0.2s ease-in-out"};
  }
`;

// =========================
// 🟢 MenuButton 스타일
// =========================
const StyleMenuButton = styled.button<ButtonProps>`
  font-family: "Do hyeon", serif;
  margin-top: ${(props) => props.marginTop || "0rem"};
  margin-bottom: ${(props) => props.marginBottom || "1.5rem"};
  padding: ${(props) => props.padding || "1rem"};
  font-size: ${(props) => props.fontSize || "1.3rem"};
  color: ${(props) => props.color || "#fff"};
  background: ${(props) => props.background || "transparent"};
  border: ${(props) => props.border || "none"};
  border-radius: ${(props) => props.borderRadius || "15px"};
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  cursor: ${(props) => (props.disabled ? "not-allowed" : props.cursor || "pointer")};
  box-shadow: inset 0 0 6px var(--theme-accent-color);
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

  &:hover {
    background: ${(props) =>
      props.disabled ? "transparent" : "var(--theme-hover-color)"};
    opacity: ${(props) => (props.hoverOpacity || 1)};
    transform: ${(props) => (props.disabled ? "none" : props.transform || "scale(1.05)")};
    transition: ${(props) => props.transition || "all 0.3s ease-in-out"};
    border-radius: ${(props) => props.borderRadius || "15px"};
    box-shadow: ${(props) =>
      props.disabled
        ? "inset 0 0 6px var(--theme-accent-color)"
        : "0 4px 12px rgba(0, 0, 0, 0.5)"};
  }
`;

// =========================
// 🟣 HomeButton 컴포넌트
// =========================
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
  onClick,
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

// =========================
// 🟣 MenuButton 컴포넌트
// =========================
export function MenuButton({
  children,
  background,
  marginBottom,
  marginTop,
  padding,
  color,
  border,
  borderRadius,
  hoverOpacity,
  transform,
  transition,
  fontSize,
  boxShadow,
  width,
  cursor,
  onClick,
  disabled = false, // ✅ 추가
}: ButtonProps) {
  return (
    <StyleMenuButton
      width={width}
      background={background}
      marginBottom={marginBottom}
      marginTop={marginTop}
      boxShadow={boxShadow}
      color={color}
      padding={padding}
      cursor={cursor}
      border={border}
      borderRadius={borderRadius}
      hoverOpacity={hoverOpacity}
      transform={transform}
      transition={transition}
      fontSize={fontSize}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      {children}
    </StyleMenuButton>
  );
}
