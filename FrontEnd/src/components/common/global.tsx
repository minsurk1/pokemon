import React from "react"
import styled from "styled-components"

interface BackgroundVideoProps {
    src: string
    zIndex?: number
    opacity?: number
  }
  
  const Video = styled.video<{ zIndex?: number; opacity?: number }>`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: ${(props) => props.zIndex ?? -1};
    opacity: ${(props) => props.opacity ?? 1};
  `
  
  export default function BackgroundVideo({
    src,
    zIndex = -1,
    opacity = 1,
  }: BackgroundVideoProps) {
    return (
      <Video autoPlay muted loop zIndex={zIndex} opacity={opacity}>
        <source src={src} type="video/mp4" />
      </Video>
    )
  }
  