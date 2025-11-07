import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import HomePageMobile from "./HomePageMobile";

export default function AdminPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [loadedUpTo, setLoadedUpTo] = useState(0); // Track how many characters we've loaded
  const [sortBy, setSortBy] = useState("oldest"); // Sort option: "oldest", "newest", "name_asc", "name_desc"
  const charactersPerPage = 5;

  // Get admin password from localStorage
  const getAdminPassword = () => {
    return localStorage.getItem("admin_password");
  };

  // Load characters with pagination (backend determines limit based on platform)
  const loadCharacters = async (offset, sort = sortBy) => {
    try {
      const password = getAdminPassword();
      if (!password) {
        navigate("/upload");
        return { characters: [], total: 0 };
      }

      const res = await axios.get(
        `/api/admin/characters?offset=${offset}&platform=desktop&sort=${sort}`,
        {
          headers: { "x-admin-password": password },
        }
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
      if (err.response?.status === 401) {
        localStorage.removeItem("admin_password");
        navigate("/upload");
      }
      return { characters: [], total: 0 };
    }
  };

  // Auto-load initial characters on mount (admin view - no filtering)
  // Note: This function is kept for potential future use but currently replaced by loadInitialData in useEffect
  const _loadAllCharacters = async () => {
    try {
      setLoading(true);
      // Load initial 10 characters (backend will return up to 10 for desktop)
      const result = await loadCharacters(0);
      const loadedChars = result.characters || [];
      if (loadedChars.length > 0) {
        setCharacters(loadedChars);
        setLoadedUpTo(loadedChars.length);
      }
    } catch (err) {
      console.error("Error fetching characters:", err);
    } finally {
      setLoading(false);
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
      // When admin logs in, always start from block 0
      // Only restore saved page if we're coming back from game page (not from login)
      const cameFromGame = localStorage.getItem("cameFromAdmin") === "true";
      const savedPage = localStorage.getItem("adminPage");
      let targetPage = 0;

      // Only restore page if we're coming back from game (cameFromAdmin flag exists)
      // If this is a fresh login, always start from block 0
      if (
        cameFromGame &&
        savedPage !== null &&
        savedPage !== undefined &&
        savedPage !== ""
      ) {
        const pageNum = parseInt(savedPage, 10);
        if (!isNaN(pageNum) && pageNum >= 0) {
          targetPage = pageNum;
          // Only set currentPage if we have a valid saved page
          setCurrentPage(pageNum);
        }
      } else {
        // Fresh login - start from block 0
        setCurrentPage(0);
        localStorage.removeItem("adminPage");
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
              localStorage.removeItem("adminPage");
            }
          }
        } catch (err) {
          console.error("Error fetching characters:", err);
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();

      // Set flag to indicate we're coming from admin page
      localStorage.setItem("cameFromAdmin", "true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload characters when sort changes
  React.useEffect(() => {
    if (!isMobile) {
      const reloadData = async () => {
        try {
          setLoading(true);
          setCurrentPage(0); // Reset to page 0 when sort changes
          setLoadedUpTo(0);
          const result = await loadCharacters(0, sortBy);
          const loadedChars = result.characters || [];

          if (loadedChars.length > 0) {
            setCharacters(loadedChars);
            setLoadedUpTo(loadedChars.length);
          } else {
            setCharacters([]);
            setLoadedUpTo(0);
          }
        } catch (err) {
          console.error("Error reloading characters:", err);
        } finally {
          setLoading(false);
        }
      };
      reloadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // Ensure currentPage doesn't exceed totalPages after deletion
  React.useEffect(() => {
    const calculatedTotalPages =
      totalCharacters > 0
        ? Math.ceil(totalCharacters / charactersPerPage)
        : Math.ceil(characters.length / charactersPerPage);

    if (calculatedTotalPages > 0 && currentPage >= calculatedTotalPages) {
      setCurrentPage(Math.max(0, calculatedTotalPages - 1));
    }
  }, [totalCharacters, characters.length, currentPage, charactersPerPage]);

  if (isMobile) {
    return <HomePageMobile />;
  }

  const handleSelectCharacter = (charId) => {
    // Save character ID for GamePage to use
    localStorage.setItem("selectedCharacterId", charId);
    // Keep cameFromAdmin flag so back button goes to /admin
    localStorage.setItem("cameFromAdmin", "true");
    navigate("/game");
  };

  const handleDeleteClick = (charId, charName, e) => {
    e.stopPropagation();
    setCharacterToDelete({ id: charId, name: charName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!characterToDelete) return;

    try {
      setLoading(true);
      const password = getAdminPassword();
      await axios.delete(`/api/admin/characters/${characterToDelete.id}`, {
        headers: { "x-admin-password": password },
      });

      // Reload characters after deletion (keep current page)
      // Load initial characters first
      const result = await loadCharacters(0);
      const loadedChars = result.characters || [];
      const currentTotal = result.total || 0;

      if (loadedChars.length > 0) {
        setCharacters(loadedChars);
        setLoadedUpTo(loadedChars.length);

        // Load enough characters for current page if needed
        const neededCount = (currentPage + 1) * charactersPerPage;
        if (
          neededCount > loadedChars.length &&
          currentTotal > loadedChars.length
        ) {
          await loadCharactersForPage(
            currentPage,
            loadedChars.length,
            currentTotal,
            loadedChars
          );
        }
      }

      // Don't reset page - useEffect will adjust if needed
      setShowDeleteModal(false);
      setCharacterToDelete(null);
    } catch (err) {
      console.error("Error deleting character:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("admin_password");
        navigate("/upload");
      } else {
        setShowDeleteModal(false);
        setCharacterToDelete(null);
        // Show error message in modal or use a state for error message
        alert("Failed to delete character. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCharacterToDelete(null);
  };

  const handleMakePublic = async (charId, e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const password = getAdminPassword();
      await axios.put(`/api/admin/characters/${charId}/make-public`, null, {
        headers: { "x-admin-password": password },
      });

      // Reload characters after update (keep current page)
      // Load initial characters first
      const result = await loadCharacters(0);
      const loadedChars = result.characters || [];
      const currentTotal = result.total || 0;

      if (loadedChars.length > 0) {
        setCharacters(loadedChars);
        setLoadedUpTo(loadedChars.length);

        // Load enough characters for current page if needed
        const neededCount = (currentPage + 1) * charactersPerPage;
        if (
          neededCount > loadedChars.length &&
          currentTotal > loadedChars.length
        ) {
          await loadCharactersForPage(
            currentPage,
            loadedChars.length,
            currentTotal,
            loadedChars
          );
        }
      }
    } catch (err) {
      console.error("Error making character public:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("admin_password");
        navigate("/upload");
      } else {
        alert("Failed to update character. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMakePrivate = async (charId, e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const password = getAdminPassword();
      await axios.put(`/api/admin/characters/${charId}/make-private`, null, {
        headers: { "x-admin-password": password },
      });

      // Reload characters after update (keep current page)
      // Load initial characters first
      const result = await loadCharacters(0);
      const loadedChars = result.characters || [];
      const currentTotal = result.total || 0;

      if (loadedChars.length > 0) {
        setCharacters(loadedChars);
        setLoadedUpTo(loadedChars.length);

        // Load enough characters for current page if needed
        const neededCount = (currentPage + 1) * charactersPerPage;
        if (
          neededCount > loadedChars.length &&
          currentTotal > loadedChars.length
        ) {
          await loadCharactersForPage(
            currentPage,
            loadedChars.length,
            currentTotal,
            loadedChars
          );
        }
      }
    } catch (err) {
      console.error("Error making character private:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("admin_password");
        navigate("/upload");
      } else {
        alert("Failed to update character. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
    localStorage.setItem("adminPage", prevPage.toString());
  };

  const handleNextPage = async () => {
    const nextPage = Math.min(totalPages - 1, currentPage + 1);
    setCurrentPage(nextPage);
    // Save page when navigating
    localStorage.setItem("adminPage", nextPage.toString());
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
        Visit EternalAI.org to create API Key
      </a>
      <h1 style={{ fontSize: "2.8rem", marginTop: "4rem", color: "#C0C0C0" }}>
        Admin Panel - Erotic Saga
      </h1>

      {/* --- Back to User Page button (top left), styled like "Add New Character" --- */}
      <button
        onClick={() => {
          // Clear cameFromAdmin flag when going back to user page
          localStorage.removeItem("cameFromAdmin");
          navigate("/");
        }}
        style={{
          position: "absolute",
          color: "#ffffff",
          top: "60px",
          left: "20px",
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
        Back to User Page
      </button>

      {/* --- Sort dropdown (top right, before Add New Character) --- */}
      <div
        style={{
          position: "absolute",
          top: "120px",
          right: "20px",
          zIndex: 1000,
        }}
      >
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "14px 30px 14px 10px",
            background: "rgba(255, 15, 135, 0.2)",
            border: "1px solid #FF0F87",
            borderRadius: "999px",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            transition: "all 0.2s",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "10px 10px",
            minWidth: "160px",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 15, 135, 0.3)";
            e.target.style.borderColor = "#ff2b9e";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 15, 135, 0.2)";
            e.target.style.borderColor = "#FF0F87";
          }}
        >
          <option
            value="oldest"
            style={{ background: "#1a1a1a", color: "#ffffff" }}
          >
            Oldest First
          </option>
          <option
            value="newest"
            style={{ background: "#1a1a1a", color: "#ffffff" }}
          >
            Newest First
          </option>
          <option
            value="name_asc"
            style={{ background: "#1a1a1a", color: "#ffffff" }}
          >
            Name A-Z
          </option>
          <option
            value="name_desc"
            style={{ background: "#1a1a1a", color: "#ffffff" }}
          >
            Name Z-A
          </option>
        </select>
        <span
          style={{
            position: "absolute",
            right: "20px",
            top: "45%",
            transform: "translateY(-50%)",
            color: "#FF0F87",
            fontSize: "24px",
            pointerEvents: "none",
          }}
        >
          ▾
        </span>
      </div>

      {/* --- Add New Character button (top right) --- */}
      <button
        onClick={() => {
          // Keep cameFromAdmin flag so back button goes to /admin
          localStorage.setItem("cameFromAdmin", "true");
          navigate("/upload");
        }}
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
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "4px solid rgba(255, 15, 135, 0.2)",
                  borderRadius: "16px",
                  padding: "1rem",
                  textAlign: "center",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 40px rgba(255, 15, 135, 0.15)",
                  transition: "all 0.3s ease",
                  willChange: "transform",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
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
                  onClick={() => handleSelectCharacter(char.id)}
                  style={{
                    width: "100%",
                    height: "350px",
                    objectFit: "cover",
                    display: "block",
                    flexShrink: 0,
                    cursor: "pointer",
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
                      marginBottom: "0.5rem",
                    }}
                  >
                    {char.name}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(255, 255, 255, 0.6)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Owner:{" "}
                    {char.owner
                      ? char.owner.length > 10
                        ? char.owner.slice(0, 10) + "..."
                        : char.owner
                      : "public"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(255, 255, 255, 0.6)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Status: {char.status || "public"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={(e) =>
                        (char.status || "public") === "public"
                          ? handleMakePrivate(char.id, e)
                          : handleMakePublic(char.id, e)
                      }
                      style={{
                        padding: "6px 12px",
                        background:
                          (char.status || "public") === "public"
                            ? "rgba(255, 165, 0, 0.2)"
                            : "rgba(0, 255, 100, 0.2)",
                        border:
                          (char.status || "public") === "public"
                            ? "1px solid rgba(255, 165, 0, 0.5)"
                            : "1px solid rgba(0, 255, 100, 0.5)",
                        borderRadius: "6px",
                        color:
                          (char.status || "public") === "public"
                            ? "#ffaa00"
                            : "#00ff64",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background =
                          (char.status || "public") === "public"
                            ? "rgba(255, 165, 0, 0.3)"
                            : "rgba(0, 255, 100, 0.3)";
                        e.target.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background =
                          (char.status || "public") === "public"
                            ? "rgba(255, 165, 0, 0.2)"
                            : "rgba(0, 255, 100, 0.2)";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      {(char.status || "public") === "public"
                        ? "Make Private"
                        : "Make Public"}
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(char.id, char.name, e)}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 0, 0, 0.5)",
                        borderRadius: "6px",
                        color: "#ff4444",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255, 0, 0, 0.3)";
                        e.target.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255, 0, 0, 0.2)";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      Delete
                    </button>
                  </div>
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
                localStorage.setItem("adminPage", idx.toString());
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && characterToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 0, 0, 0.3)",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(255, 0, 0, 0.3)",
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
                  fontSize: "24px",
                  fontWeight: "600",
                  background:
                    "linear-gradient(135deg, #ff4444 0%, #ff6666 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Delete Character
              </h2>
              <button
                onClick={handleDeleteCancel}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(242, 242, 242, 0.6)",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 0, 0, 0.1)";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "rgba(242, 242, 242, 0.6)";
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "32px" }}>
              <div
                style={{
                  fontSize: "16px",
                  color: "#F2F2F2",
                  lineHeight: "1.6",
                  marginBottom: "24px",
                }}
              >
                Are you sure you want to delete the character{" "}
                <strong style={{ color: "#ff4444" }}>
                  "{characterToDelete.name}"
                </strong>
                ? This action cannot be undone.
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
                onClick={handleDeleteCancel}
                disabled={loading}
                style={{
                  padding: "14px 32px",
                  background: "transparent",
                  border: "1px solid rgba(242, 242, 242, 0.12)",
                  borderRadius: "999px",
                  color: "#F2F2F2",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.borderColor = "#FF0F87";
                    e.target.style.background = "rgba(255, 15, 135, 0.1)";
                    e.target.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.borderColor = "rgba(242, 242, 242, 0.12)";
                    e.target.style.background = "transparent";
                    e.target.style.color = "#F2F2F2";
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                style={{
                  padding: "14px 48px",
                  background: "#ff4444",
                  border: "1px solid #ff4444",
                  borderRadius: "999px",
                  color: "#F2F2F2",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(255, 0, 0, 0.4)",
                  transition: "all 0.2s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = "#ff6666";
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(255, 0, 0, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = "#ff4444";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(255, 0, 0, 0.4)";
                  }
                }}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
