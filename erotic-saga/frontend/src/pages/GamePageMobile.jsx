import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function GamePageMobile() {
  const navigate = useNavigate();
  const [qid, setQid] = useState(1);
  const [question, setQuestion] = useState(null);
  const [image, setImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [isWin, setIsWin] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const characterId = Number(localStorage.getItem("selectedCharacterId")) || 1;
  const [bg, setBg] = useState(null);

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

  // Load default background
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/default-background");
        setBg(res.data?.image || null);
      } catch (e) {
        console.warn("Failed to load default background", e);
      }
    })();
  }, []);

  useEffect(() => {
    fetchQuestion(1);
  }, [fetchQuestion]);

  useEffect(() => {
    setAnswer("");
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
    } else {
      setShowGameOver(true);
    }
  };

  // Loading state
  if (!question && !isWin) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg
            ? `url(${bg})`
            : "linear-gradient(135deg, #FF0F87 0%, #8B008B 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
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
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        background: "#0a0a1a",
        backgroundImage: bg ? `url(${bg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
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
              You selected the wrong answer. Try again later!
            </div>
            <button
              onClick={() => navigate("/")}
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
          onClick={() => navigate("/")}
          style={{
            background: "#FF0F87",
            border: "none",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            fontSize: "14px",
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
            color: "#fff",
            margin: 0,
            flex: 1,
            textAlign: "center",
            fontFamily: "serif",
          }}
        >
          Erotic Saga
        </h1>

        {/* Spacer for alignment */}
        <div style={{ width: "120px" }} />
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
                  marginTop: "1.05rem",
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
                  marginTop: "0.84rem",
                  width: "100%",
                  justifyItems: "center",
                }}
              >
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswer(opt)}
                    style={{
                      backgroundColor:
                        answer === opt ? "#FF0F87" : "rgba(20,20,20,0.8)",
                      border: `1px solid ${
                        answer === opt ? "#FF0F87" : "#F2F2F2"
                      }`,
                      color: "#F2F2F2",
                      borderRadius: "4px",
                      padding: "0.56rem",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow:
                        answer === opt ? "0 0 10px #FF004C" : undefined,
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAnswer}
                style={{
                  marginTop: "16px",
                  padding: "14px 48px",
                  borderRadius: "999px",
                  border: "1px solid #FF0F87",
                  backgroundColor: "#FF0F87",
                  color: "#F2F2F2",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
                  letterSpacing: "0.01em",
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
