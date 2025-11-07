import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import GamePageMobile from "./GamePageMobile";

// Font size system: 4 levels
const FONT_SIZES = {
  xs: "12px",   // Level 1: Small text, hints, captions
  sm: "14px",   // Level 2: Body text, small buttons
  md: "16px",   // Level 3: Main body text, buttons
  lg: "24px",   // Level 4: Headings, large titles
};

export default function GamePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [qid, setQid] = useState(1);
  const [question, setQuestion] = useState(null);
  const [image, setImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [isWin, setIsWin] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [wrongAnswers, setWrongAnswers] = useState([]); // Array to store all wrong answers
  const characterId = Number(localStorage.getItem("selectedCharacterId")) || 1;

  const fetchQuestion = useCallback(
    async (id) => {
      const form = new FormData();
      form.append("character_id", characterId);

      const res = await axios.post(`/api/question/${id}`, form);
      setQuestion(res.data.question);
      setImage(res.data.image);
      setAnswer("");
      setIsWin(false);
    },
    [characterId]
  );

  useEffect(() => {
    fetchQuestion(1);
    setHearts(3); // Reset hearts when starting new game
    setWrongAnswers([]);
  }, [fetchQuestion]);

  useEffect(() => {
    setAnswer("");
    setWrongAnswers([]); // Reset wrong answers when question changes
  }, [qid]);

  if (isMobile) {
    return <GamePageMobile />;
  }

  const handleAnswer = async () => {
    const form = new FormData();
    form.append("question_id", qid);
    form.append("answer", answer);
    form.append("character_id", characterId);

    const res = await axios.post("/api/answer", form);

    if (res.data.correct) {
      // If there are still remaining questions
      if (res.data.next_question) {
        setQid(res.data.next_question.id);
        setQuestion(res.data.next_question);
        setImage(res.data.next_image);
      } else {
        // ✅ When the player wins
        setIsWin(true);
        setImage(res.data.next_image); // display final image
        setQuestion(null); // hide question + answer button
      }
      setWrongAnswers([]); // Clear wrong answers on correct
    } else {
      // Wrong answer - decrease hearts and add wrong answer to array
      setWrongAnswers((prev) => {
        // Only add if not already in the array
        if (!prev.includes(answer)) {
          return [...prev, answer];
        }
        return prev;
      });
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setAnswer(""); // Clear selected answer

      // Only show game over if hearts reach 0
      if (newHearts <= 0) {
        setShowGameOver(true);
      }
    }
  };

  // Loading state
  if (!question && !isWin) return <p>Loading...</p>;

  return (
    <div
      style={{
        backgroundColor: "#000000",
        width: "100vw",
        height: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {showGameOver && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#141414",
              border: "1px solid #FF0F87",
              boxShadow: "0 0 20px #FF004C",
              borderRadius: "12px",
              width: "min(90vw, 520px)",
              padding: "24px",
              color: "#F2F2F2",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Game Over
            </div>
            <div style={{ fontSize: "1.6rem", color: "#C0C0C0" }}>
              You've run out of lives! You selected 3 wrong answers. Try again
              later!
            </div>
            <button
              onClick={() => {
                const cameFromAdmin = localStorage.getItem("cameFromAdmin");
                if (cameFromAdmin === "true") {
                  navigate("/admin");
                } else {
                  navigate("/");
                }
              }}
              style={{
                marginTop: "20px",
                padding: "14px 48px",
                borderRadius: "999px",
                border: "1px solid #FF0F87",
                backgroundColor: "#FF0F87",
                color: "#F2F2F2",
                fontSize: FONT_SIZES.md,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#ff2b9e";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(255, 0, 76, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#FF0F87";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(255, 0, 76, 0.4)";
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Hearts Display */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: "28px",
              color: i < hearts ? "#FF0F87" : "rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            ❤️
          </span>
        ))}
      </div>

      <button
        onClick={() => {
          const cameFromAdmin = localStorage.getItem("cameFromAdmin");
          if (cameFromAdmin === "true") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "transparent",
          border: "1px solid rgba(242, 242, 242, 0.12)",
          color: "#F2F2F2",
          padding: "10px 20px",
          borderRadius: "999px",
          cursor: "pointer",
          fontSize: FONT_SIZES.sm,
          fontWeight: "600",
          transition: "all 0.2s",
          backgroundColor: "#FF0F87",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#FF0F87";
          e.target.style.background = "rgba(255, 15, 135, 0.1)";
          e.target.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "rgba(242, 242, 242, 0.12)";
          e.target.style.background = "#FF0F87";
          e.target.style.color = "#F2F2F2";
        }}
      >
        Back to Home
      </button>

      <div
        style={{
          background: "#0a0a1a",
          backgroundColor: "#222",
          borderRadius: "12px",
          padding: "1.4rem",
          textAlign: "center",
          width: "1960px",
          height: "910px",
          color: "#F2F2F2",
        }}
      >
        {image && (
          <img
            src={image}
            alt="question"
            style={{
              maxWidth: "630px",
              height: "630px",
              objectFit: "contain",
              borderRadius: "12px",
              background: "#fff",
            }}
          />
        )}

        {/* If player has won */}
        {isWin ? (
          <div
            style={{
              marginTop: "2rem",
              color: "#C0C0C0",
              fontSize: "3rem",
              fontWeight: "700",
            }}
          >
            You've completed all the questions!
          </div>
        ) : (
          <>
            {/* Question */}
            <div
              style={{
                backgroundColor: "rgba(20,20,20,0.8)",
                color: "#F2F2F2",
                borderRadius: "6px",
                marginTop: "1.05rem",
                padding: "0.56rem",
                fontSize: "1.4rem",
                fontWeight: "600",
                border: "1px solid #FF0F87",
                boxShadow: "0 0 10px #FF004C",
                width: "80vw",
                maxWidth: "80%",
                minWidth: "260px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginLeft: "auto",
                marginRight: "auto",
                textAlign: "center",
              }}
            >
              {question.question}
            </div>

            {/* Options */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.7rem",
                marginTop: "0.84rem",
                justifyItems: "center",
                width: "80vw",
                maxWidth: "80%",
                minWidth: "260px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {question.options.map((opt, i) => {
                const isSelected = answer === opt;
                const isWrong = wrongAnswers.includes(opt);
                const isDisabled = isWrong; // Disable if already marked as wrong
                let backgroundColor = "rgba(20,20,20,0.8)";
                let borderColor = "#F2F2F2";

                if (isWrong) {
                  backgroundColor = "#ff4444"; // Red background for wrong answer
                  borderColor = "#ff4444";
                } else if (isSelected) {
                  backgroundColor = "#FF0F87";
                  borderColor = "#FF0F87";
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isDisabled) {
                        setAnswer(opt);
                      }
                    }}
                    disabled={isDisabled}
                    style={{
                      backgroundColor: backgroundColor,
                      border: `1px solid ${borderColor}`,
                      color: "#F2F2F2",
                      borderRadius: "4px",
                      padding: "0.56rem",
                      fontSize: "1.4rem",
                      fontWeight: "600",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      boxShadow:
                        isSelected || isWrong ? "0 0 10px #FF004C" : undefined,
                      width: "100%", // ensures full column width & neat alignment
                      textAlign: "center", // center text inside button
                      opacity: isDisabled ? 0.6 : 1,
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Submit button */}
            <button
              onClick={handleAnswer}
              disabled={!answer || wrongAnswers.includes(answer)}
              style={{
                marginTop: "16px",
                padding: "14px 48px",
                borderRadius: "999px",
                border: "1px solid #FF0F87",
                backgroundColor: "#FF0F87",
                color: "#F2F2F2",
                fontSize: FONT_SIZES.md,
                fontWeight: "600",
                cursor:
                  !answer || wrongAnswers.includes(answer)
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
                letterSpacing: "0.01em",
                opacity: !answer || wrongAnswers.includes(answer) ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!(!answer || wrongAnswers.includes(answer))) {
                  e.target.style.background = "#ff2b9e";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(255, 0, 76, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(!answer || wrongAnswers.includes(answer))) {
                  e.target.style.background = "#FF0F87";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 16px rgba(255, 0, 76, 0.4)";
                }
              }}
            >
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
