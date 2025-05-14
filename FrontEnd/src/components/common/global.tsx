import React from "react"
import styled from "styled-components"

interface BackgroundVideoProps {
  src: string
  zIndex?: number
  opacity?: number
  objectPosition?: string
}

const Video = styled.video<{ zIndex?: number; opacity?: number; objectPosition?: string }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: ${(props) => props.objectPosition || "center center"}; // 비디오 위치 조정
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: ${(props) => props.zIndex ?? -1};
  opacity: ${(props) => props.opacity ?? 1};
`

export default function BackgroundVideo({
  src,
  zIndex = -1,
  opacity = 1,
  objectPosition = "center center", 
}: BackgroundVideoProps) {
  return (
    <Video autoPlay muted loop zIndex={zIndex} opacity={opacity} objectPosition={objectPosition}>
      <source src={src} type="video/mp4" />
    </Video>
  )
}
