import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import HomePageMobile from "./HomePageMobile";

export default function HomePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [bg, setBg] = useState(null);
  const charactersPerPage = 5;

  // Load default background
  React.useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/default-background");
        setBg(res.data?.image || null);
      } catch (e) {
        console.warn("Failed to load default background", e);
      }
    })();
  }, []);

  // Auto-load characters on mount
  const handleStartGame = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/characters");
      console.log("Characters:", res.data);

      if (Array.isArray(res.data) && res.data.length > 0) {
        setCharacters(res.data);
      }
    } catch (err) {
      console.error("Error fetching characters:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isMobile) {
      handleStartGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMobile) {
    return <HomePageMobile />;
  }

  // ✅ Verify admin password
  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("password", password);
      const res = await axios.post("/api/verify-password", form);
      if (res.data.valid) {
        navigate("/upload");
      }
    } catch (err) {
      console.error("Error verifying password:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (charId) => {
    // Save character ID for GamePage to use
    localStorage.setItem("selectedCharacterId", charId);
    navigate("/game");
  };

  // Calculate pagination
  const totalPages = Math.ceil(characters.length / charactersPerPage);
  const startIndex = currentPage * charactersPerPage;
  const endIndex = startIndex + charactersPerPage;
  const currentCharacters = characters.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // ✅ Main interface
  return (
    <div
      style={{
        backgroundImage: bg ? `url(${bg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#F2F2F2",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* Top Banner Link */}
      <a
        href="https://eternalai.org/api"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 20px",
          background: "linear-gradient(135deg, #FF0F87 0%, #ff2b9e 100%)",
          color: "#FFFFFF",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: "600",
          zIndex: 1001,
          boxShadow: "0 2px 8px rgba(255, 15, 135, 0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background =
            "linear-gradient(135deg, #ff2b9e 0%, #FF0F87 100%)";
          e.target.style.boxShadow = "0 4px 12px rgba(255, 15, 135, 0.5)";
          e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background =
            "linear-gradient(135deg, #FF0F87 0%, #ff2b9e 100%)";
          e.target.style.boxShadow = "0 2px 8px rgba(255, 15, 135, 0.3)";
          e.target.style.transform = "translateY(0)";
        }}
      >
        Visit Eternal AI API
      </a>
      <h1 style={{ fontSize: "2.8rem", marginTop: "4rem", color: "#C0C0C0" }}>
        Erotic Saga
      </h1>

      {/* --- Add New Character button (top right) --- */}
      {!showPasswordBox && (
        <button
          onClick={() => setShowPasswordBox(true)}
          style={{
            position: "absolute",
            color: "#ffffff",
            top: "60px",
            right: "20px",
            padding: "14px 48px",
            background: "#FF0F87",
            border: "1px solid #FF0F87",
            borderRadius: "999px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
            zIndex: 1000,
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
          Add New Character
        </button>
      )}

      {/* --- Loading --- */}
      {loading && <p>Processing...</p>}

      {/* --- Password input box --- */}
      {showPasswordBox && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <input
            type="password"
            placeholder="Enter admin password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleVerifyPassword();
              }
            }}
            style={{
              padding: "12px 16px",
              fontSize: "15px",
              borderRadius: "10px",
              width: "280px",
              border: "1px solid rgba(255, 15, 135, 0.12)",
              background: "rgba(20, 20, 20, 0.8)",
              color: "#F2F2F2",
              outline: "none",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#FF0F87";
              e.target.style.background = "rgba(20, 20, 20, 0.95)";
              e.target.style.boxShadow = "0 0 0 3px rgba(255, 15, 135, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 15, 135, 0.12)";
              e.target.style.background = "rgba(20, 20, 20, 0.8)";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleVerifyPassword}
              style={{
                padding: "14px 48px",
                background: "#FF0F87",
                border: "1px solid #FF0F87",
                borderRadius: "999px",
                color: "#F2F2F2",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
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
              Confirm
            </button>

            <button
              onClick={() => {
                setShowPasswordBox(false);
                setPassword("");
              }}
              style={{
                padding: "14px 48px",
                background: "transparent",
                border: "1px solid rgba(242, 242, 242, 0.12)",
                borderRadius: "999px",
                color: "#F2F2F2",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#FF0F87";
                e.target.style.background = "rgba(255, 15, 135, 0.1)";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(242, 242, 242, 0.12)";
                e.target.style.background = "transparent";
                e.target.style.color = "#F2F2F2";
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* --- Character list --- */}
      {characters.length > 0 && !showPasswordBox && (
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            width: "90%",
            maxWidth: "1400px",
            position: "relative",
          }}
        >
          {/* Previous button */}
          {currentPage > 0 && (
            <button
              onClick={handlePrevPage}
              style={{
                position: "absolute",
                left: "-70px",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(255, 15, 135, 0.3)",
                border: "2px solid #FF0F87",
                color: "#fff",
                fontSize: "32px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                zIndex: 100,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#FF0F87";
                e.target.style.transform = "scale(1.1)";
                e.target.style.boxShadow = "0 4px 20px rgba(255, 15, 135, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 15, 135, 0.3)";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }}
            >
              ‹
            </button>
          )}

          {/* Character grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gridAutoRows: "auto",
              gap: "1.05rem",
              width: "100%",
            }}
          >
            {currentCharacters.map((char, idx) => (
              <div
                key={`${char.id}-${idx}-${currentPage}`}
                onClick={() => handleSelectCharacter(char.id)}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 15, 135, 0.2)",
                  borderRadius: "16px",
                  padding: "1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 40px rgba(255, 15, 135, 0.15)",
                  transition: "all 0.3s ease",
                  willChange: "transform",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FF0F87";
                  e.currentTarget.style.boxShadow =
                    "0 0 60px rgba(255, 15, 135, 0.3)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 15, 135, 0.2)";
                  e.currentTarget.style.boxShadow =
                    "0 0 40px rgba(255, 15, 135, 0.15)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <img
                  src={char.image}
                  alt={char.name}
                  style={{
                    width: "100%",
                    height: "350px",
                    objectFit: "cover",
                    display: "block",
                    flexShrink: 0,
                  }}
                />
                <div style={{ padding: "1rem", flexShrink: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontSize: "1.2rem",
                      fontWeight: "600",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {char.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Next button */}
          {currentPage < totalPages - 1 && (
            <button
              onClick={handleNextPage}
              style={{
                position: "absolute",
                right: "-70px",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(255, 15, 135, 0.3)",
                border: "2px solid #FF0F87",
                color: "#fff",
                fontSize: "32px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                zIndex: 100,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#FF0F87";
                e.target.style.transform = "scale(1.1)";
                e.target.style.boxShadow = "0 4px 20px rgba(255, 15, 135, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 15, 135, 0.3)";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
