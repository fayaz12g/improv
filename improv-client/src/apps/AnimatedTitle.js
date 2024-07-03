import React, { useEffect, useState, useMemo } from "react";
import { useSpring, animated, config } from "react-spring";
import styled, { keyframes } from "styled-components";
import "./AnimatedStyle.css";
import eyes from "../image/eyes/eyes.png";
import eyesLeft from "../image/eyes/eyesleft.png";
import eyesRight from "../image/eyes/eyesright.png";

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

const colors = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet',
  'cyan', 'magenta', 'lime', 'pink', 'teal', 'lavender', 'brown'
];

const TitleChar = styled(animated.span)`
  display: inline-block;
  margin: 0 2px;
  font-family: 'Alloy Ink', 'Patrick Hand', 'Comic Sans MS', cursive, sans-serif;
  font-size: 10rem;
  color: ${(props) => props.color}; 
  -webkit-text-stroke: 6px white; 
  position: relative;
  overflow: hidden; 
  animation: ${(props) => (props.bounce ? bounce : "none")} 1s infinite;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1; 

  /* Gradient overlay */
  background: ${(props) => props.color};
  -webkit-background-clip: text;
  -webkit-text-fill-color: linear-gradient(to bottom right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
`;

const EyeImage = styled.img`
  width: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
`;

const TitleScreen = () => {
  const [bouncingLetters, setBouncingLetters] = useState(new Set());
  const [showEyes, setShowEyes] = useState(false);
  const [eyePosition, setEyePosition] = useState(eyes);

  const getRandomInt = (max) => Math.floor(Math.random() * max);

  useEffect(() => {
    const bounceInterval = setInterval(() => {
      const newSet = new Set();
      newSet.add(getRandomInt(11));
      setBouncingLetters(newSet);
    }, 2000);

    const eyesInterval = setInterval(() => {
      setShowEyes(true);
      setEyePosition(eyes);
      setTimeout(() => {
        setEyePosition(eyesLeft);
        setTimeout(() => {
          setEyePosition(eyesRight);
          setTimeout(() => {
            setShowEyes(false);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 10000);

    return () => {
      clearInterval(bounceInterval);
      clearInterval(eyesInterval);
    };
  }, []);

// In your component
const titleLetters = "IMPROViMANIA";

// Create an array of indices
const indices = [...Array(titleLetters.length).keys()];

// Create a new component for each letter
const AnimatedLetter = ({ char, index, color, shade, bounce }) => {
  const springProps = useSpring({
    from: { transform: "scale(0) rotate(-180deg)" },
    to: { transform: "scale(1) rotate(0deg)" },
    config: config.wobbly,
    delay: index * 100
  });

  return (
    <TitleChar
      style={springProps}
      color={color}
      shade={shade}
      bounce={bounce}
    >
      {char}
    </TitleChar>
  );
};


const animatedTitle = useMemo(() => {
  return titleLetters.split('').map((char, index) => {
    const isBouncing = bouncingLetters.has(index);
    const gradientColors = {
      color: colors[index % colors.length],
      shade: `${colors[index % colors.length]}80`
    };

    return (
      <AnimatedLetter
        key={index}
        char={char}
        index={index}
        {...gradientColors}
        bounce={isBouncing}
      />
    );
  });
}, [bouncingLetters, colors]);




  return (
    <div className="titleContainer">
      <div className="animatedTitle">{animatedTitle}</div>
    </div>
  );
};

const AnimatedTitle = () => {
  return (
    <div className="AnimatedTitle">
      <TitleScreen />
    </div>
  );
};

export default AnimatedTitle;