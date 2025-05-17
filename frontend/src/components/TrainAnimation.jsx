import React from "react";
import "../styles/TrainAnimation.css";
import trainImg from "../assets/train.svg";

export default function TrainAnimation({ onEnd }) {
  return (
    <div className="train-animation-container">
      <div className="train-track">
        <img
          src={trainImg}
          alt="Fast train"
          className="train train-image"
          onAnimationEnd={onEnd}
        />
      </div>
    </div>
  );
} 