import React from "react";
import styled from "styled-components";

interface MessageBoxProps {
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  closeborderColor?: string;
}

interface MessageCloseProps {
  closeborderColor?: string;
}

const Box = styled.div<MessageBoxProps>`
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: ${(props) => (props.bgColor?.startsWith("linear-gradient") ? props.bgColor : props.bgColor || "#ffffff")};
  border: 2px solid ${(props) => props.borderColor || "#9c27b0"};
  padding: 15px 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: 0.7;
  text-align: center;
  animation: slideDown 0.5s ease-out;
  min-width: 300px;
  font-family: "Do Hyeon", sans-serif;
`;

const CloseButton = styled.button<MessageCloseProps>`
  position: absolute;
  top: 5px;
  right: 5px;
  border-radius: 50%;
  background: none;
  border: solid 2px ${(props) => props.closeborderColor || "#9c27b0"};
  font-size: 16px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  &:hover {
    opacity: 1;
    transform: scale(1.1);
    transition: transform 0.4s;
  }
`;

export default function MessageBox({
  bgColor = "#ffffff",
  textColor = "#333",
  borderColor = "#9c27b0",
  closeborderColor = "#000000",
  children,
  onClose,
}: React.PropsWithChildren<MessageBoxProps & { onClose?: () => void }>) {
  return (
    <Box bgColor={bgColor} borderColor={borderColor} textColor={textColor}>
      <p
        style={{
          color: textColor,
          fontSize: "1.2rem",
          fontWeight: "bold",
          marginBottom: "15px",
        }}
      >
        {children}
      </p>
      {onClose && (
        <CloseButton onClick={onClose} closeborderColor={closeborderColor}>
          ×
        </CloseButton>
      )}
    </Box>
  );
}
