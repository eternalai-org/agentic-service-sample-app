import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Font size system: 4 levels
const FONT_SIZES = {
  xs: "12px",   // Level 1: Small text, hints, captions
  sm: "14px",   // Level 2: Body text, small buttons
  md: "16px",   // Level 3: Main body text, buttons
  lg: "24px",   // Level 4: Headings, large titles
};

export default function GamePageMobile() {
  const navigate = useNavigate();
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
        // When the player wins
        setIsWin(true);
        setImage(res.data.next_image);
        setQuestion(null);
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
  if (!question && !isWin) {
    return (
      <div
        style={{
          backgroundColor: "#000000",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F2F2F2",
        }}
      >
        <p style={{ fontSize: "1.2rem" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#000000",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Game Over Modal */}
      {showGameOver && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#141414",
              border: "1px solid #FF0F87",
              boxShadow: "0 0 20px #FF004C",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "400px",
              padding: "24px",
              color: "#F2F2F2",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Game Over
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                color: "#C0C0C0",
                marginBottom: "20px",
              }}
            >
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
                padding: "14px 48px",
                borderRadius: "999px",
                border: "1px solid #FF0F87",
                backgroundColor: "#FF0F87",
                color: "#F2F2F2",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
                width: "100%",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Back to Home Button */}
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
            background: "#FF0F87",
            border: "none",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            fontSize: FONT_SIZES.sm,
            fontWeight: "600",
            boxShadow: "0 2px 8px rgba(255, 15, 135, 0.4)",
            transition: "all 0.2s",
          }}
        >
          Back to Home
        </button>

        {/* Title */}
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: 0,
            flex: 1,
            textAlign: "center",
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            background: "linear-gradient(90deg, #9D4EDD 0%, #FF0F87 50%, #FF6B35 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Erotic Saga
        </h1>

        {/* Hearts Display */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            width: "120px",
            justifyContent: "flex-end",
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: "20px",
                color: i < hearts ? "#FF0F87" : "rgba(255, 255, 255, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem",
          gap: "1.5rem",
          maxWidth: "100%",
        }}
      >
        {/* Image Area */}
        {image && (
          <img
            src={image}
            alt="question"
            style={{
              width: "100%",
              maxWidth: "90%",
              height: "auto",
              maxHeight: "60vh",
              objectFit: "contain",
              borderRadius: "12px",
              background: "#fff",
              display: "block",
            }}
          />
        )}

        {/* If player has won */}
        {isWin ? (
          <div
            style={{
              marginTop: "2rem",
              color: "#fff",
              fontSize: "1.8rem",
              fontWeight: "700",
              textAlign: "center",
              padding: "2rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}
          >
            You've completed all the questions!
          </div>
        ) : (
          question && (
            <>
              {/* Question Box */}
              <div
                style={{
                  backgroundColor: "rgba(20,20,20,0.8)",
                  color: "#F2F2F2",
                  borderRadius: "6px",
                  marginTop: "1rem",
                  padding: "0.56rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  border: "1px solid #FF0F87",
                  boxShadow: "0 0 10px #FF004C",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                {question.question}
              </div>

              {/* Options Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.7rem",
                  marginTop: "0rem",
                  width: "100%",
                  justifyItems: "center",
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
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow:
                          isSelected || isWrong
                            ? "0 0 10px #FF004C"
                            : undefined,
                        width: "100%",
                        textAlign: "center",
                        opacity: isDisabled ? 0.6 : 1,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAnswer}
                disabled={!answer || wrongAnswers.includes(answer)}
                style={{
                  marginTop: "1px",
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
              >
                Submit
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}
