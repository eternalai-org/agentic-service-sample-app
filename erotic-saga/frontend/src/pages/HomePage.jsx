import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import HomePageMobile from "./HomePageMobile";

// Font size system: 4 levels
const FONT_SIZES = {
  xs: "12px", // Level 1: Small text, hints, captions
  sm: "14px", // Level 2: Body text, small buttons
  md: "16px", // Level 3: Main body text, buttons
  lg: "24px", // Level 4: Headings, large titles
};

export default function HomePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [loadedUpTo, setLoadedUpTo] = useState(0); // Track how many characters we've loaded
  const charactersPerPage = 5;

  // Load characters with pagination (backend determines limit based on platform)
  const loadCharacters = async (offset) => {
    try {
      const res = await axios.get(
        `/api/characters?offset=${offset}&platform=desktop`
      );
      console.log("Characters response:", res.data);

      if (res.data && res.data.characters) {
        setTotalCharacters(res.data.total);
        return { characters: res.data.characters, total: res.data.total };
      } else if (Array.isArray(res.data)) {
        // Fallback for old API format
        setTotalCharacters(res.data.length);
        return { characters: res.data, total: res.data.length };
      }
      return { characters: [], total: 0 };
    } catch (err) {
      console.error("Error fetching characters:", err);
      return { characters: [], total: 0 };
    }
  };

  // Load more characters when needed (lazy loading)
  const loadMoreCharactersIfNeeded = async (targetPage) => {
    const targetBlock = targetPage;
    // Calculate how many characters we need for this block
    const neededCount = (targetBlock + 1) * charactersPerPage;

    // Load more when moving to even blocks (block 2, 4, 6, ...)
    // We already have blocks 0 and 1 (first 10 characters)
    if (targetBlock >= 2 && targetBlock % 2 === 0) {
      // Check if we need to load more
      if (loadedUpTo < neededCount && loadedUpTo < totalCharacters) {
        try {
          setLoading(true);
          // Frontend sends offset = number of characters already received
          // Backend will automatically return up to 10 characters for desktop
          const result = await loadCharacters(loadedUpTo);
          const additionalChars = result.characters || [];
          if (additionalChars.length > 0) {
            setCharacters((prev) => [...prev, ...additionalChars]);
            setLoadedUpTo(loadedUpTo + additionalChars.length);
          }
        } catch (err) {
          console.error("Error loading more characters:", err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Load enough characters for a specific page (used when restoring page state)
  const loadCharactersForPage = async (
    targetPage,
    currentLoadedUpTo,
    currentTotal,
    initialCharacters = []
  ) => {
    const neededCount = (targetPage + 1) * charactersPerPage;
    let localLoadedUpTo = currentLoadedUpTo;
    let allCharacters = [...initialCharacters]; // Start with initial characters

    // Keep loading until we have enough characters
    while (localLoadedUpTo < neededCount && localLoadedUpTo < currentTotal) {
      try {
        const result = await loadCharacters(localLoadedUpTo);
        const additionalChars = result.characters || [];
        if (additionalChars.length > 0) {
          // Add to local array instead of state immediately
          allCharacters = [...allCharacters, ...additionalChars];
          localLoadedUpTo += additionalChars.length;
        } else {
          break; // No more characters available
        }
      } catch (err) {
        console.error("Error loading characters for page:", err);
        break;
      }
    }

    // Update state once at the end with all characters
    setCharacters(allCharacters);
    setLoadedUpTo(localLoadedUpTo);
  };

  React.useEffect(() => {
    if (!isMobile) {
      // Restore saved page if available
      const savedPage = localStorage.getItem("homePage");
      let targetPage = 0;
      if (savedPage !== null && savedPage !== undefined && savedPage !== "") {
        const pageNum = parseInt(savedPage, 10);
        if (!isNaN(pageNum) && pageNum >= 0) {
          targetPage = pageNum;
          // Only set currentPage if we have a valid saved page
          setCurrentPage(pageNum);
        }
      }

      // Load initial characters and ensure we have enough for the target page
      const loadInitialData = async () => {
        try {
          setLoading(true);
          // Load initial 10 characters (backend will return up to 10 for desktop)
          const result = await loadCharacters(0);
          const loadedChars = result.characters || [];
          const currentTotal = result.total || 0;

          if (loadedChars.length > 0) {
            // If target page requires more characters, load them first
            const neededCount = (targetPage + 1) * charactersPerPage;
            if (
              neededCount > loadedChars.length &&
              currentTotal > loadedChars.length
            ) {
              // Pass loadedChars to avoid duplicates - this will set characters at the end
              await loadCharactersForPage(
                targetPage,
                loadedChars.length,
                currentTotal,
                loadedChars
              );
            } else {
              // No need to load more, just set initial characters
              setCharacters(loadedChars);
              setLoadedUpTo(loadedChars.length);
            }

            // Validate and adjust targetPage after loading
            const calculatedTotalPages =
              currentTotal > 0
                ? Math.ceil(currentTotal / charactersPerPage)
                : Math.ceil(loadedChars.length / charactersPerPage);

            // If targetPage exceeds totalPages, reset to 0 and clear localStorage
            if (
              targetPage >= calculatedTotalPages &&
              calculatedTotalPages > 0
            ) {
              console.log(
                `Invalid saved page ${targetPage}, resetting to 0. Total pages: ${calculatedTotalPages}`
              );
              setCurrentPage(0);
              localStorage.removeItem("homePage");
            }
          }
        } catch (err) {
          console.error("Error fetching characters:", err);
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();

      // Clear cameFromAdmin flag when entering home page
      localStorage.removeItem("cameFromAdmin");
      // Check if welcome modal has been shown before
      const hasSeenWelcome = localStorage.getItem("hasSeenHomeWelcome");
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMobile) {
    return <HomePageMobile />;
  }

  const handleSelectCharacter = (charId) => {
    // Save character ID for GamePage to use
    localStorage.setItem("selectedCharacterId", charId);
    navigate("/game");
  };

  // Calculate pagination
  const totalPages =
    totalCharacters > 0
      ? Math.ceil(totalCharacters / charactersPerPage)
      : Math.ceil(characters.length / charactersPerPage);
  const startIndex = currentPage * charactersPerPage;
  const endIndex = startIndex + charactersPerPage;
  const currentCharacters = characters.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    const prevPage = Math.max(0, currentPage - 1);
    setCurrentPage(prevPage);
    // Save page when navigating
    localStorage.setItem("homePage", prevPage.toString());
  };

  const handleNextPage = async () => {
    const nextPage = Math.min(totalPages - 1, currentPage + 1);
    setCurrentPage(nextPage);
    // Save page when navigating
    localStorage.setItem("homePage", nextPage.toString());
    await loadMoreCharactersIfNeeded(nextPage);
  };

  // Calculate which page indicators to show (max 5)
  const getVisiblePageIndicators = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    // Show 5 pages around current page
    let start = Math.max(0, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    // Adjust if we're near the beginning
    if (currentPage < 2) {
      end = Math.min(4, totalPages - 1);
    }
    // Adjust if we're near the end
    if (currentPage > totalPages - 3) {
      start = Math.max(0, totalPages - 5);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ✅ Main interface
  return (
    <div
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0rem",
        position: "relative",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
          fontSize: FONT_SIZES.sm,
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
        Visit EternalAI.org to create API Key
      </a>
      <h1
        style={{
          fontSize: "2.8rem",
          marginTop: "4rem",
          background:
            "linear-gradient(90deg, #9D4EDD 0%, #FF0F87 50%, #FF6B35 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Erotic Saga
      </h1>

      {/* --- Add New Character button (top right) --- */}
      <button
        onClick={() => navigate("/upload")}
        style={{
          position: "absolute",
          color: "#ffffff",
          top: "60px",
          right: "20px",
          padding: "14px 48px",
          background: "#FF0F87",
          border: "1px solid #FF0F87",
          borderRadius: "999px",
          fontSize: FONT_SIZES.md,
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

      {/* --- Loading --- */}
      {loading && <p>Processing...</p>}

      {/* --- Character list --- */}
      {characters.length > 0 && (
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
                fontSize: "32px", // Keep large for character names
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
              &lt;
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
                  border: "4px solid rgba(255, 15, 135, 0.2)",
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
                fontSize: "32px", // Keep large for character names
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
              &gt;
            </button>
          )}
        </div>
      )}

      {/* Page Indicators */}
      {characters.length > 0 && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "6rem",
            width: "100%",
          }}
        >
          {getVisiblePageIndicators().map((idx) => (
            <div
              key={idx}
              onClick={async () => {
                setCurrentPage(idx);
                // Save page when clicking on page indicator
                localStorage.setItem("homePage", idx.toString());
                // Ensure we have enough characters for the selected page
                const neededCount = (idx + 1) * charactersPerPage;
                if (loadedUpTo < neededCount && loadedUpTo < totalCharacters) {
                  // Load enough characters for this page
                  await loadCharactersForPage(
                    idx,
                    loadedUpTo,
                    totalCharacters,
                    characters
                  );
                } else {
                  // Just load more if needed (for even blocks)
                  await loadMoreCharactersIfNeeded(idx);
                }
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
              onMouseEnter={(e) => {
                if (currentPage !== idx) {
                  e.target.style.background = "rgba(255, 15, 135, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== idx) {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 15, 135, 0.5)",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(255, 15, 135, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px 32px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: FONT_SIZES.lg,
                  fontWeight: "600",
                  background:
                    "linear-gradient(135deg, #FF0F87 0%, #ff2b9e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Welcome to Erotic Saga!
              </h2>
            </div>
            <div style={{ padding: "32px" }}>
              <div
                style={{
                  fontSize: FONT_SIZES.md,
                  color: "#F2F2F2",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                This is an interactive quiz game where you can test your
                knowledge and unlock exciting rewards. Select a character to
                start playing, answer questions correctly to progress, and
                unlock special images as rewards. Challenge yourself and have
                fun!
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                padding: "24px 32px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  localStorage.setItem("hasSeenHomeWelcome", "true");
                }}
                style={{
                  padding: "14px 48px",
                  background: "#FF0F87",
                  border: "1px solid #FF0F87",
                  borderRadius: "999px",
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
        </div>
      )}
    </div>
  );
}
