import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Font size system: 4 levels
const FONT_SIZES = {
  xs: "12px",   // Level 1: Small text, hints, captions
  sm: "14px",   // Level 2: Body text, small buttons
  md: "16px",   // Level 3: Main body text, buttons
  lg: "24px",   // Level 4: Headings, large titles
};

export default function HomePageMobile() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [loadedUpTo, setLoadedUpTo] = useState(0); // Track how many characters we've loaded
  const charactersPerPage = 4;
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const touchStartYRef = useRef(null);
  const touchEndYRef = useRef(null);
  const hasSwipedRef = useRef(false);

  // Load characters with pagination (backend determines limit based on platform)
  const loadCharacters = async (offset) => {
    try {
      const res = await axios.get(
        `/api/characters?offset=${offset}&platform=mobile`
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
    // We already have blocks 0 and 1 (first 8 characters)
    if (targetBlock >= 2 && targetBlock % 2 === 0) {
      // Check if we need to load more
      if (loadedUpTo < neededCount && loadedUpTo < totalCharacters) {
        try {
          setLoading(true);
          // Frontend sends offset = number of characters already received
          // Backend will automatically return up to 8 characters for mobile
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
    currentTotal
  ) => {
    const neededCount = (targetPage + 1) * charactersPerPage;
    let localLoadedUpTo = currentLoadedUpTo;

    // Keep loading until we have enough characters
    while (localLoadedUpTo < neededCount && localLoadedUpTo < currentTotal) {
      try {
        const result = await loadCharacters(localLoadedUpTo);
        const additionalChars = result.characters || [];
        if (additionalChars.length > 0) {
          setCharacters((prev) => [...prev, ...additionalChars]);
          localLoadedUpTo += additionalChars.length;
          setLoadedUpTo(localLoadedUpTo);
        } else {
          break; // No more characters available
        }
      } catch (err) {
        console.error("Error loading characters for page:", err);
        break;
      }
    }
  };

  // Load characters
  useEffect(() => {
    // Restore saved page if available
    const savedPage = localStorage.getItem("homePageMobile");
    let targetPage = 0;
    if (savedPage !== null) {
      const pageNum = parseInt(savedPage, 10);
      if (!isNaN(pageNum) && pageNum >= 0) {
        targetPage = pageNum;
        setCurrentPage(pageNum);
      }
    }

    const fetchCharacters = async () => {
      try {
        setLoading(true);
        // Load initial 8 characters (backend will return up to 8 for mobile)
        const result = await loadCharacters(0);
        const loadedChars = result.characters || [];
        const currentTotal = result.total || 0;

        if (loadedChars.length > 0) {
          setCharacters(loadedChars);
          setLoadedUpTo(loadedChars.length);

          // If target page requires more characters, load them
          const neededCount = (targetPage + 1) * charactersPerPage;
          if (
            neededCount > loadedChars.length &&
            currentTotal > loadedChars.length
          ) {
            await loadCharactersForPage(
              targetPage,
              loadedChars.length,
              currentTotal
            );
          }
        }
      } catch (err) {
        console.error("Error fetching characters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
    // Check if welcome modal has been shown before
    const hasSeenWelcome = localStorage.getItem("hasSeenHomeWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages =
    totalCharacters > 0
      ? Math.ceil(totalCharacters / charactersPerPage)
      : Math.ceil(characters.length / charactersPerPage);

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

  // Touch handlers for swipe
  const minSwipeDistance = 20;
  const maxVerticalSwipe = 30; // Maximum vertical movement to consider it a horizontal swipe

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchEndRef.current = null;
    touchEndYRef.current = null;
    hasSwipedRef.current = false;
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    touchEndRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;

    // Prevent default scrolling if this is a horizontal swipe
    if (touchStartRef.current !== null && touchStartYRef.current !== null) {
      const horizontalDistance = Math.abs(
        touch.clientX - touchStartRef.current
      );
      const verticalDistance = Math.abs(touch.clientY - touchStartYRef.current);

      // If horizontal movement is greater than vertical, prevent default scroll
      if (horizontalDistance > verticalDistance && horizontalDistance > 10) {
        e.preventDefault();
      }
    }
  };

  const onTouchEnd = async (e) => {
    if (touchStartRef.current === null || touchEndRef.current === null) {
      touchStartRef.current = null;
      touchEndRef.current = null;
      touchStartYRef.current = null;
      touchEndYRef.current = null;
      return;
    }

    const distance = touchStartRef.current - touchEndRef.current;
    const verticalDistance =
      touchStartYRef.current !== null && touchEndYRef.current !== null
        ? Math.abs(touchEndYRef.current - touchStartYRef.current)
        : 0;

    // Only trigger swipe if horizontal movement is dominant
    if (verticalDistance > maxVerticalSwipe) {
      touchStartRef.current = null;
      touchEndRef.current = null;
      touchStartYRef.current = null;
      touchEndYRef.current = null;
      return;
    }

    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      hasSwipedRef.current = true;
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      // Save page when swiping
      localStorage.setItem("homePageMobile", nextPage.toString());
      await loadMoreCharactersIfNeeded(nextPage);
      // Prevent click event from firing
      e.preventDefault();
    } else if (isRightSwipe && currentPage > 0) {
      hasSwipedRef.current = true;
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      // Save page when swiping
      localStorage.setItem("homePageMobile", prevPage.toString());
      // Prevent click event from firing
      e.preventDefault();
    }

    // Reset touch state after a short delay to allow click event to check hasSwipedRef
    setTimeout(() => {
      touchStartRef.current = null;
      touchEndRef.current = null;
      touchStartYRef.current = null;
      touchEndYRef.current = null;
      hasSwipedRef.current = false;
    }, 100);
  };

  const onTouchCancel = () => {
    // Reset touch state on cancel
    touchStartRef.current = null;
    touchEndRef.current = null;
    touchStartYRef.current = null;
    touchEndYRef.current = null;
    hasSwipedRef.current = false;
  };

  const handleSelectCharacter = (charId) => {
    localStorage.setItem("selectedCharacterId", charId);
    navigate("/game");
  };

  return (
    <div
      style={{
        backgroundColor: "#000000",
        minHeight: "100vh",
        color: "#F2F2F2",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
          fontSize: FONT_SIZES.sm,
          fontWeight: "600",
          boxShadow: "0 2px 8px rgba(255, 15, 135, 0.3)",
        }}
      >
        Visit EternalAI.org to create API Key
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
            fontWeight: "700",
            padding: "0.5rem 1rem",
            background: "linear-gradient(90deg, #9D4EDD 0%, #FF0F87 50%, #FF6B35 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
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
          onTouchCancel={onTouchCancel}
          style={{
            position: "relative",
            margin: "2rem 1rem 2rem",
            overflow: "hidden",
            borderRadius: "16px",
            userSelect: "none",
            touchAction: "pan-y pinch-zoom", // Allow vertical scroll but handle horizontal swipe
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
                        onClick={() => {
                          // Only trigger click if it wasn't a swipe
                          if (!hasSwipedRef.current) {
                            handleSelectCharacter(char.id);
                          }
                        }}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "2px solid rgba(255, 15, 135, 0.5)",
                          borderRadius: "12px",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 4px 12px rgba(255, 15, 135, 0.3)",
                        }}
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
        </div>
      )}

      {/* Page Indicators */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "2rem",
            marginBottom: "2rem",
          }}
        >
          {getVisiblePageIndicators().map((idx) => (
            <div
              key={idx}
              onClick={async () => {
                setCurrentPage(idx);
                // Save page when clicking on page indicator
                localStorage.setItem("homePageMobile", idx.toString());
                // Ensure we have enough characters for the selected page
                const neededCount = (idx + 1) * charactersPerPage;
                if (loadedUpTo < neededCount && loadedUpTo < totalCharacters) {
                  // Load enough characters for this page
                  await loadCharactersForPage(idx, loadedUpTo, totalCharacters);
                } else {
                  // Just load more if needed (for even blocks)
                  await loadMoreCharactersIfNeeded(idx);
                }
              }}
              onTouchStart={async (e) => {
                e.stopPropagation();
                setCurrentPage(idx);
                // Save page when touching page indicator
                localStorage.setItem("homePageMobile", idx.toString());
                // Ensure we have enough characters for the selected page
                const neededCount = (idx + 1) * charactersPerPage;
                if (loadedUpTo < neededCount && loadedUpTo < totalCharacters) {
                  // Load enough characters for this page
                  await loadCharactersForPage(idx, loadedUpTo, totalCharacters);
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
            width: "90%",
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
              maxWidth: "90%",
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
                padding: "20px 24px",
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
                Welcome to Erotic Saga
              </h2>
            </div>
            <div style={{ padding: "24px" }}>
              <div
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: "#F2F2F2",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                Welcome to Erotic Saga! This is an interactive quiz game where
                you can test your knowledge and unlock exciting rewards. Select
                a character to start playing, answer questions correctly to
                progress, and unlock special images as rewards. Challenge
                yourself and have fun!
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                padding: "20px 24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  localStorage.setItem("hasSeenHomeWelcome", "true");
                }}
                style={{
                  padding: "12px 32px",
                  background: "#FF0F87",
                  border: "1px solid #FF0F87",
                  borderRadius: "999px",
                  color: "#F2F2F2",
                  fontSize: FONT_SIZES.sm,
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
        </div>
      )}
    </div>
  );
}
