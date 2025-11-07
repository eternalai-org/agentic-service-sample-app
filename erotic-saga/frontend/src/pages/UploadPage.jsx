import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Font size system: 4 levels
const FONT_SIZES = {
  xs: "12px", // Level 1: Small text, hints, captions
  sm: "14px", // Level 2: Body text, small buttons
  md: "16px", // Level 3: Main body text, buttons
  lg: "24px", // Level 4: Headings, large titles
};

export default function UploadPage() {
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [promptCount, setPromptCount] = useState(4);
  const [prompts, setPrompts] = useState(Array(4).fill(""));
  const [loading, setLoading] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(Array(4).fill(false));

  // New states for questions mode
  const [mode, setMode] = useState("images"); // "images" or "questions"
  const [topic, setTopic] = useState("");
  const [difficulties, setDifficulties] = useState(Array(4).fill(1));
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSwitchedToQuestions, setHasSwitchedToQuestions] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Validate form function
  const validateForm = () => {
    // Basic checks
    if (!characterName || !apiKey || !image) {
      setIsFormValid(false);
      return;
    }

    // Check prompts are filled
    if (prompts.some((p) => p.trim() === "")) {
      setIsFormValid(false);
      return;
    }

    // Must have switched to questions mode at least once
    if (!hasSwitchedToQuestions) {
      setIsFormValid(false);
      return;
    }

    // Always need questions when hasSwitchedToQuestions is true
    if (!generatedQuestions || generatedQuestions.length === 0) {
      setIsFormValid(false);
      return;
    }

    // Check each question is complete
    for (const q of generatedQuestions) {
      if (!q.question || !q.options || q.options.length !== 4 || !q.answer) {
        setIsFormValid(false);
        return;
      }
    }

    setIsFormValid(true);
  };

  // Initialize with template when switching to questions mode
  React.useEffect(() => {
    if (mode === "questions" && !generatedQuestions) {
      // Initialize with default questions matching the prompt count
      const defaultQuestions = Array.from({ length: promptCount }, (_, i) => ({
        id: i + 1,
        question: "Your question here",
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer: "Option A",
      }));
      setGeneratedQuestions(defaultQuestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, promptCount]);

  // Validate form whenever inputs change
  React.useEffect(() => {
    validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    characterName,
    apiKey,
    image,
    prompts,
    generatedQuestions,
    hasSwitchedToQuestions,
  ]);

  // Load prompt suggestions on mount
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get("/api/prompts");
        if (res.data.prompts) {
          setPromptSuggestions(res.data.prompts);
        }
      } catch (err) {
        console.error("Failed to load prompt suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  // Load API key from localStorage on mount
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem("uploadApiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  React.useEffect(() => {
    if (apiKey) {
      localStorage.setItem("uploadApiKey", apiKey);
    }
  }, [apiKey]);

  // Show welcome modal on mount if user hasn't seen it
  React.useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenUploadWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePromptCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setPromptCount(count);
    setPrompts(Array(count).fill(""));
    setDifficulties(Array(count).fill(1));
  };

  const handleDifficultyChange = (index, value) => {
    let num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 10) {
      num = 1;
    }
    const newDifficulties = [...difficulties];
    newDifficulties[index] = num;
    setDifficulties(newDifficulties);
  };

  // Handler to update question text
  const handleQuestionTextChange = (index, value) => {
    if (!generatedQuestions) return;
    const updated = [...generatedQuestions];
    updated[index].question = value;
    setGeneratedQuestions(updated);
  };

  // Handler to update option text
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    if (!generatedQuestions) return;
    const updated = [...generatedQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setGeneratedQuestions(updated);
  };

  // Handler to update answer
  const handleAnswerChange = (questionIndex, value) => {
    if (!generatedQuestions) return;
    const updated = [...generatedQuestions];
    updated[questionIndex].answer = value;
    setGeneratedQuestions(updated);
  };

  // Handler to add new question
  const handleAddQuestion = () => {
    const newQuestion = {
      id: (generatedQuestions?.length || 0) + 1,
      question: "Your question here",
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
    };
    setGeneratedQuestions([...(generatedQuestions || []), newQuestion]);
  };

  // Handler to delete question
  const handleDeleteQuestion = (index) => {
    if (!generatedQuestions) return;
    const updated = generatedQuestions.filter((_, i) => i !== index);
    setGeneratedQuestions(updated.length > 0 ? updated : null);
    // Also update promptCount to match
    setPromptCount(updated.length);
  };

  const handleGenerateQuestions = async () => {
    if (!topic || !apiKey) {
      return;
    }

    try {
      setGeneratingQuestions(true);
      const form = new FormData();
      form.append("api_key", apiKey);
      form.append("topic", topic);
      form.append("num_questions", promptCount);
      difficulties.forEach((d) => form.append("difficulties", d));

      const res = await axios.post("/api/generate-questions", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 2 minutes timeout
      });

      if (res.data.success) {
        setGeneratedQuestions(res.data.questions);
      } else {
        throw new Error(res.data.message || "Failed to generate questions");
      }
    } catch (err) {
      console.error("❌ Generate questions error:", err);
      // Show error modal with message
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to generate questions. Please try again.";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      return;
    }

    try {
      const form = new FormData();
      form.append("password", adminPassword);
      const res = await axios.post("/api/verify-password", form);
      if (res.data.valid) {
        // Save password to localStorage for admin API calls
        localStorage.setItem("admin_password", adminPassword);
        // Clear saved admin page to start from block 0 when logging in
        localStorage.removeItem("adminPage");
        navigate("/admin");
      } else {
        setErrorMessage("Incorrect password!");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Error verifying password:", err);
      setErrorMessage("Failed to verify password. Please try again.");
      setShowErrorModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submit
    if (!isFormValid) {
      return;
    }

    const form = new FormData();
    form.append("name", characterName);
    form.append("api_key", apiKey);
    prompts.forEach((p) => form.append("prompts", p));
    form.append("image", image);

    // Add questions JSON if questions exist
    if (generatedQuestions && generatedQuestions.length > 0) {
      form.append("questions_json", JSON.stringify(generatedQuestions));
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Upload success:", res.data);

      // Save current API key before resetting
      const currentApiKey = apiKey;

      // Reset all form fields except API key
      setCharacterName("");
      setImage(null);
      setImagePreview(null);
      setPromptCount(4);
      setPrompts(Array(4).fill(""));
      setMode("images");
      setTopic("");
      setDifficulties(Array(4).fill(1));
      setGeneratedQuestions(null);
      setHasSwitchedToQuestions(false);
      setShowSuggestions(Array(4).fill(false));

      // Restore API key
      setApiKey(currentApiKey);

      // Show success modal
      setShowSuccessModal(true);

      // Close success modal after 2 seconds (stay on page)
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      // Show error modal with message - form data remains unchanged
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Upload failed. Please try again.";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .questions-scroll-container::-webkit-scrollbar {
          width: 10px;
        }
        .questions-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .questions-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 15, 135, 0.5);
          border-radius: 10px;
        }
        .questions-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 15, 135, 0.7);
        }
      `,
        }}
      />
      <div
        style={{
          backgroundColor: "#000000",
          padding: "2rem",
          color: "#F2F2F2",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
        {/* Left column: character info */}
        <div
          style={{
            width: "48%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
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
              top: "60px",
              left: "20px",
              background: "transparent",
              border: "1px solid rgba(242, 242, 242, 0.12)",
              color: "#F2F2F2",
              padding: "10px 20px",
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: "15px",
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
              position: "absolute",
              top: "60px",
              right: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowWelcomeModal(true)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255, 15, 135, 0.2)",
                border: "1px solid rgba(255, 15, 135, 0.5)",
                color: "#FF0F87",
                fontSize: FONT_SIZES.md,
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(255, 15, 135, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#FF0F87";
                e.target.style.color = "#fff";
                e.target.style.transform = "scale(1.1)";
                e.target.style.boxShadow = "0 4px 12px rgba(255, 15, 135, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 15, 135, 0.2)";
                e.target.style.color = "#FF0F87";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 2px 8px rgba(255, 15, 135, 0.3)";
              }}
            >
              ?
            </button>
            <button
              onClick={() => setShowAdminLogin(true)}
              style={{
                background: "#FF0F87",
                border: "1px solid #FF0F87",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: FONT_SIZES.sm,
                fontWeight: "600",
                boxShadow: "0 4px 16px rgba(255, 0, 76, 0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#ff2b9e";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#FF0F87";
                e.target.style.transform = "translateY(0)";
              }}
            >
              Admin Login
            </button>
          </div>

          <h1
            style={{
              marginBottom: "1.4rem",
              fontSize: "48px",
              background:
                "linear-gradient(90deg, #9D4EDD 0%, #FF0F87 50%, #FF6B35 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Erotic Saga
          </h1>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            {/* Enter API Key */}
            <div
              style={{
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                Eternal AI API Key
              </h3>
              <a
                href="https://eternalai.org/api/keys"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: FONT_SIZES.sm,
                  color: "#FF0F87",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#ff2b9e";
                  e.target.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#FF0F87";
                  e.target.style.textDecoration = "none";
                }}
              >
                (Get API Key)
              </a>
            </div>
            <input
              type="password"
              placeholder="Enter API Key..."
              onChange={(e) => setApiKey(e.target.value)}
              value={apiKey}
              required
              style={{
                marginBottom: "20px",
                padding: "5.6px",
                width: "100%",
                fontSize: FONT_SIZES.md,
                borderRadius: "6px",
                border: "1px solid #FF0F87",
                background: "rgba(20,20,20,0.8)",
                color: "#F2F2F2",
                boxShadow: "0 0 10px #FF004C",
              }}
            />

            {/* Enter character name */}
            <h3
              style={{
                marginBottom: "8px",
                fontSize: FONT_SIZES.sm,
                color: "#fff",
                fontWeight: "500",
              }}
            >
              Character Name
            </h3>
            <input
              type="text"
              placeholder="Enter character name..."
              onChange={(e) => setCharacterName(e.target.value)}
              value={characterName}
              required
              style={{
                marginBottom: "20px",
                padding: "5.6px",
                width: "100%",
                fontSize: FONT_SIZES.md,
                borderRadius: "6px",
                border: "1px solid #FF0F87",
                background: "rgba(20,20,20,0.8)",
                color: "#F2F2F2",
                boxShadow: "0 0 10px #FF004C",
              }}
            />

            {/* Choose character image */}
            <h3
              style={{
                marginBottom: "8px",
                fontSize: FONT_SIZES.sm,
                color: "#fff",
                fontWeight: "500",
              }}
            >
              Character Image
            </h3>

            {imagePreview ? (
              <div style={{ marginBottom: "20px", position: "relative" }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "2px solid rgba(255, 15, 135, 0.3)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(255, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: FONT_SIZES.lg,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 0, 0, 1)";
                    e.target.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 0, 0, 0.8)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  marginBottom: "20px",
                  padding: "40px 20px",
                  border: `2px dashed ${
                    isDragging ? "#FF0F87" : "rgba(255, 255, 255, 0.1)"
                  }`,
                  borderRadius: "12px",
                  background: isDragging
                    ? "rgba(255, 15, 135, 0.1)"
                    : "rgba(255, 255, 255, 0.02)",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  position: "relative",
                }}
                onClick={() =>
                  document.getElementById("image-upload-input")?.click()
                }
              >
                <div style={{ position: "relative", marginBottom: "20px" }}>
                  {/* Stack of photo icons */}
                  <div
                    style={{
                      position: "relative",
                      width: "80px",
                      height: "80px",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        width: "64px",
                        height: "64px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        width: "64px",
                        height: "64px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "64px",
                        height: "64px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                      }}
                    >
                      📷
                    </div>
                    {/* Plus button */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-5px",
                        right: "-5px",
                        width: "32px",
                        height: "32px",
                        background: "rgba(255, 15, 135, 0.9)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: FONT_SIZES.lg,
                        fontWeight: "bold",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 2px 8px rgba(255, 15, 135, 0.3)",
                      }}
                    >
                      +
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: FONT_SIZES.md,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  Upload, drop or paste photo
                </div>
                <div
                  style={{
                    fontSize: FONT_SIZES.xs,
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  People, scenes, products — anything
                </div>
              </div>
            )}

            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </form>
        </div>

        {/* Right column: prompts/questions and submit button */}
        <div
          style={{
            width: "48%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          {/* Mode toggle */}
          <div
            style={{
              display: "inline-flex",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 15, 135, 0.2)",
              borderRadius: "999px",
              padding: "4px",
              position: "relative",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("images")}
              style={{
                color: mode === "images" ? "#fff" : "rgba(242, 242, 242, 0.6)",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "600",
                padding: "10px 24px",
                borderRadius: "999px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                zIndex: 1,
                background:
                  mode === "images"
                    ? "linear-gradient(135deg, #FF0F87 0%, #ff2b9e 100%)"
                    : "transparent",
                border: "none",
                cursor: "pointer",
                boxShadow:
                  mode === "images"
                    ? "0 4px 12px rgba(255, 15, 135, 0.4)"
                    : "none",
              }}
            >
              Images
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("questions");
                setHasSwitchedToQuestions(true);
              }}
              style={{
                color:
                  mode === "questions" ? "#fff" : "rgba(242, 242, 242, 0.6)",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "600",
                padding: "10px 24px",
                borderRadius: "999px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                zIndex: 1,
                background:
                  mode === "questions"
                    ? "linear-gradient(135deg, #FF0F87 0%, #ff2b9e 100%)"
                    : "transparent",
                border: "none",
                cursor: "pointer",
                boxShadow:
                  mode === "questions"
                    ? "0 4px 12px rgba(255, 15, 135, 0.4)"
                    : "none",
              }}
            >
              Questions
            </button>
          </div>

          <h2
            style={{
              width: "100%",
              marginTop: "14px",
              fontSize: FONT_SIZES.md,
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            {mode === "images"
              ? "Number of generating image"
              : "Number of questions"}
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            {/* Number of prompts/questions */}
            <input
              type="number"
              min="1"
              placeholder="Number of prompts"
              onChange={handlePromptCountChange}
              value={promptCount}
              style={{
                marginBottom: "7px",
                padding: "5.6px",
                width: "100%",
                fontSize: FONT_SIZES.md,
                borderRadius: "6px",
                border: "1px solid #FF0F87",
                background: "rgba(20,20,20,0.8)",
                color: "#F2F2F2",
                boxShadow: "0 0 10px #FF004C",
              }}
            />

            {/* Images Mode */}
            {mode === "images" && (
              <>
                <h4
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    marginBottom: "4px",
                    fontSize: FONT_SIZES.md,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  Generating image
                </h4>
                <p
                  style={{
                    width: "100%",
                    marginTop: "0px",
                    marginBottom: "16px",
                    fontSize: FONT_SIZES.xs,
                    color: "rgba(255, 255, 255, 0.5)",
                    lineHeight: "1.4",
                  }}
                >
                  Each prompt generates a reward image, unlocked by answering
                  questions in order.
                </p>

                {prompts.map((p, i) => (
                  <div
                    key={i}
                    style={{ marginBottom: "5.6px", position: "relative" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        marginBottom: "5px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder={`Prompt ${i + 1}`}
                        value={p}
                        onChange={(e) => {
                          const copy = [...prompts];
                          copy[i] = e.target.value;
                          setPrompts(copy);
                        }}
                        required
                        style={{
                          flex: 1,
                          padding: "5.6px",
                          fontSize: FONT_SIZES.md,
                          borderRadius: "6px",
                          border: "1px solid #FF0F87",
                          background: "rgba(20,20,20,0.8)",
                          color: "#F2F2F2",
                          boxShadow: "0 0 10px #FF004C",
                        }}
                      />
                      {promptSuggestions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            // Close all other suggestions first
                            const newShow = Array(prompts.length).fill(false);
                            // Toggle the clicked button's suggestion
                            newShow[i] = !showSuggestions[i];
                            setShowSuggestions(newShow);
                          }}
                          style={{
                            padding: "5.6px 10.5px",
                            background: showSuggestions[i]
                              ? "#FF0F87"
                              : "transparent",
                            border: showSuggestions[i]
                              ? "1px solid #FF0F87"
                              : "1px solid #F2F2F2",
                            borderRadius: "6px",
                            color: "#F2F2F2",
                            cursor: "pointer",
                            fontSize: FONT_SIZES.xs,
                            whiteSpace: "nowrap",
                            boxShadow: showSuggestions[i]
                              ? "0 0 10px #FF004C"
                              : undefined,
                          }}
                        >
                          Suggestions
                        </button>
                      )}
                    </div>
                    {showSuggestions[i] && promptSuggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: "#1f1f2e",
                          border: "2px solid #FF0F87",
                          borderRadius: "6px",
                          maxHeight: "140px",
                          overflowY: "auto",
                          marginTop: "5px",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                        }}
                      >
                        {promptSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              const copy = [...prompts];
                              copy[i] = suggestion;
                              setPrompts(copy);
                              const newShow = [...showSuggestions];
                              newShow[i] = false;
                              setShowSuggestions(newShow);
                            }}
                            style={{
                              padding: "7px",
                              cursor: "pointer",
                              fontSize: FONT_SIZES.xs,
                              borderBottom:
                                idx < promptSuggestions.length - 1
                                  ? "1px solid #444"
                                  : "none",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "#FF0F87";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "transparent";
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Questions Mode */}
            {mode === "questions" && (
              <>
                {/* Topic input */}
                <h3
                  style={{
                    marginTop: "7px",
                    marginBottom: "5.6px",
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  Topic for Questions
                </h3>
                <input
                  type="text"
                  placeholder="e.g., Science, History, General Knowledge"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{
                    marginBottom: "10.5px",
                    padding: "5.6px",
                    width: "100%",
                    fontSize: FONT_SIZES.sm,
                    borderRadius: "6px",
                    border: "1px solid #FF0F87",
                    background: "rgba(20,20,20,0.8)",
                    color: "#F2F2F2",
                    boxShadow: "0 0 10px #FF004C",
                  }}
                />

                {/* Difficulty levels */}
                <h3
                  style={{
                    marginTop: "7px",
                    marginBottom: "5.6px",
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  Difficulty Levels (1-10)
                </h3>
                {difficulties.map((difficulty, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px", width: "84px" }}>
                      Question {i + 1}:
                    </span>
                    <input
                      type="number"
                      value={difficulty}
                      onChange={(e) =>
                        handleDifficultyChange(i, e.target.value)
                      }
                      onBlur={(e) => handleDifficultyChange(i, e.target.value)}
                      placeholder="Enter 1-10"
                      style={{
                        width: "56px",
                        padding: "5.6px",
                        fontSize: FONT_SIZES.xs,
                        borderRadius: "6px",
                        border: "1px solid #FF0F87",
                        background: "rgba(20,20,20,0.8)",
                        color: "#F2F2F2",
                        boxShadow: "0 0 10px #FF004C",
                      }}
                    />
                    <select
                      value={difficulty}
                      onChange={(e) =>
                        handleDifficultyChange(i, e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "5.6px",
                        fontSize: FONT_SIZES.xs,
                        borderRadius: "6px",
                        border: "1px solid #FF0F87",
                        background: "#1f1f2e",
                        color: "#F2F2F2",
                        cursor: "pointer",
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                        <option key={level} value={level}>
                          Level {level}{" "}
                          {level <= 3
                            ? "(Easy)"
                            : level <= 6
                            ? "(Medium)"
                            : "(Hard)"}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* Generate Questions button */}
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={generatingQuestions || !topic || !apiKey}
                  style={{
                    marginTop: "16px",
                    padding: "14px 48px",
                    background: "#FF0F87",
                    border: "1px solid #FF0F87",
                    borderRadius: "999px",
                    color: "#F2F2F2",
                    cursor:
                      generatingQuestions || !topic || !apiKey
                        ? "not-allowed"
                        : "pointer",
                    fontSize: FONT_SIZES.md,
                    fontWeight: "600",
                    width: "100%",
                    boxShadow:
                      generatingQuestions || !topic || !apiKey
                        ? "0 4px 16px rgba(255, 0, 76, 0.4)"
                        : "0 4px 16px rgba(255, 0, 76, 0.4)",
                    transition: "all 0.2s",
                    letterSpacing: "0.01em",
                    opacity:
                      generatingQuestions || !topic || !apiKey ? "0.6" : "1",
                  }}
                  onMouseEnter={(e) => {
                    if (!generatingQuestions && topic && apiKey) {
                      e.target.style.background = "#ff2b9e";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 6px 20px rgba(255, 0, 76, 0.6)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!generatingQuestions && topic && apiKey) {
                      e.target.style.background = "#FF0F87";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 4px 16px rgba(255, 0, 76, 0.4)";
                    }
                  }}
                >
                  {generatingQuestions
                    ? "⏳ Generating..."
                    : !topic
                    ? "Please enter topic to generate questions"
                    : "Generate Questions"}
                </button>

                {/* Questions UI Editor */}
                <div style={{ marginTop: "20px", width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: FONT_SIZES.md,
                        fontWeight: "600",
                        color: "#fff",
                      }}
                    >
                      Edit Questions:
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      style={{
                        padding: "8px 16px",
                        background: "rgba(255, 15, 135, 0.2)",
                        border: "1px solid #FF0F87",
                        borderRadius: "8px",
                        color: "#FF0F87",
                        fontSize: FONT_SIZES.sm,
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#FF0F87";
                        e.target.style.color = "#fff";
                        e.target.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255, 15, 135, 0.2)";
                        e.target.style.color = "#FF0F87";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      Add Question
                    </button>
                  </div>

                  {generatedQuestions && generatedQuestions.length > 0 ? (
                    <div
                      className="questions-scroll-container"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        paddingRight: "10px",
                        // Custom scrollbar styles for Firefox
                        background: "rgba(20,20,20,0.8)",
                        borderRadius: "12px",
                        scrollbarWidth: "thin",
                        scrollbarColor:
                          "rgba(255, 15, 135, 0.5) rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      {generatedQuestions.map((q, qIndex) => (
                        <div
                          key={qIndex}
                          style={{
                            marginBottom: "24px",
                            padding: "20px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "3px solid rgba(255, 15, 135, 0.2)",
                            borderRadius: "12px",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: FONT_SIZES.sm,
                                fontWeight: "600",
                                color: "#FF0F87",
                              }}
                            >
                              Question {qIndex + 1}:
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(qIndex)}
                              style={{
                                padding: "4px 8px",
                                background: "rgba(255, 0, 0, 0.1)",
                                border: "1px solid rgba(255, 0, 0, 0.3)",
                                borderRadius: "6px",
                                color: "#ff4444",
                                fontSize: FONT_SIZES.xs,
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#ff4444";
                                e.target.style.color = "#fff";
                                e.target.style.transform = "translateY(-1px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "rgba(255, 0, 0, 0.1)";
                                e.target.style.color = "#ff4444";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              Delete
                            </button>
                          </div>

                          {/* Question text input */}
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              handleQuestionTextChange(qIndex, e.target.value)
                            }
                            placeholder="Enter your question..."
                            style={{
                              width: "97%",
                              padding: "12px",
                              marginBottom: "16px",
                              fontSize: FONT_SIZES.sm,
                              borderRadius: "8px",
                              border: "1px solid rgba(255, 15, 135, 0.2)",
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "#fff",
                              transition: "all 0.2s",
                              outline: "none",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#FF0F87";
                              e.target.style.background =
                                "rgba(255, 255, 255, 0.06)";
                              e.target.style.boxShadow =
                                "0 0 0 3px rgba(255, 15, 135, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor =
                                "rgba(255, 15, 135, 0.2)";
                              e.target.style.background =
                                "rgba(255, 255, 255, 0.04)";
                              e.target.style.boxShadow = "none";
                            }}
                          />

                          {/* Options */}
                          {q.options &&
                            q.options.map((option, oIndex) => (
                              <div
                                key={oIndex}
                                style={{
                                  marginBottom: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`answer-${qIndex}`}
                                  checked={q.answer === option}
                                  onChange={() =>
                                    handleAnswerChange(qIndex, option)
                                  }
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    cursor: "pointer",
                                  }}
                                />
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      qIndex,
                                      oIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Option ${String.fromCharCode(
                                    65 + oIndex
                                  )}`}
                                  style={{
                                    flex: 1,
                                    padding: "10px",
                                    fontSize: FONT_SIZES.sm,
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 15, 135, 0.2)",
                                    background: "rgba(255, 255, 255, 0.04)",
                                    color: "#fff",
                                    transition: "all 0.2s",
                                    outline: "none",
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = "#FF0F87";
                                    e.target.style.background =
                                      "rgba(255, 255, 255, 0.06)";
                                    e.target.style.boxShadow =
                                      "0 0 0 3px rgba(255, 15, 135, 0.1)";
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor =
                                      "rgba(255, 15, 135, 0.2)";
                                    e.target.style.background =
                                      "rgba(255, 255, 255, 0.04)";
                                    e.target.style.boxShadow = "none";
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "rgba(242, 242, 242, 0.5)",
                        fontSize: FONT_SIZES.sm,
                      }}
                    >
                      No questions yet. Use "Generate Questions" to create them.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || generatingQuestions || !isFormValid}
              style={{
                marginTop: "16px",
                padding: "14px 48px",
                background: "#FF0F87",
                border: "1px solid #FF0F87",
                borderRadius: "999px",
                color: "#F2F2F2",
                cursor:
                  loading || generatingQuestions || !isFormValid
                    ? "not-allowed"
                    : "pointer",
                fontSize: FONT_SIZES.md,
                fontWeight: "600",
                width: "100%",
                boxShadow:
                  loading || generatingQuestions || !isFormValid
                    ? "0 4px 16px rgba(255, 0, 76, 0.4)"
                    : "0 4px 16px rgba(255, 0, 76, 0.4)",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
                opacity:
                  loading || generatingQuestions || !isFormValid ? "0.6" : "1",
              }}
              onMouseEnter={(e) => {
                if (!loading && !generatingQuestions && isFormValid) {
                  e.target.style.background = "#ff2b9e";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(255, 0, 76, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !generatingQuestions && isFormValid) {
                  e.target.style.background = "#FF0F87";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 16px rgba(255, 0, 76, 0.4)";
                }
              }}
            >
              {loading
                ? "⏳ Uploading..."
                : !isFormValid
                ? "Please fill all required fields correctly"
                : "Submit"}
            </button>
          </form>
        </div>

        {/* Error Modal */}
        {showErrorModal && (
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
                border: "1px solid rgba(255, 15, 135, 0.3)",
                borderRadius: "16px",
                maxWidth: "600px",
                width: "100%",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(255, 15, 135, 0.3)",
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
                  Upload Failed
                </h2>
                <button
                  onClick={() => setShowErrorModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(242, 242, 242, 0.6)",
                    fontSize: FONT_SIZES.lg,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 15, 135, 0.1)";
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
                    fontSize: FONT_SIZES.md,
                    color: "#F2F2F2",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {errorMessage}
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
                  onClick={() => setShowErrorModal(false)}
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
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(255, 0, 76, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#FF0F87";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(255, 0, 76, 0.4)";
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Login Modal */}
        {showAdminLogin && (
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
                border: "1px solid rgba(255, 15, 135, 0.3)",
                borderRadius: "16px",
                maxWidth: "400px",
                width: "100%",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(255, 15, 135, 0.3)",
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
                  Admin Login
                </h2>
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword("");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(242, 242, 242, 0.6)",
                    fontSize: FONT_SIZES.lg,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 15, 135, 0.1)";
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
                <input
                  type="password"
                  placeholder="Enter admin password..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdminLogin();
                    }
                  }}
                  style={{
                    padding: "12px 16px",
                    fontSize: FONT_SIZES.sm,
                    borderRadius: "10px",
                    width: "100%",
                    border: "1px solid rgba(255, 15, 135, 0.12)",
                    background: "rgba(20, 20, 20, 0.8)",
                    color: "#F2F2F2",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    marginBottom: "20px",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#FF0F87";
                    e.target.style.background = "rgba(20, 20, 20, 0.95)";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(255, 15, 135, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 15, 135, 0.12)";
                    e.target.style.background = "rgba(20, 20, 20, 0.8)";
                    e.target.style.boxShadow = "none";
                  }}
                />
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
                    setShowAdminLogin(false);
                    setAdminPassword("");
                  }}
                  style={{
                    padding: "14px 32px",
                    background: "transparent",
                    border: "1px solid rgba(242, 242, 242, 0.12)",
                    borderRadius: "999px",
                    color: "#F2F2F2",
                    fontSize: FONT_SIZES.md,
                    fontWeight: "600",
                    cursor: "pointer",
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
                  Cancel
                </button>
                <button
                  onClick={handleAdminLogin}
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
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(255, 0, 76, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#FF0F87";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(255, 0, 76, 0.4)";
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
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
                border: "1px solid rgba(0, 255, 100, 0.3)",
                borderRadius: "16px",
                maxWidth: "600px",
                width: "100%",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0, 255, 100, 0.3)",
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
                      "linear-gradient(135deg, #00ff64 0%, #00cc50 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Upload Successful!
                </h2>
              </div>
              <div style={{ padding: "32px" }}>
                <div
                  style={{
                    fontSize: FONT_SIZES.md,
                    color: "#F2F2F2",
                    lineHeight: "1.6",
                    textAlign: "center",
                  }}
                >
                  Your character has been uploaded successfully! You can
                  continue adding more characters.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Modal - How to Add Character */}
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
                  Add Your Own Character
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
                  To add your own character, follow these steps:
                  {"\n\n"}
                  1. Enter your Eternal AI API Key (get it from
                  eternalai.org/api/keys)
                  {"\n"}
                  2. Enter a character name
                  {"\n"}
                  3. Upload or drag & drop a character image
                  {"\n"}
                  4. Enter number of generating images/questions
                  {"\n"}
                  5. Enter prompts manually or choose "Prompts" mode (use
                  prompts from suggestions)
                  {"\n"}
                  6. Enter Questions manually or choose "Questions" mode
                  (generate questions automatically)
                  {"\n"}
                  7. Fill in all required fields and click Submit
                  {"\n\n"}
                  Your character will be created and available for others to
                  play!
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
                    localStorage.setItem("hasSeenUploadWelcome", "true");
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
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(255, 0, 76, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#FF0F87";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(255, 0, 76, 0.4)";
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
