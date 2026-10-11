// FoundryOS Customer-Centric Client Engine
document.addEventListener("DOMContentLoaded", () => {
  // Load saved company info or defaults
  const savedCompanyInfo = localStorage.getItem("foundry_company_info");
  const initialInfo = savedCompanyInfo
    ? JSON.parse(savedCompanyInfo)
    : {
        name: "FoundryOS",
        website: "https://foundryos.com",
        oneLiner: "The AI Marketing Operating System for startups. Give founders a coordinated AI marketing team instead of disconnected tools.",
        audience: "Early-stage B2B SaaS and technical founders with 1-20 employees.",
        problem: "Founders waste weeks juggling disconnected AI tools with zero persistent company context, inconsistent messaging, and no clear path to revenue.",
        competitors: "Generic AI chat tools (ChatGPT, Claude), fragmented point tools, and expensive traditional marketing agencies.",
        tone: "Confident, Human & Clear",
        avoidTone: "Buzzwords, overly corporate jargon, and generic AI hype words.",
        pricing: "Tiered monthly subscription ($49 - $199/mo) with full workforce access.",
        goal: "Acquire our first 100 paying startup founders and scale organic search."
      };

  const state = {
    currentView: "chat-view",
    theme: localStorage.getItem("foundry_theme") || "dark",
    tenantId: "tenant-foundry-dev",
    selectedEmployeeId: "auto",
    activeAttachment: null,
    telemetryLogs: [],
    companyInfo: initialInfo,
    onboardingSlideIndex: 0,
    employees: [
      {
        id: "foundryos-assistant",
        name: "FoundryOS Assistant",
        title: "AI Startup Marketing Advisor",
        pillar: "Advisory",
        role: "general_assistant",
        avatar: "FOS",
        desc: "General startup marketing guidance, platform questions, and high-level strategic orientation.",
        specialties: ["Platform Guidance", "Startup Strategy", "Advisory", "Marketing Direction"],
        defaultPrompt: "What marketing initiative should our startup prioritize next?"
      },
      {
        id: "market-research-analyst",
        name: "Market Research Analyst",
        title: "Senior Market Intelligence Specialist",
        pillar: "Research",
        role: "marketing_analyst",
        avatar: "MR",
        desc: "Uncovers market demand trends, customer buying motives, and high-growth opportunities.",
        specialties: ["Customer Demand", "Market Size", "Pain Point Discovery", "Industry Shifts"],
        defaultPrompt: "Analyze customer demand and market opportunities for our product."
      },
      {
        id: "competitor-analyst",
        name: "Competitor Intelligence Analyst",
        title: "Lead Competitive Intelligence Officer",
        pillar: "Research",
        role: "competitor_analyst",
        avatar: "CI",
        desc: "Analyzes competitor strengths, uncovers pricing and feature gaps, and crafts counter-tactics.",
        specialties: ["Competitor Teardowns", "Feature Gaps", "Pricing Analysis", "Differentiation"],
        defaultPrompt: "Analyze our competitors, spot their weaknesses, and tell us how to stand out."
      },
      {
        id: "chief-marketing-strategist",
        name: "Chief Marketing Strategist",
        title: "VP of Brand & Strategic Growth",
        pillar: "Strategy",
        role: "strategist",
        avatar: "CS",
        desc: "Transforms company vision into an unforgettable brand narrative, positioning statement, and channel focus.",
        specialties: ["Positioning Statements", "Core Value Proposition", "Brand Pillars", "Channel Focus"],
        defaultPrompt: "Create our core company positioning statement and strategic marketing pillars."
      },
      {
        id: "gtm-funnel-strategist",
        name: "GTM & Funnel Strategist",
        title: "Principal Funnel Architect",
        pillar: "Strategy",
        role: "strategist",
        avatar: "FS",
        desc: "Architects high-converting 3-stage customer funnels and irresistible launch offers.",
        specialties: ["Customer Journey", "Conversion Funnels", "Irresistible Offers", "Growth KPIs"],
        defaultPrompt: "Design a 3-step go-to-market funnel to convert strangers into paying customers."
      }
    ],
    artifacts: [],
    archivedDocuments: [],
    archiveExpanded: false,
    activeAttachments: []
  };

  // 1. Theme Management (Black & White Theme)
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("foundry_theme", theme);

    const btnLabel = document.getElementById("theme-btn-label");
    const moonIcon = document.querySelector(".theme-icon-moon");
    const sunIcon = document.querySelector(".theme-icon-sun");

    if (theme === "light") {
      if (btnLabel) btnLabel.textContent = "Light";
      if (moonIcon) moonIcon.style.display = "none";
      if (sunIcon) sunIcon.style.display = "inline-block";
    } else {
      if (btnLabel) btnLabel.textContent = "Dark";
      if (moonIcon) moonIcon.style.display = "inline-block";
      if (sunIcon) sunIcon.style.display = "none";
    }
  }

  applyTheme(state.theme);

  const themeToggleBtn = document.getElementById("btn-theme-toggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  // 2. Navigation Handling
  const navItems = document.querySelectorAll(".nav-item");
  const viewPanels = document.querySelectorAll(".view-panel");
  const activeViewName = document.getElementById("active-view-name");

  const viewTitles = {
    "chat-view": "Marketing Workspace",
    "employees-view": "Your AI Marketing Team",
    "brain-view": "Company Knowledge Base",
    "archive-view": "Saved Marketing Reports",
    "plugins-view": "Model Context Protocol & Plugins",
    "token-analytics-view": "Token Analytics"
  };

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetView = btn.getAttribute("data-view");
      if (!targetView) return;

      navItems.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      viewPanels.forEach((panel) => {
        panel.classList.remove("active");
        if (panel.id === targetView) {
          panel.classList.add("active");
        }
      });

      state.currentView = targetView;
      if (activeViewName && viewTitles[targetView]) {
        activeViewName.textContent = viewTitles[targetView];
      }

      if (targetView === "token-analytics-view") {
        inspectLiveContext();
      }
      if (targetView === "plugins-view") {
        fetchMcpServersAndTools();
      }
    });
  });

  // 3. Brain Completeness Score Calculation
  function calculateBrainCompleteness() {
    let score = 0;
    const info = state.companyInfo;

    // 6 Compulsory fields (12.5% each = 75% max)
    if (info.name && info.name.trim().length > 1) score += 12.5;
    if (info.oneLiner && info.oneLiner.trim().length > 5) score += 12.5;
    if (info.audience && info.audience.trim().length > 5) score += 12.5;
    if (info.problem && info.problem.trim().length > 5) score += 12.5;
    if (info.competitors && info.competitors.trim().length > 3) score += 12.5;
    if (info.tone && info.tone.trim().length > 2) score += 12.5;

    // 2 Optional fields (12.5% each = 25% max)
    if (info.pricing && info.pricing.trim().length > 2) score += 12.5;
    if (info.goal && info.goal.trim().length > 3) score += 12.5;

    return Math.round(score);
  }

  function updateBrainProgressDisplay() {
    const percent = calculateBrainCompleteness();
    const percentEl = document.getElementById("brain-completeness-percent");
    const barEl = document.getElementById("brain-completeness-bar");
    const statusEl = document.getElementById("brain-comp-status");
    const brainStatEl = document.getElementById("stat-brain-completeness");

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;
    if (brainStatEl) brainStatEl.textContent = `${percent}%`;

    if (statusEl) {
      if (percent >= 100) {
        statusEl.textContent = "100% Fully Trained";
      } else if (percent >= 75) {
        statusEl.textContent = "6/6 Core Details Set";
      } else if (percent > 0) {
        const coreCount = [
          state.companyInfo.name,
          state.companyInfo.oneLiner,
          state.companyInfo.audience,
          state.companyInfo.problem,
          state.companyInfo.competitors,
          state.companyInfo.tone
        ].filter((v) => Boolean(v && v.trim().length > 1)).length;
        statusEl.textContent = `${coreCount}/6 Core Details Set`;
      } else {
        statusEl.textContent = "Setup Required";
      }
    }

    // Update table in brain view
    const compEl = document.getElementById("table-summary-company");
    const audEl = document.getElementById("table-summary-audience");
    const probEl = document.getElementById("table-summary-problem");
    const compWatchEl = document.getElementById("table-summary-competitors");
    const toneEl = document.getElementById("table-summary-tone");
    const pricingEl = document.getElementById("table-summary-pricing");
    const goalEl = document.getElementById("table-summary-goal");
    const pricingBadge = document.getElementById("badge-summary-pricing");
    const goalBadge = document.getElementById("badge-summary-goal");

    if (compEl) compEl.textContent = state.companyInfo.name ? `${state.companyInfo.name}: ${state.companyInfo.oneLiner || "No one-liner set"}` : "Click Edit to set company name";
    if (audEl) audEl.textContent = state.companyInfo.audience || "Click Edit to set target audience";
    if (probEl) probEl.textContent = state.companyInfo.problem || "Click Edit to set customer problem";
    if (compWatchEl) compWatchEl.textContent = state.companyInfo.competitors || "Click Edit to list competitors";
    if (toneEl) toneEl.textContent = `${state.companyInfo.tone || "Confident & Human"}. Avoid: ${state.companyInfo.avoidTone || "None"}`;

    if (pricingEl) {
      pricingEl.textContent = state.companyInfo.pricing || "Not configured yet (Click edit to add)";
      if (pricingBadge) {
        pricingBadge.textContent = state.companyInfo.pricing ? "Saved" : "Optional";
        pricingBadge.style.opacity = state.companyInfo.pricing ? "1" : "0.7";
      }
    }

    if (goalEl) {
      goalEl.textContent = state.companyInfo.goal || "Not configured yet (Click edit to add)";
      if (goalBadge) {
        goalBadge.textContent = state.companyInfo.goal ? "Saved" : "Optional";
        goalBadge.style.opacity = state.companyInfo.goal ? "1" : "0.7";
      }
    }
  }

  updateBrainProgressDisplay();

  // 4. Onboarding Slides Wizard System (6 Compulsory + 2 Optional)
  const slidesData = [
    {
      id: "company",
      isCompulsory: true,
      question: "What is your company or product name?",
      helpText: "Enter your brand name and official website or link.",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Company / Product Name *</label>
          <input type="text" id="slide-input-name" class="input-standard" placeholder="e.g. Acme Cloud" value="${info.name || ""}">
        </div>
        <div class="form-group">
          <label class="form-label">Website or Landing Page</label>
          <input type="text" id="slide-input-website" class="input-standard" placeholder="e.g. https://acme.com" value="${info.website || ""}">
        </div>
      `,
      save: () => {
        const name = document.getElementById("slide-input-name")?.value.trim();
        const website = document.getElementById("slide-input-website")?.value.trim();
        if (!name) return false;
        state.companyInfo.name = name;
        state.companyInfo.website = website || "";
        return true;
      }
    },
    {
      id: "oneliner",
      isCompulsory: true,
      question: "In plain English, what does your product actually do?",
      helpText: "Write 1 or 2 simple sentences explaining what you offer. No corporate jargon.",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Product Summary *</label>
          <textarea id="slide-input-oneliner" class="input-standard" rows="3" placeholder="e.g. We give startup founders an automated AI marketing team that handles competitor research, positioning, and content launch.">${info.oneLiner || ""}</textarea>
        </div>
      `,
      save: () => {
        const val = document.getElementById("slide-input-oneliner")?.value.trim();
        if (!val) return false;
        state.companyInfo.oneLiner = val;
        return true;
      }
    },
    {
      id: "audience",
      isCompulsory: true,
      question: "Who is your ideal customer?",
      helpText: "Be specific. Who gets the most value from your product?",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Target Audience / Ideal Customer *</label>
          <textarea id="slide-input-audience" class="input-standard" rows="3" placeholder="e.g. Early-stage B2B SaaS founders and solo creators with 1-10 employees who don't have a marketing department.">${info.audience || ""}</textarea>
        </div>
      `,
      save: () => {
        const val = document.getElementById("slide-input-audience")?.value.trim();
        if (!val) return false;
        state.companyInfo.audience = val;
        return true;
      }
    },
    {
      id: "problem",
      isCompulsory: true,
      question: "What big headache or problem do you solve for them?",
      helpText: "What frustrating problem makes people look for a solution like yours?",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Customer Pain Point / Problem *</label>
          <textarea id="slide-input-problem" class="input-standard" rows="3" placeholder="e.g. Founders don't have time to write marketing copy, keep getting generic ChatGPT junk, and can't afford a $10,000/mo marketing agency.">${info.problem || ""}</textarea>
        </div>
      `,
      save: () => {
        const val = document.getElementById("slide-input-problem")?.value.trim();
        if (!val) return false;
        state.companyInfo.problem = val;
        return true;
      }
    },
    {
      id: "competitors",
      isCompulsory: true,
      question: "Who are your top competitors or current alternatives?",
      helpText: "What are people using today instead of your product?",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Competitors or Alternatives *</label>
          <textarea id="slide-input-competitors" class="input-standard" rows="3" placeholder="e.g. Generic AI writing tools, manual spreadsheets, hiring expensive freelancers, or doing nothing.">${info.competitors || ""}</textarea>
        </div>
      `,
      save: () => {
        const val = document.getElementById("slide-input-competitors")?.value.trim();
        if (!val) return false;
        state.companyInfo.competitors = val;
        return true;
      }
    },
    {
      id: "tone",
      isCompulsory: true,
      question: "How should your marketing sound?",
      helpText: "Pick the personality of your brand and list any buzzwords to strictly avoid.",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Select Brand Tone *</label>
          <div class="pill-choice-group" id="tone-pills">
            <button type="button" class="choice-chip ${info.tone?.includes("Confident") ? "selected" : ""}" data-tone="Confident, Human & Clear">Confident & Human</button>
            <button type="button" class="choice-chip ${info.tone?.includes("Bold") ? "selected" : ""}" data-tone="Bold, Disruptive & Direct">Bold & Direct</button>
            <button type="button" class="choice-chip ${info.tone?.includes("Friendly") ? "selected" : ""}" data-tone="Casual, Warm & Friendly">Casual & Friendly</button>
            <button type="button" class="choice-chip ${info.tone?.includes("Professional") ? "selected" : ""}" data-tone="Sharp, Professional & Data-Backed">Professional & Data-Backed</button>
          </div>
        </div>
        <div class="form-group" style="margin-top: 10px;">
          <label class="form-label">Words / Buzzwords to NEVER Use</label>
          <input type="text" id="slide-input-avoid" class="input-standard" placeholder="e.g. game-changer, revolutionary, synergy, leverage" value="${info.avoidTone || ""}">
        </div>
      `,
      save: () => {
        const selectedPill = document.querySelector("#tone-pills .choice-chip.selected");
        state.companyInfo.tone = selectedPill?.getAttribute("data-tone") || "Confident, Human & Clear";
        state.companyInfo.avoidTone = document.getElementById("slide-input-avoid")?.value.trim() || "";
        return true;
      }
    },
    {
      id: "pricing",
      isCompulsory: false,
      question: "What is your pricing or business model? (Optional)",
      helpText: "How do customers pay you? This helps your team formulate conversion offers.",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Pricing / Offer Structure</label>
          <input type="text" id="slide-input-pricing" class="input-standard" placeholder="e.g. Free 14-day trial, then $49/month or $99/month for teams" value="${info.pricing || ""}">
        </div>
      `,
      save: () => {
        state.companyInfo.pricing = document.getElementById("slide-input-pricing")?.value.trim() || "";
        return true;
      }
    },
    {
      id: "goal",
      isCompulsory: false,
      question: "What is your #1 marketing goal right now? (Optional)",
      helpText: "What single metric or milestone are you trying to hit this quarter?",
      render: (info) => `
        <div class="form-group">
          <label class="form-label">Current Primary Goal</label>
          <input type="text" id="slide-input-goal" class="input-standard" placeholder="e.g. Reach $10,000 MRR, acquire first 100 users, rank top 3 on Google" value="${info.goal || ""}">
        </div>
      `,
      save: () => {
        state.companyInfo.goal = document.getElementById("slide-input-goal")?.value.trim() || "";
        return true;
      }
    }
  ];

  const onboardingModal = document.getElementById("onboarding-modal");
  const slideContainer = document.getElementById("slide-container");
  const slideIndicator = document.getElementById("slide-indicator");
  const slideReqTag = document.getElementById("slide-req-tag");
  const btnSlidePrev = document.getElementById("btn-slide-prev");
  const btnSlideNext = document.getElementById("btn-slide-next");
  const btnSlideSkip = document.getElementById("btn-slide-skip");

  function renderSlide(index) {
    state.onboardingSlideIndex = index;
    const slide = slidesData[index];
    if (!slide || !slideContainer) return;

    const errorBanner = document.getElementById("slide-validation-error");
    if (errorBanner) errorBanner.style.display = "none";

    if (slideIndicator) {
      if (index < 6) {
        slideIndicator.textContent = `Required Step ${index + 1} of 6`;
      } else {
        slideIndicator.textContent = `Optional Step ${index - 5} of 2`;
      }
    }

    if (slideReqTag) {
      slideReqTag.textContent = slide.isCompulsory ? "★ Compulsory" : "Optional";
      slideReqTag.style.color = slide.isCompulsory ? "var(--accent-foreground)" : "var(--text-secondary)";
    }

    slideContainer.innerHTML = `
      <h3 class="slide-question">${slide.question}</h3>
      <p class="slide-help">${slide.helpText}</p>
      <div class="slide-content-area">
        ${slide.render(state.companyInfo)}
      </div>
    `;

    // Clear error banner on input
    slideContainer.querySelectorAll("input, textarea").forEach((inputEl) => {
      inputEl.addEventListener("input", () => {
        if (errorBanner) errorBanner.style.display = "none";
      });
    });

    // Wire choice chips if on tone slide
    const tonePills = document.querySelectorAll("#tone-pills .choice-chip");
    tonePills.forEach((chip) => {
      chip.addEventListener("click", () => {
        tonePills.forEach((p) => p.classList.remove("selected"));
        chip.classList.add("selected");
        if (errorBanner) errorBanner.style.display = "none";
      });
    });

    if (btnSlidePrev) {
      btnSlidePrev.style.visibility = index === 0 ? "hidden" : "visible";
    }

    if (btnSlideSkip) {
      btnSlideSkip.style.display = slide.isCompulsory ? "none" : "inline-block";
    }

    if (btnSlideNext) {
      btnSlideNext.textContent = index === slidesData.length - 1 ? "Save & Train Team ✓" : "Continue →";
    }
  }

  function advanceSlide() {
    const currentSlide = slidesData[state.onboardingSlideIndex];
    const errorBanner = document.getElementById("slide-validation-error");

    if (currentSlide) {
      const ok = currentSlide.save();
      if (!ok && currentSlide.isCompulsory) {
        if (errorBanner) {
          errorBanner.textContent = "Please fill in this required field so your AI marketing team has the context it needs.";
          errorBanner.style.display = "block";
        }
        return;
      }
    }

    if (errorBanner) errorBanner.style.display = "none";

    if (state.onboardingSlideIndex < slidesData.length - 1) {
      renderSlide(state.onboardingSlideIndex + 1);
    } else {
      // Finished all slides
      finishOnboarding();
    }
  }

  async function finishOnboarding() {
    localStorage.setItem("foundry_company_info", JSON.stringify(state.companyInfo));
    localStorage.setItem("foundry_onboarding_completed", "true");
    updateBrainProgressDisplay();

    if (onboardingModal) onboardingModal.classList.remove("open");

    // Sync to backend /api/brain/setup
    try {
      await fetch("/api/brain/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: state.tenantId,
          ...state.companyInfo
        })
      });
    } catch (err) {
      console.warn("Backend setup sync warning:", err);
    }

    appendMessage(
      "FoundryOS Assistant",
      `<strong>Knowledge Base Updated!</strong><br>Your AI marketing team is now trained on <strong>${state.companyInfo.name || "your company"}</strong>. Everything they generate will match your audience, positioning, and tone.`,
      false,
      "FOS"
    );
  }

  window.openWizardToSlide = function (slideIndex) {
    const idx = typeof slideIndex === "number" ? Math.max(0, Math.min(slideIndex, slidesData.length - 1)) : 0;
    renderSlide(idx);
    if (onboardingModal) onboardingModal.classList.add("open");
  };

  const btnCloseOnboarding = document.getElementById("btn-close-onboarding");
  if (btnCloseOnboarding) {
    btnCloseOnboarding.addEventListener("click", () => {
      if (onboardingModal) onboardingModal.classList.remove("open");
    });
  }

  if (btnSlideNext) btnSlideNext.addEventListener("click", advanceSlide);
  if (btnSlideSkip) btnSlideSkip.addEventListener("click", () => {
    if (state.onboardingSlideIndex < slidesData.length - 1) {
      renderSlide(state.onboardingSlideIndex + 1);
    } else {
      finishOnboarding();
    }
  });

  if (btnSlidePrev) {
    btnSlidePrev.addEventListener("click", () => {
      if (state.onboardingSlideIndex > 0) {
        renderSlide(state.onboardingSlideIndex - 1);
      }
    });
  }

  // Open modal triggers
  const openOnboardingBtn = document.getElementById("btn-open-onboarding");
  const editBrainTopBtn = document.getElementById("btn-edit-brain-top");

  function openWizard() {
    renderSlide(0);
    if (onboardingModal) onboardingModal.classList.add("open");
  }

  if (openOnboardingBtn) openOnboardingBtn.addEventListener("click", openWizard);
  if (editBrainTopBtn) editBrainTopBtn.addEventListener("click", openWizard);

  // Auto open for brand new users
  if (!localStorage.getItem("foundry_onboarding_completed")) {
    setTimeout(openWizard, 500);
  }

  // 5. Render AI Employees
  function renderEmployees() {
    const container = document.getElementById("agents-grid-container");
    if (!container) return;

    container.innerHTML = state.employees
      .map(
        (emp) => `
      <div class="agent-card" data-id="${emp.id}">
        <div class="agent-card-header">
          <div class="agent-card-avatar">${emp.avatar}</div>
          <div class="agent-card-title-group">
            <span class="agent-card-name">${emp.name}</span>
            <span class="agent-card-role">${emp.title}</span>
          </div>
          <span class="agent-card-pillar-badge">${emp.pillar}</span>
        </div>

        <p class="agent-card-desc">${emp.desc}</p>

        <div class="agent-card-specialties">
          ${emp.specialties.map((s) => `<span class="specialty-tag">${s}</span>`).join("")}
        </div>

        <div class="agent-card-footer">
          <span class="agent-card-contract-tag" style="color: var(--accent-foreground); font-weight: 600;">Ready to Deploy</span>
          <button class="btn-agent-run" data-id="${emp.id}" data-prompt="${emp.defaultPrompt}">
            Assign Task →
          </button>
        </div>
      </div>
    `
      )
      .join("");

    container.querySelectorAll(".btn-agent-run").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const empId = btn.getAttribute("data-id");
        const prompt = btn.getAttribute("data-prompt");
        if (empId) state.selectedEmployeeId = empId;

        const chatNav = document.getElementById("nav-chat");
        if (chatNav) chatNav.click();

        if (prompt) {
          executeAgentRun(empId, prompt);
        }
      });
    });
  }

  renderEmployees();

  // 6. Customer-Friendly Marketing Document Formatter (NO RAW JSON)
  function formatHumanFriendlyDocument(employeeName, data) {
    if (!data || typeof data !== "object") {
      return `<div>${String(data)}</div>`;
    }

    let html = `<div class="exec-doc">`;

    // A. Market Research Output
    if (data.marketTrends || data.targetSegments) {
      html += `
        <div class="exec-doc-header">
          <div class="exec-doc-title">📊 Strategic Market Intelligence Audit</div>
          <button class="btn-copy-doc" onclick="copyDocumentText(this)">Copy Report</button>
        </div>
      `;

      if (data.summary) {
        html += `
          <div class="exec-callout-card">
            <span class="exec-callout-title">Executive Takeaway</span>
            <div class="exec-callout-text">${data.summary}</div>
          </div>
        `;
      }

      if (Array.isArray(data.marketTrends) && data.marketTrends.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">📈 High-Growth Market Trends:</div>
            <ul class="exec-bullets">
              ${data.marketTrends.map((t) => `<li>${t}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      if (Array.isArray(data.targetSegments) && data.targetSegments.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">🎯 Highest-Converting Customer Segments:</div>
            <div class="exec-card-grid">
              ${data.targetSegments
                .map(
                  (seg) => `
                <div class="exec-subcard">
                  <div class="exec-subcard-title">
                    <span>${seg.segmentName}</span>
                    <span class="nav-badge" style="font-size: 0.65rem;">${seg.urgency?.toUpperCase()} PRIORITY</span>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                    ${seg.opportunity}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      if (Array.isArray(data.macroRisks) && data.macroRisks.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">⚠️ Market Risks to Watch:</div>
            <ul class="exec-bullets">
              ${data.macroRisks.map((r) => `<li>${r}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }
    // B. Competitor Analysis Output
    else if (data.competitorTeardowns || data.featureGaps) {
      html += `
        <div class="exec-doc-header">
          <div class="exec-doc-title">⚔️ Competitive Teardown & Displacement Plan</div>
          <button class="btn-copy-doc" onclick="copyDocumentText(this)">Copy Report</button>
        </div>
      `;

      if (data.summary) {
        html += `
          <div class="exec-callout-card">
            <span class="exec-callout-title">Competitive Summary</span>
            <div class="exec-callout-text">${data.summary}</div>
          </div>
        `;
      }

      if (Array.isArray(data.competitorTeardowns) && data.competitorTeardowns.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">🔍 Competitor Breakdown:</div>
            <div class="exec-card-grid">
              ${data.competitorTeardowns
                .map(
                  (comp) => `
                <div class="exec-subcard">
                  <div class="exec-subcard-title">
                    <span>${comp.name}</span>
                    <span style="font-size: 0.72rem; color: var(--text-tertiary);">${comp.pricingModel || ""}</span>
                  </div>
                  <div style="font-size: 0.82rem; margin-top: 4px;">
                    <strong style="color: var(--text-primary);">Their Flaws:</strong> ${(comp.vulnerabilities || []).join(", ")}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      if (Array.isArray(data.counterTactics) && data.counterTactics.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">💡 How We Win (Counter-Tactics):</div>
            <ul class="exec-bullets">
              ${data.counterTactics.map((t) => `<li><strong>Advantage:</strong> ${t}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    }
    // C. Marketing Strategy / Brand Positioning
    else if (data.positioningStatement || data.strategicPillars) {
      html += `
        <div class="exec-doc-header">
          <div class="exec-doc-title">🎯 Brand Positioning & Strategic Blueprint</div>
          <button class="btn-copy-doc" onclick="copyDocumentText(this)">Copy Blueprint</button>
        </div>
      `;

      if (data.positioningStatement) {
        html += `
          <div class="exec-callout-card" style="border-left-width: 4px;">
            <span class="exec-callout-title">Official Positioning Statement</span>
            <div class="exec-callout-text" style="font-size: 1.15rem; font-style: italic;">
              "${data.positioningStatement}"
            </div>
          </div>
        `;
      }

      if (data.valueProposition) {
        html += `
          <div style="font-size: 0.95rem; color: var(--text-secondary);">
            <strong>Value Proposition:</strong> ${data.valueProposition}
          </div>
        `;
      }

      if (Array.isArray(data.strategicPillars) && data.strategicPillars.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">🏛️ Strategic Growth Pillars:</div>
            <ul class="exec-bullets">
              ${data.strategicPillars.map((p) => `<li>${p}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      if (Array.isArray(data.channelPriorities) && data.channelPriorities.length > 0) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">📣 Top Marketing Channels to Focus On:</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${data.channelPriorities.map((ch) => `<span class="nav-badge" style="font-size: 0.8rem; padding: 4px 10px;">${ch}</span>`).join("")}
            </div>
          </div>
        `;
      }
    }
    // D. GTM Funnel Strategy
    else if (data.funnelStages || data.offerArchitecture) {
      html += `
        <div class="exec-doc-header">
          <div class="exec-doc-title">🚀 Go-To-Market Funnel & Offer Architecture</div>
          <button class="btn-copy-doc" onclick="copyDocumentText(this)">Copy Funnel</button>
        </div>
      `;

      if (data.campaignTheme) {
        html += `
          <div class="exec-callout-card">
            <span class="exec-callout-title">Campaign Theme</span>
            <div class="exec-callout-text">${data.campaignTheme}</div>
          </div>
        `;
      }

      if (data.funnelStages) {
        html += `
          <div class="exec-section-block">
            <div class="exec-section-title">🔄 3-Stage Customer Acquisition Funnel:</div>
            <div class="exec-card-grid">
              <div class="exec-subcard">
                <div class="exec-subcard-title">1. Top of Funnel (Awareness)</div>
                <p style="font-size: 0.84rem; color: var(--text-secondary);">${data.funnelStages.tofu?.focus || ""}</p>
                <div style="font-size: 0.8rem; margin-top: 4px;"><strong>Tactics:</strong> ${(data.funnelStages.tofu?.tactics || []).join("; ")}</div>
              </div>
              <div class="exec-subcard">
                <div class="exec-subcard-title">2. Middle of Funnel (Trust)</div>
                <p style="font-size: 0.84rem; color: var(--text-secondary);">${data.funnelStages.mofu?.focus || ""}</p>
                <div style="font-size: 0.8rem; margin-top: 4px;"><strong>Tactics:</strong> ${(data.funnelStages.mofu?.tactics || []).join("; ")}</div>
              </div>
              <div class="exec-subcard">
                <div class="exec-subcard-title">3. Bottom of Funnel (Sale)</div>
                <p style="font-size: 0.84rem; color: var(--text-secondary);">${data.funnelStages.bofu?.focus || ""}</p>
                <div style="font-size: 0.8rem; margin-top: 4px;"><strong>Tactics:</strong> ${(data.funnelStages.bofu?.tactics || []).join("; ")}</div>
              </div>
            </div>
          </div>
        `;
      }

      if (data.offerArchitecture) {
        html += `
          <div class="exec-callout-card">
            <span class="exec-callout-title">The Irresistible Offer</span>
            <div style="font-size: 0.95rem; color: var(--text-primary);">
              <strong>Core Offer:</strong> ${data.offerArchitecture.coreOffer || ""}<br>
              <strong>Incentive:</strong> ${data.offerArchitecture.incentive || ""}<br>
              <strong>Risk Reversal:</strong> ${data.offerArchitecture.riskReversal || ""}
            </div>
          </div>
        `;
      }
    } else {
      // General Executive Briefing Formatter (Strictly Zero Raw JSON)
      html += `
        <div class="exec-doc-header">
          <div class="exec-doc-title">📋 Executive Marketing Briefing</div>
          <button class="btn-copy-doc" onclick="copyDocumentText(this)">Copy Report</button>
        </div>
      `;

      const headline = data.summary || data.headline || data.title || data.message || data.positioning || "";
      if (headline && typeof headline === "string") {
        html += `
          <div class="exec-callout-card">
            <span class="exec-callout-title">Executive Takeaway</span>
            <div class="exec-callout-text">${escapeHtml(headline)}</div>
          </div>
        `;
      }

      for (const [key, value] of Object.entries(data)) {
        if (["summary", "headline", "title", "message", "status", "timestamp"].includes(key)) continue;

        const humanTitle = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim();

        if (Array.isArray(value)) {
          if (value.length === 0) continue;
          if (typeof value[0] === "string") {
            html += `
              <div class="exec-section-block">
                <div class="exec-section-title">📌 ${humanTitle}:</div>
                <ul class="exec-bullets">
                  ${value.map((v) => `<li>${escapeHtml(String(v))}</li>`).join("")}
                </ul>
              </div>
            `;
          } else if (typeof value[0] === "object") {
            html += `
              <div class="exec-section-block">
                <div class="exec-section-title">📌 ${humanTitle}:</div>
                <div class="exec-card-grid">
                  ${value
                    .map((item) => {
                      const itemTitle = item.name || item.title || item.segmentName || item.goal || "Focus Item";
                      const details = Object.entries(item)
                        .filter(([k]) => !["name", "title", "segmentName", "goal"].includes(k))
                        .map(
                          ([k, v]) => `
                          <div><strong style="color: var(--text-primary);">${k.replace(/([A-Z])/g, " $1").toLowerCase()}:</strong> ${Array.isArray(v) ? v.join(", ") : escapeHtml(String(v))}</div>
                        `
                        )
                        .join("");
                      return `
                        <div class="exec-subcard">
                          <div class="exec-subcard-title">${escapeHtml(itemTitle)}</div>
                          <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin-top: 4px;">
                            ${details}
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `;
          }
        } else if (typeof value === "object" && value !== null) {
          html += `
            <div class="exec-section-block">
              <div class="exec-section-title">📌 ${humanTitle}:</div>
              <div class="exec-callout-card" style="margin-top: 6px;">
                ${Object.entries(value)
                  .map(([subKey, subVal]) => {
                    const subTitle = subKey.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase());
                    return `<div style="margin-bottom: 6px;"><strong>${subTitle}:</strong> ${Array.isArray(subVal) ? subVal.join(", ") : escapeHtml(String(subVal))}</div>`;
                  })
                  .join("")}
              </div>
            </div>
          `;
        } else if (value !== null && value !== undefined && value !== "") {
          const isMultilineOrFormatted = typeof value === "string" && (value.includes("\n") || value.includes("**") || value.includes("*"));
          if (isMultilineOrFormatted) {
            html += `
              <div class="exec-section-block" style="margin-top: 14px;">
                <div class="exec-section-title">📌 ${humanTitle}:</div>
                <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.65; margin-top: 8px;">
                  ${formatTextContent(value)}
                </div>
              </div>
            `;
          } else {
            html += `
              <div style="font-size: 0.88rem; margin-top: 10px; color: var(--text-primary);">
                <strong>${humanTitle}:</strong> ${escapeHtml(String(value))}
              </div>
            `;
          }
        }
      }
    }

    html += `</div>`;
    return html;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatTextContent(text) {
    if (!text) return "";
    const trimmed = text.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatHumanFriendlyDocument("AI Team", parsed);
      } catch (e) {
        // Fall back to text
      }
    }

    let html = escapeHtml(text)
      .replace(/^### (.*$)/gim, '<div class="exec-section-title" style="margin-top:12px;">$1</div>')
      .replace(/^## (.*$)/gim, '<div class="exec-doc-title" style="margin-top:14px;">$1</div>')
      .replace(/^# (.*$)/gim, '<div class="exec-doc-title" style="font-size:1.15rem; margin-top:16px;">$1</div>')
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/^\s*[-*]\s+(.*$)/gim, "<li>$1</li>")
      .replace(/\n\n+/g, "<br><br>");

    if (html.includes("<li>")) {
      html = html.replace(/(<li>.*<\/li>)/s, '<ul class="exec-bullets">$1</ul>');
    }
    return html;
  }

  window.copyDocumentText = function (btn) {
    const parentDoc = btn.closest(".exec-doc");
    if (!parentDoc) return;
    const text = parentDoc.innerText.replace("Copy Report", "").replace("Copy Blueprint", "").replace("Copy Funnel", "").trim();
    navigator.clipboard.writeText(text);
    btn.textContent = "Copied! ✓";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 2000);
  };

  // 7. Customer Workspace Interactions (Multi-Uploads, Specific Agent Selection, Credits & MCP)
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("btn-send-message");
  const messagesList = document.getElementById("messages-list");
  const charCount = document.getElementById("prompt-char-count");
  const btnUploadFile = document.getElementById("btn-upload-file");
  const chatFileInput = document.getElementById("chat-file-input");
  const attachedFilesContainer = document.getElementById("attached-files-container");
  const attachedFilesChips = document.getElementById("attached-files-chips");
  const attachedFilesCount = document.getElementById("attached-files-count");
  const btnClearAllAttachments = document.getElementById("btn-clear-all-attachments");
  const chatAgentSelect = document.getElementById("chat-agent-select");
  const headerCreditPill = document.getElementById("header-credit-pill");
  const headerCreditText = document.getElementById("header-credit-text");

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function renderAttachmentChips() {
    if (!attachedFilesContainer || !attachedFilesChips || !attachedFilesCount) return;
    const items = state.activeAttachments || [];
    attachedFilesCount.textContent = `${items.length} / 5 files attached`;

    if (items.length === 0) {
      attachedFilesContainer.classList.add("hidden");
      return;
    }

    attachedFilesContainer.classList.remove("hidden");
    attachedFilesChips.innerHTML = items.map((file, idx) => `
      <div class="attached-file-chip">
        <span class="file-icon">📎</span>
        <span class="file-name" title="${escapeHtml(file.fileName)}">${escapeHtml(file.fileName)}</span>
        <span class="file-size">(${escapeHtml(file.size)})</span>
        <button class="btn-remove-attachment" data-index="${idx}" type="button" title="Remove attachment">&times;</button>
      </div>
    `).join("");

    attachedFilesChips.querySelectorAll(".btn-remove-attachment").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        state.activeAttachments.splice(idx, 1);
        renderAttachmentChips();
      });
    });
  }

  function clearActiveAttachments() {
    state.activeAttachments = [];
    if (chatFileInput) chatFileInput.value = "";
    renderAttachmentChips();
  }

  if (btnClearAllAttachments) {
    btnClearAllAttachments.addEventListener("click", clearActiveAttachments);
  }

  // Credit Display and Management
  async function fetchCreditStatus() {
    try {
      const res = await fetch(`/api/credits?tenantId=${encodeURIComponent(state.tenantId)}`);
      if (res.ok) {
        const data = await res.json();
        updateCreditDisplay(data.creditsRemaining, data.dailyLimit);
      }
    } catch (err) {
      console.warn("Failed to fetch credit status", err);
    }
  }

  function updateCreditDisplay(remaining, limit = 100) {
    if (headerCreditText) {
      headerCreditText.textContent = `${remaining}/${limit} Credits`;
    }
    const statCredit = document.getElementById("stat-mcp-daily-credits");
    if (statCredit) statCredit.textContent = `${remaining}`;
  }

  fetchCreditStatus();

  // Document Archive Management
  const archiveDrawer = document.getElementById("chat-archive-drawer");
  const archiveToggle = document.getElementById("archive-toggle-header");
  const archiveItemsList = document.getElementById("archive-items-list");
  const archiveCount = document.getElementById("archive-count");
  const archiveChevron = document.getElementById("archive-chevron");

  function archiveDocument(doc) {
    state.archivedDocuments.push({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fileName: doc.fileName,
      size: doc.size || "—",
      content: doc.content,
      archivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    renderArchive();
  }

  function removeArchivedDocument(docId) {
    state.archivedDocuments = state.archivedDocuments.filter((d) => d.id !== docId);
    renderArchive();
  }

  function renderArchive() {
    if (!archiveDrawer || !archiveItemsList || !archiveCount) return;

    const docs = state.archivedDocuments;
    archiveCount.textContent = docs.length;

    if (docs.length === 0) {
      archiveDrawer.classList.add("hidden");
      return;
    }

    archiveDrawer.classList.remove("hidden");

    archiveItemsList.innerHTML = docs.map((doc) => `
      <div class="archive-item" data-doc-id="${doc.id}">
        <div class="archive-item-info">
          <span class="archive-item-icon">📄</span>
          <span class="archive-item-name" title="${escapeHtml(doc.fileName)}">${escapeHtml(doc.fileName)}</span>
          <span class="archive-item-meta">${escapeHtml(doc.size)} · ${doc.archivedAt}</span>
        </div>
        <button class="archive-item-delete" data-delete-id="${doc.id}" title="Remove from archive" aria-label="Remove ${escapeHtml(doc.fileName)} from archive">&times;</button>
      </div>
    `).join("");

    archiveItemsList.querySelectorAll(".archive-item-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeArchivedDocument(btn.getAttribute("data-delete-id"));
      });
    });
  }

  if (archiveToggle) {
    archiveToggle.addEventListener("click", () => {
      state.archiveExpanded = !state.archiveExpanded;
      if (archiveItemsList) archiveItemsList.classList.toggle("hidden", !state.archiveExpanded);
      if (archiveChevron) archiveChevron.classList.toggle("expanded", state.archiveExpanded);
    });
  }

  if (btnUploadFile && chatFileInput) {
    btnUploadFile.addEventListener("click", () => {
      chatFileInput.click();
    });

    chatFileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const currentCount = (state.activeAttachments || []).length;
      if (currentCount + files.length > 5) {
        alert("Maximum 5 files can be attached at once. Adding as many as fit into the 5-file limit.");
      }

      const availableSlots = Math.max(0, 5 - currentCount);
      const filesToAdd = files.slice(0, availableSlots);

      filesToAdd.forEach((file) => {
        const sizeStr = formatFileSize(file.size);
        const reader = new FileReader();

        reader.onload = (event) => {
          const content = event.target ? event.target.result : "";
          if (!state.activeAttachments) state.activeAttachments = [];
          state.activeAttachments.push({
            fileName: file.name,
            content: typeof content === "string" ? content : "",
            size: sizeStr
          });
          renderAttachmentChips();
        };

        reader.readAsText(file);
      });

      chatFileInput.value = "";
    });
  }

  if (chatInput && charCount) {
    chatInput.addEventListener("input", () => {
      charCount.textContent = `${chatInput.value.length} chars`;
      chatInput.style.height = "auto";
      chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
    });

    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitChat();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", submitChat);
  }

  function appendMessage(sender, content, isUser = false, avatar = "YOU", attachments = null, extraBadge = "", toolCalls = []) {
    if (!messagesList) return;

    const card = document.createElement("div");
    card.className = `message-card ${isUser ? "user" : "agent"}`;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let attachmentsHtml = "";
    if (Array.isArray(attachments) && attachments.length > 0) {
      attachmentsHtml = `
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          ${attachments.map(att => `
            <div class="message-attachment-pill">
              <span>📎</span>
              <span>${escapeHtml(att.fileName)}</span>
              <span style="opacity: 0.65; font-size: 0.72rem;">(${escapeHtml(att.size || "")})</span>
            </div>
          `).join("")}
        </div>
      `;
    } else if (attachments && attachments.fileName) {
      attachmentsHtml = `
        <div class="message-attachment-pill" style="margin-top:8px;">
          <span>📎</span>
          <span>${escapeHtml(attachments.fileName)}</span>
          <span style="opacity: 0.65; font-size: 0.72rem;">(${escapeHtml(attachments.size || "")})</span>
        </div>
      `;
    }

    let toolCallsHtml = "";
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      toolCallsHtml = `
        <div style="margin-top: 10px; padding: 8px 12px; background: rgba(45,212,191,0.06); border: 1px solid rgba(45,212,191,0.2); border-radius: 6px; font-size: 0.75rem;">
          <div style="font-weight: 600; color: var(--accent-teal); margin-bottom: 4px;">🛠️ Real-Time MCP Tools Utilized:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${toolCalls.map(tc => `<span class="mcp-tool-tag">${escapeHtml(tc.toolName)} (${tc.durationMs}ms)</span>`).join("")}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="message-header">
        <div class="message-sender">
          <div class="message-avatar">${avatar}</div>
          <span>${sender}</span>
          ${extraBadge || ""}
        </div>
        <span class="message-time">${now}</span>
      </div>
      <div class="message-body">
        ${typeof content === "string" ? formatTextContent(content) : formatHumanFriendlyDocument(sender, content)}
        ${attachmentsHtml}
        ${toolCallsHtml}
      </div>
    `;

    messagesList.appendChild(card);
    card.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  async function submitChat() {
    if (!chatInput) return;
    let task = chatInput.value.trim();
    const attachments = (state.activeAttachments || []).slice(0, 5);

    if (!task && attachments.length === 0) return;

    if (!task && attachments.length > 0) {
      task = `Please review the attached document(s) (${attachments.map(a => a.fileName).join(", ")}) and extract strategic marketing intelligence and action items.`;
    }

    chatInput.value = "";
    chatInput.style.height = "auto";
    if (charCount) charCount.textContent = "0 chars";
    attachments.forEach(a => archiveDocument(a));
    clearActiveAttachments();

    const selectedAgent = chatAgentSelect ? chatAgentSelect.value : "auto";

    if (selectedAgent === "multi-agent") {
      await executeMultiAgentRun(task, attachments);
    } else {
      await executeAgentRun(selectedAgent, task, attachments);
    }
  }

  async function executeMultiAgentRun(task, attachedDocs = []) {
    appendMessage("Founder", `[Multi-Agent Team Initiative]: ${task}`, true, "FD", attachedDocs);

    const specialists = [
      { id: "market-research-analyst", name: "Market Research Analyst", avatar: "MR", prompt: `Analyze customer demand and market opportunities regarding: ${task}` },
      { id: "competitor-analyst", name: "Competitor Intelligence Analyst", avatar: "CI", prompt: `Perform competitive teardown and identify feature/pricing gaps for: ${task}` },
      { id: "chief-marketing-strategist", name: "Chief Marketing Strategist", avatar: "CS", prompt: `Formulate overarching positioning statement and strategic pillars for: ${task}` }
    ];

    for (const spec of specialists) {
      await executeAgentRun(spec.id, spec.prompt, attachedDocs, false);
    }
  }

  async function executeAgentRun(employeeId, task, attachedDocs = [], shouldAppendUserMessage = true) {
    const isAuto = !employeeId || employeeId === "auto";
    state.selectedEmployeeId = employeeId;
    const employee = !isAuto ? state.employees.find((e) => e.id === employeeId) : null;

    if (shouldAppendUserMessage) {
      appendMessage("Founder", task, true, "FD", attachedDocs);
    }

    const loadingCard = document.createElement("div");
    loadingCard.className = "message-card agent";
    loadingCard.id = "loading-turn-card";

    const initialName = employee ? `${employee.name} (${employee.title})` : "FoundryOS Intelligent Router";
    const initialAvatar = employee ? employee.avatar : "AI";
    const initialDesc = employee
      ? "Applying Company Brain knowledge • Invoking MCP tools • Formulating executive deliverables..."
      : "Routing to best marketing specialist • Inspecting live MCP intelligence • Generating strategic output...";

    loadingCard.innerHTML = `
      <div class="message-header">
        <div class="message-sender">
          <div class="message-avatar">${initialAvatar}</div>
          <span>${initialName}</span>
        </div>
        <span class="message-time">Executing turn...</span>
      </div>
      <div class="message-body" style="font-style: italic; color: var(--text-tertiary);">
        ${initialDesc}
      </div>
    `;
    if (messagesList) messagesList.appendChild(loadingCard);
    loadingCard.scrollIntoView({ behavior: "smooth" });

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: state.tenantId,
          ...(employee ? { employeeId: employee.id } : { employeeId: "auto" }),
          task,
          attachedDocuments: attachedDocs.map(d => ({ fileName: d.fileName, content: d.content })),
          ...(attachedDocs[0] ? { attachedDocument: { fileName: attachedDocs[0].fileName, content: attachedDocs[0].content } } : {}),
          enableTools: true
        })
      });

      if (loadingCard) loadingCard.remove();

      if (res.ok) {
        const data = await res.json();
        const extraBadge = data.routedBy ? `<span class="routed-agent-pill" title="${escapeHtml(data.routingReason || 'Classified by AI Router')}">⚡ AI Routed</span>` : "";
        appendMessage(data.employeeName, data.output, false, data.avatar || (employee ? employee.avatar : "FOS"), null, extraBadge, data.toolCalls || []);

        if (data.creditUsage) {
          updateCreditDisplay(data.creditUsage.creditsRemaining, data.creditUsage.dailyLimit);
        }

        // Update token telemetry in the background
        if (data.tokenReport) {
          updateTokenTelemetryDisplay(data.tokenReport);

          appendTelemetryLogRow({
            time: new Date().toLocaleTimeString(),
            employee: data.employeeName,
            task: task.slice(0, 45) + (task.length > 45 ? "..." : ""),
            tokens: `${data.tokenReport.totalTokensUsed} tok`,
            duration: `${data.durationMs}ms`,
            status: data.status.toUpperCase()
          });
        }

        // Save to customer reports
        state.artifacts.push({
          title: `${data.employeeName} — ${task.slice(0, 40)}...`,
          employee: data.employeeName,
          date: new Date().toLocaleTimeString(),
          output: data.output
        });
        renderArtifacts();
      } else if (res.status === 429) {
        appendMessage("System Guardrail", "⚠️ Daily credit limit reached (100/100 credits used). Daily limit resets at midnight UTC (80,000 tokens/day).", false, "SYS");
      } else {
        const errData = await res.json();
        appendMessage(employee ? employee.name : "FoundryOS", `Execution failed: ${errData.error || "Unknown error"}`, false, employee ? employee.avatar : "FOS");
      }
    } catch (err) {
      if (loadingCard) loadingCard.remove();
      appendMessage("FoundryOS", `Encountered communication error: ${String(err)}`, false, "FOS");
    }
  }

  // 8. Suggestion Quick-Launch Cards
  document.querySelectorAll(".suggestion-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.getAttribute("data-prompt");
      const agentId = card.getAttribute("data-agent");
      if (agentId) state.selectedEmployeeId = agentId;
      if (prompt) {
        executeAgentRun(state.selectedEmployeeId, prompt);
      }
    });
  });

  // 9. Render Customer Reports (Artifacts)
  function renderArtifacts() {
    const container = document.getElementById("artifacts-grid-container");
    if (!container) return;

    if (state.artifacts.length === 0) {
      const compName = state.companyInfo.name || "FoundryOS";
      state.artifacts = [
        {
          title: `${compName} — Strategic Market Intelligence Audit`,
          employee: "Market Research Analyst",
          date: "Audit Ready",
          output: {
            summary: `Substantial market opportunity identified for ${compName}. Startups are eager to replace disjointed point tools with an intelligent, persistent marketing team.`,
            marketTrends: [
              "73% of early-stage technical founders lack dedicated marketing headcount",
              "Rapid shift toward continuous AI agents operating with persistent company memory rather than ephemeral chats",
              "Increasing demand for automated competitive positioning and differentiation audits"
            ],
            targetSegments: [
              { segmentName: "Seed & Series A B2B SaaS", opportunity: "Immediate turnkey marketing function without $120k/yr agency fees", urgency: "high" },
              { segmentName: "Technical Founders & Solopreneurs", opportunity: "Complete launch and GTM messaging delegation from day one", urgency: "medium" }
            ],
            macroRisks: [
              "Generic AI content saturation in organic search channels demanding differentiated point-of-view",
              "Ad platform privacy shifts requiring stronger organic word-of-mouth positioning"
            ],
            confidenceScore: 0.92
          }
        },
        {
          title: `${compName} — Brand Positioning & Strategic Blueprint`,
          employee: "Chief Marketing Strategist",
          date: "Blueprint Ready",
          output: {
            positioningStatement: `${compName}: The AI Marketing Operating System that understands your company, coordinates your workforce, and launches your marketing.`,
            valueProposition: "Hire Nobody. Launch Everything. Persistent company memory powering dedicated AI marketing employees.",
            strategicPillars: [
              "Persistent Company Brain: Context is never lost between sessions or agents",
              "Specialized Workforce: Dedicated employees for research, competitive intel, and funnel architecture",
              "Founder-First Simplicity: Plain-English executive deliverables with zero prompt fatigue"
            ],
            goalAlignment: [
              { goal: "Acquire first 100 paying customers", initiative: "Run competitive displacement comparison teardowns", targetMetric: "100 customers in 90 days" }
            ],
            channelPriorities: ["Developer & Founder Communities", "Organic SEO / Comparison Teardowns", "Targeted Founder Direct Outbound"],
            brandToneChecks: ["No corporate hype or buzzwords", "Confident, direct, human tone enforced"]
          }
        }
      ];
    }

    container.innerHTML = state.artifacts
      .map(
        (art, idx) => `
      <div class="agent-card">
        <div class="agent-card-header">
          <div class="agent-card-avatar">#${idx + 1}</div>
          <div class="agent-card-title-group">
            <span class="agent-card-name">${art.title}</span>
            <span class="agent-card-role">${art.employee} • ${art.date}</span>
          </div>
        </div>
        <div style="max-height: 480px; overflow-y: auto;">
          ${formatHumanFriendlyDocument(art.employee, art.output)}
        </div>
      </div>
    `
      )
      .join("");
  }

  renderArtifacts();

  // 10. Separate Token Analytics Telemetry
  function updateTokenTelemetryDisplay(report) {
    if (!report) return;

    const kpiTotal = document.getElementById("analytics-total-tokens");
    const kpiMax = document.getElementById("analytics-max-budget");
    const kpiHeadroom = document.getElementById("analytics-headroom");
    const kpiStatus = document.getElementById("analytics-budget-status");

    const used = report.totalTokensUsed;
    const max = report.maxTokenBudget;
    const headroom = report.availableHeadroom;
    const percent = Math.min(100, Number(((used / max) * 100).toFixed(1)));

    if (kpiTotal) kpiTotal.textContent = `${used.toLocaleString()} tok`;
    if (kpiMax) kpiMax.textContent = `${max.toLocaleString()} tok`;
    if (kpiHeadroom) kpiHeadroom.textContent = `${headroom.toLocaleString()} tok`;
    if (kpiStatus) kpiStatus.textContent = report.budgetStatus.toUpperCase();

    const tokensLabel = document.getElementById("debugger-tokens-label");
    const headroomLabel = document.getElementById("debugger-headroom-label");
    const progressBar = document.getElementById("debugger-progress-bar");
    const statusBadge = document.getElementById("debugger-status-badge");
    const layersContainer = document.getElementById("debugger-layers-container");

    if (tokensLabel) tokensLabel.textContent = `Context Tokens: ${used.toLocaleString()} / ${max.toLocaleString()} max (${percent}%)`;
    if (headroomLabel) headroomLabel.textContent = `Headroom: ${headroom.toLocaleString()} tokens remaining`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    if (statusBadge) {
      statusBadge.textContent = report.budgetStatus.toUpperCase();
      statusBadge.className = `debugger-status-tag ${report.budgetStatus}`;
    }

    if (layersContainer && report.layers) {
      layersContainer.innerHTML = report.layers
        .map(
          (layer) => `
        <div class="layer-token-chip" title="${layer.snippet}">
          <div class="layer-chip-top">
            <span class="layer-chip-name">${layer.displayName}</span>
            <span class="layer-chip-tokens">${layer.tokenCount} tok (${layer.percentageOfBudget}%)</span>
          </div>
          <span class="layer-chip-snippet">${layer.snippet}</span>
        </div>
      `
        )
        .join("");
    }
  }

  async function inspectLiveContext() {
    const empSelect = document.getElementById("debug-employee-select");
    const budgetSelect = document.getElementById("debug-budget-select");
    const taskInput = document.getElementById("debug-task-input");

    const employeeId = (empSelect && empSelect.value) ? empSelect.value : (state.selectedEmployeeId !== "auto" ? state.selectedEmployeeId : "chief-marketing-strategist");
    const maxBudget = budgetSelect ? parseInt(budgetSelect.value, 10) : 4096;
    const task = taskInput && taskInput.value.trim() ? taskInput.value.trim() : "Formulate core company positioning and strategic pillars.";

    try {
      const res = await fetch("/api/context/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: state.tenantId,
          employeeId,
          task,
          maxTokenBudget: maxBudget
        })
      });
      if (res.ok) {
        const report = await res.json();
        updateTokenTelemetryDisplay(report);
      }
    } catch (err) {
      console.warn("Failed to fetch token telemetry", err);
    }
  }

  const refreshDebugBtn = document.getElementById("btn-refresh-token-debug");
  if (refreshDebugBtn) {
    refreshDebugBtn.addEventListener("click", inspectLiveContext);
  }

  ["debug-employee-select", "debug-budget-select"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", inspectLiveContext);
  });

  const simTaskInput = document.getElementById("debug-task-input");
  if (simTaskInput) {
    simTaskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") inspectLiveContext();
    });
  }

  function appendTelemetryLogRow(entry) {
    state.telemetryLogs.unshift(entry);
    const tbody = document.getElementById("token-telemetry-tbody");
    if (!tbody) return;

    tbody.innerHTML = state.telemetryLogs
      .slice(0, 10)
      .map(
        (log) => `
      <tr>
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;">${log.time}</td>
        <td><strong>${log.employee}</strong></td>
        <td style="color: var(--text-secondary);">${log.task}</td>
        <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${log.tokens}</td>
        <td style="font-family: 'JetBrains Mono', monospace;">${log.duration}</td>
        <td><span class="nav-badge">${log.status}</span></td>
      </tr>
    `
      )
      .join("");
  }

  // 11. Settings Modal
  const settingsModal = document.getElementById("settings-modal");
  const openSettingsBtn = document.getElementById("btn-settings-trigger");
  const closeSettingsBtn = document.getElementById("btn-close-settings");
  const saveSettingsBtn = document.getElementById("btn-save-settings");

  if (openSettingsBtn && settingsModal) {
    openSettingsBtn.addEventListener("click", () => settingsModal.classList.add("open"));
  }
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("open"));
  }
  if (saveSettingsBtn && settingsModal) {
    saveSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.remove("open");
    });
  }

  // 12. Clear Chat
  const clearChatBtn = document.getElementById("btn-clear-chat");
  if (clearChatBtn && messagesList) {
    clearChatBtn.addEventListener("click", () => {
      messagesList.innerHTML = "";
    });
  }

  // 13. Model Context Protocol (MCP) & Plugins Hub
  async function fetchMcpServersAndTools() {
    try {
      const [serversRes, toolsRes] = await Promise.all([
        fetch("/api/mcp/servers"),
        fetch("/api/tools")
      ]);
      if (serversRes.ok && toolsRes.ok) {
        const serversData = await serversRes.json();
        const toolsData = await toolsRes.json();
        renderMcpServersGrid(serversData.servers || []);

        const serverCountEl = document.getElementById("stat-mcp-servers-count");
        const toolCountEl = document.getElementById("stat-mcp-tools-count");
        const badgeEl = document.getElementById("mcp-servers-count-badge");
        if (serverCountEl) serverCountEl.textContent = String((serversData.servers || []).length);
        if (toolCountEl) toolCountEl.textContent = String((toolsData.tools || []).length);
        if (badgeEl) badgeEl.textContent = `${(serversData.servers || []).length} MCP`;
      }
    } catch (err) {
      console.warn("Failed to fetch MCP servers and tools", err);
    }
  }

  function renderMcpServersGrid(servers) {
    const container = document.getElementById("mcp-servers-grid");
    if (!container) return;

    if (servers.length === 0) {
      container.innerHTML = `<div style="color: var(--text-tertiary); font-style: italic; padding: 20px;">No active MCP servers found. Initializing...</div>`;
      return;
    }

    container.innerHTML = servers.map(server => `
      <div class="mcp-card">
        <div class="mcp-card-header">
          <div>
            <div class="mcp-card-title">${escapeHtml(server.name)}</div>
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-family: monospace; margin-top: 2px;">
              ID: ${escapeHtml(server.id)} • Transport: ${escapeHtml(server.transport)}
            </div>
          </div>
          <span class="debugger-status-tag optimal" style="text-transform: uppercase;">${escapeHtml(server.status)}</span>
        </div>
        <div class="mcp-card-desc">${escapeHtml(server.description || 'Model Context Protocol Server')}</div>
        <div style="font-size: 0.76rem; font-weight: 600; color: var(--text-secondary); margin-top: 4px;">Exposed Tools (${server.toolCount}):</div>
        <div class="mcp-tools-list">
          ${(server.tools || []).map(t => `<span class="mcp-tool-tag">${escapeHtml(t)}</span>`).join("")}
        </div>
      </div>
    `).join("");
  }

  const btnRunToolTest = document.getElementById("btn-run-tool-test");
  const toolTestSelect = document.getElementById("tool-test-select");
  const toolTestInput = document.getElementById("tool-test-input");
  const toolTestResultWrap = document.getElementById("tool-test-result-wrap");
  const toolTestResult = document.getElementById("tool-test-result");
  const btnRefreshMcpTools = document.getElementById("btn-refresh-mcp-tools");

  const defaultToolInputs = {
    keyword_suggester: JSON.stringify({ seedTopic: "AI marketing for startups" }, null, 2),
    cac_ltv_calculator: JSON.stringify({ arpuMonthly: 99, cac: 280, churnRateMonthly: 0.03 }, null, 2),
    value_prop_evaluator: JSON.stringify({ statement: "The revolutionary next-gen synergy platform for marketing." }, null, 2),
    funnel_benchmarks: JSON.stringify({ businessModel: "B2B SaaS" }, null, 2),
    competitor_pricing_audit: JSON.stringify({ competitorName: "Legacy SaaS Agency", modelType: "seat-based" }, null, 2),
    web_search: JSON.stringify({ query: "startup marketing strategy 2026", limit: 3 }, null, 2),
    tech_trends: JSON.stringify({ topic: "startup growth", limit: 3 }, null, 2),
    query_brain_context: JSON.stringify({ tenantId: "tenant-foundry-dev" }, null, 2)
  };

  if (toolTestSelect && toolTestInput) {
    toolTestSelect.addEventListener("change", () => {
      const selected = toolTestSelect.value;
      if (defaultToolInputs[selected]) {
        toolTestInput.value = defaultToolInputs[selected];
      }
    });
  }

  if (btnRunToolTest && toolTestSelect && toolTestInput) {
    btnRunToolTest.addEventListener("click", async () => {
      const toolName = toolTestSelect.value;
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(toolTestInput.value);
      } catch (err) {
        alert("Please enter valid JSON for tool parameters.");
        return;
      }

      btnRunToolTest.textContent = "Executing...";
      btnRunToolTest.disabled = true;

      try {
        const res = await fetch("/api/tools/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName,
            input: parsedInput,
            tenantId: state.tenantId
          })
        });

        const data = await res.json();
        if (toolTestResult && toolTestResultWrap) {
          toolTestResultWrap.style.display = "block";
          toolTestResult.textContent = JSON.stringify(data, null, 2);
        }
      } catch (err) {
        if (toolTestResult && toolTestResultWrap) {
          toolTestResultWrap.style.display = "block";
          toolTestResult.textContent = `Error: ${String(err)}`;
        }
      } finally {
        btnRunToolTest.textContent = "Execute Tool via MCP →";
        btnRunToolTest.disabled = false;
      }
    });
  }

  if (btnRefreshMcpTools) {
    btnRefreshMcpTools.addEventListener("click", () => {
      fetchMcpServersAndTools();
    });
  }

  // Pre-load MCP state
  fetchMcpServersAndTools();

  // =============================================
  // 14. Interactive Tutorial Engine
  // =============================================
  // Each step specifies a CSS selector to spotlight, which navigation view 
  // to switch to before highlighting, and content for the tooltip card.
  // The spotlight uses a box-shadow cutout technique — a single element 
  // casts a massive shadow that covers the entire viewport, creating the 
  // "dimmed everything except this" illusion without needing a canvas.

  const tutorialSteps = [
    {
      target: ".chat-welcome",
      view: "chat-view",
      title: "👋 Welcome to Marketing HQ",
      desc: "This is your command center. Everything starts here — ask questions, assign tasks to AI employees, and get back polished marketing documents instead of raw AI output."
    },
    {
      target: ".suggestions-grid",
      view: "chat-view",
      title: "⚡ Quick-Launch Strategic Cards",
      desc: "These are your one-click starting points. Each card sends a pre-written strategic prompt to a specialist AI employee. Try \"Market Intelligence Audit\" to instantly get a full competitive landscape analysis."
    },
    {
      target: ".agent-selector-bar",
      view: "chat-view",
      title: "🎯 Target a Specific AI Employee",
      desc: "Use the dropdown to route your request to a specific specialist (Market Research, Competitor Intel, Brand Strategist, or GTM Funnel). Set it to 'Auto Route' and the system intelligently picks the best employee for the job."
    },
    {
      target: ".brain-completeness-card",
      view: "chat-view",
      title: "🧠 Company Brain Knowledge Meter",
      desc: "This shows how much your AI team knows about your company. Click it to open the setup wizard and teach your team about your product, audience, competitors, and brand voice. The more context you provide, the better the outputs."
    },
    {
      target: "#nav-employees",
      view: "chat-view",
      navClick: "nav-employees",
      title: "👥 Meet Your AI Marketing Team",
      desc: "Navigate here to see all 5 AI employees with their specialties, roles, and capabilities. Click 'Assign Task' on any card to instantly deploy them on a mission."
    },
    {
      target: "#nav-brain",
      view: "employees-view",
      navClick: "nav-brain",
      title: "📚 Company Brain — Your Knowledge Base",
      desc: "This is the persistent memory powering every AI employee. When you update company details here, all agents stay aligned. Think of it as the single source of truth for your brand."
    },
    {
      target: "#nav-archive",
      view: "brain-view",
      navClick: "nav-archive",
      title: "📁 Saved Marketing Reports",
      desc: "Every report, strategy document, and competitive teardown your AI team generates is automatically saved here. Review, copy, and build on past work without losing anything."
    },
    {
      target: "#nav-plugins",
      view: "archive-view",
      navClick: "nav-plugins",
      title: "🔧 Plugins & MCP Tools",
      desc: "Your AI employees are powered by real-time tools via the Model Context Protocol — web search, SEO keyword analysis, CAC/LTV calculators, and brain memory queries. Test any tool directly from the playground."
    },
    {
      target: "#nav-token-analytics",
      view: "plugins-view",
      navClick: "nav-token-analytics",
      title: "📊 Token Analytics Lab",
      desc: "For the technically curious — inspect real-time context token budgets, see exactly how much of the prompt window each layer consumes, and simulate different configurations. This is your engine telemetry."
    }
  ];

  let tutorialCurrentStep = 0;
  let tutorialActive = false;
  let previousHighlight = null;

  const tutOverlay = document.getElementById("tutorial-overlay");
  const tutSpotlight = document.getElementById("tutorial-spotlight");
  const tutTooltip = document.getElementById("tutorial-tooltip");
  const tutTitle = document.getElementById("tutorial-tooltip-title");
  const tutDesc = document.getElementById("tutorial-tooltip-desc");
  const tutBadge = document.getElementById("tutorial-step-badge");
  const tutDots = document.getElementById("tutorial-progress-dots");
  const tutBtnPrev = document.getElementById("tutorial-btn-prev");
  const tutBtnNext = document.getElementById("tutorial-btn-next");
  const tutBtnClose = document.getElementById("tutorial-close-btn");
  const tutTrigger = document.getElementById("btn-start-tutorial");

  function renderTutorialDots() {
    if (!tutDots) return;
    tutDots.innerHTML = tutorialSteps
      .map((_, i) => {
        let cls = "tutorial-dot";
        if (i === tutorialCurrentStep) cls += " active";
        else if (i < tutorialCurrentStep) cls += " completed";
        return `<span class="${cls}"></span>`;
      })
      .join("");
  }

  function positionTooltip(targetRect) {
    if (!tutTooltip) return;
    const tooltipWidth = 400;
    const tooltipHeight = tutTooltip.offsetHeight || 200;
    const padding = 16;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    let left, top;

    // Prefer placing to the right of the target
    if (targetRect.right + padding + tooltipWidth < vpW) {
      left = targetRect.right + padding;
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
    }
    // Then try left
    else if (targetRect.left - padding - tooltipWidth > 0) {
      left = targetRect.left - padding - tooltipWidth;
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
    }
    // Then try below
    else if (targetRect.bottom + padding + tooltipHeight < vpH) {
      left = Math.max(20, targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2));
      top = targetRect.bottom + padding;
    }
    // Fallback: above
    else {
      left = Math.max(20, targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2));
      top = Math.max(20, targetRect.top - padding - tooltipHeight);
    }

    // Keep tooltip in viewport
    left = Math.max(20, Math.min(left, vpW - tooltipWidth - 20));
    top = Math.max(20, Math.min(top, vpH - tooltipHeight - 20));

    tutTooltip.style.left = `${left}px`;
    tutTooltip.style.top = `${top}px`;
  }

  function showTutorialStep(index) {
    if (index < 0 || index >= tutorialSteps.length) return;
    tutorialCurrentStep = index;
    const step = tutorialSteps[index];

    // Navigate to the correct view first if we need a nav click
    if (step.navClick) {
      const navBtn = document.getElementById(step.navClick);
      if (navBtn) navBtn.click();
    }

    // Small delay to let the view switch render before we measure positions
    setTimeout(() => {
      // Remove previous highlight
      if (previousHighlight) {
        previousHighlight.classList.remove("tutorial-highlight-target");
        previousHighlight = null;
      }

      const targetEl = document.querySelector(step.target);
      if (!targetEl) {
        // Target not found, try next step
        if (index < tutorialSteps.length - 1) showTutorialStep(index + 1);
        return;
      }

      // Scroll the target into view if needed
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });

      setTimeout(() => {
        const rect = targetEl.getBoundingClientRect();
        const spotPad = 8;

        // Position spotlight cutout
        if (tutSpotlight) {
          tutSpotlight.style.left = `${rect.left - spotPad}px`;
          tutSpotlight.style.top = `${rect.top - spotPad}px`;
          tutSpotlight.style.width = `${rect.width + spotPad * 2}px`;
          tutSpotlight.style.height = `${rect.height + spotPad * 2}px`;
        }

        targetEl.classList.add("tutorial-highlight-target");
        previousHighlight = targetEl;

        // Update tooltip content
        if (tutTitle) tutTitle.textContent = step.title;
        if (tutDesc) tutDesc.textContent = step.desc;
        if (tutBadge) tutBadge.textContent = `Step ${index + 1} of ${tutorialSteps.length}`;

        // Button states
        if (tutBtnPrev) tutBtnPrev.disabled = index === 0;
        if (tutBtnNext) {
          tutBtnNext.textContent = index === tutorialSteps.length - 1 ? "Finish ✓" : "Next →";
        }

        renderTutorialDots();
        positionTooltip(rect);

        // Re-trigger tooltip animation
        if (tutTooltip) {
          tutTooltip.style.animation = "none";
          // Force reflow
          void tutTooltip.offsetHeight;
          tutTooltip.style.animation = "tutorial-tooltip-enter 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
        }
      }, 150);
    }, step.navClick ? 200 : 50);
  }

  function startTutorial() {
    tutorialActive = true;
    tutorialCurrentStep = 0;
    if (tutOverlay) tutOverlay.classList.add("active");

    // Ensure we start from the chat view
    const chatNav = document.getElementById("nav-chat");
    if (chatNav) chatNav.click();

    setTimeout(() => showTutorialStep(0), 300);
  }

  function endTutorial() {
    tutorialActive = false;
    if (tutOverlay) tutOverlay.classList.remove("active");

    if (previousHighlight) {
      previousHighlight.classList.remove("tutorial-highlight-target");
      previousHighlight = null;
    }

    localStorage.setItem("foundry_tutorial_seen", "true");

    // Navigate back to workspace
    const chatNav = document.getElementById("nav-chat");
    if (chatNav) chatNav.click();
  }

  if (tutTrigger) {
    tutTrigger.addEventListener("click", startTutorial);
  }

  if (tutBtnNext) {
    tutBtnNext.addEventListener("click", () => {
      if (tutorialCurrentStep >= tutorialSteps.length - 1) {
        endTutorial();
        appendMessage(
          "FoundryOS Assistant",
          `<strong>Tutorial Complete! 🎉</strong><br>You've seen all the key features. Start by clicking a Quick-Launch card above, or type any marketing question to put your AI team to work. You can re-open this tutorial anytime from the header.`,
          false,
          "FOS"
        );
      } else {
        showTutorialStep(tutorialCurrentStep + 1);
      }
    });
  }

  if (tutBtnPrev) {
    tutBtnPrev.addEventListener("click", () => {
      if (tutorialCurrentStep > 0) {
        showTutorialStep(tutorialCurrentStep - 1);
      }
    });
  }

  if (tutBtnClose) {
    tutBtnClose.addEventListener("click", endTutorial);
  }

  // Handle window resize — reposition spotlight and tooltip
  window.addEventListener("resize", () => {
    if (!tutorialActive) return;
    const step = tutorialSteps[tutorialCurrentStep];
    if (!step) return;
    const targetEl = document.querySelector(step.target);
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const spotPad = 8;
    if (tutSpotlight) {
      tutSpotlight.style.left = `${rect.left - spotPad}px`;
      tutSpotlight.style.top = `${rect.top - spotPad}px`;
      tutSpotlight.style.width = `${rect.width + spotPad * 2}px`;
      tutSpotlight.style.height = `${rect.height + spotPad * 2}px`;
    }
    positionTooltip(rect);
  });

  // Clicking on the dark overlay area should not close the tutorial 
  // (the close button is dedicated for that), but clicking the overlay
  // backdrop should advance to the next step for power users
  if (tutOverlay) {
    tutOverlay.addEventListener("click", (e) => {
      if (e.target === tutOverlay || e.target.classList.contains("tutorial-spotlight")) {
        // Do nothing — prevent accidental closes
      }
    });
  }
});
