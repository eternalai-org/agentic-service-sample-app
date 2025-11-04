import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function HomePageMobile() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [bg, setBg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const charactersPerPage = 4;
  const containerRef = useRef(null);

  // Load background
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/default-background");
        setBg(res.data?.image || null);
      } catch (e) {
        console.warn("Failed to load background", e);
      }
    })();
  }, []);

  // Load characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/characters");
        if (Array.isArray(res.data)) {
          setCharacters(res.data);
        }
      } catch (err) {
        console.error("Error fetching characters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  const totalPages = Math.ceil(characters.length / charactersPerPage);

  // Touch handlers for swipe
  const minSwipeDistance = 20;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
    if (isRightSwipe && currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSelectCharacter = (charId) => {
    localStorage.setItem("selectedCharacterId", charId);
    navigate("/game");
  };

  return (
    <div
      style={{
        backgroundImage: bg
          ? `url(${bg})`
          : "linear-gradient(180deg, #1a1a1a, #000)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        color: "#F2F2F2",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Banner */}
      <a
        href="https://eternalai.org/api"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textAlign: "center",
          padding: "12px 16px",
          background: "linear-gradient(135deg, #FF0F87 0%, #ff2b9e 100%)",
          color: "#fff",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 2px 8px rgba(255, 15, 135, 0.3)",
        }}
      >
        Visit Eternal AI API
      </a>

      {/* Header with Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: "1.5rem",
            margin: 0,
            color: "#fff",
            fontWeight: "700",
            padding: "0.5rem 1rem",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "8px",
          }}
        >
          Erotic Saga
        </h1>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ textAlign: "center", margin: "2rem", fontSize: "1rem" }}>
          Loading characters...
        </p>
      )}

      {/* Character Carousel */}
      {characters.length > 0 && !loading && (
        <div
          ref={containerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: "relative",
            margin: "2rem 1rem 2rem",
            overflow: "hidden",
            borderRadius: "16px",
            userSelect: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              transition: "transform 0.4s ease",
              transform: `translateX(-${currentPage * 100}%)`,
            }}
          >
            {Array.from({ length: totalPages }).map((_, pageIdx) => {
              const start = pageIdx * charactersPerPage;
              const end = start + charactersPerPage;
              const pageChars = characters.slice(start, end);

              return (
                <div
                  key={pageIdx}
                  style={{
                    minWidth: "100%",
                    padding: "0 8px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {pageChars.map((char) => (
                      <div
                        key={char.id}
                        onClick={() => handleSelectCharacter(char.id)}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "2px solid rgba(255, 15, 135, 0.5)",
                          borderRadius: "12px",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 12px rgba(255, 15, 135, 0.3)",
                        }}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <img
                          src={char.image}
                          alt={char.name}
                          style={{
                            width: "100%",
                            height: "180px",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <div
                          style={{ padding: "10px 8px", textAlign: "center" }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "0.95rem",
                              fontWeight: "600",
                              color: "#fff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {char.name}
                          </h3>
                        </div>
                      </div>
                    ))}
                    {/* Fill empty slots if less than 4 */}
                    {pageChars.length < 4 &&
                      Array.from({ length: 4 - pageChars.length }).map(
                        (_, i) => (
                          <div
                            key={`empty-${i}`}
                            style={{
                              visibility: "hidden",
                              gridColumn: i < 2 ? "span 1" : undefined,
                            }}
                          >
                            <div style={{ paddingBottom: "100%" }} />
                          </div>
                        )
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Page Indicators */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "6px",
                marginTop: "4rem",
              }}
            >
              {Array.from({ length: totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setCurrentPage(idx);
                  }}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background:
                      currentPage === idx ? "#FF0F87" : "rgba(255,255,255,0.3)",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
