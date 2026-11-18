/**
 * AtlasMind — Enterprise Multi-Agent Travel Intelligence
 * Frontend Application Controller
 */

(() => {
  'use strict';

  // ==========================================================================
  // Application State
  // ==========================================================================
  const state = {
    currentThreadId: null,
    currentTripData: null,
    history: [],
    isOrchestrating: false,
    startTime: null,
    timerInterval: null,
    simulatedStepInterval: null,
  };

  // ==========================================================================
  // DOM Element References
  // ==========================================================================
  const DOM = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    systemStatusPill: document.getElementById('system-status-pill'),
    systemStatusText: document.getElementById('system-status-text'),
    activeThreadBadge: document.getElementById('active-thread-badge'),
    activeThreadIdText: document.getElementById('active-thread-id-text'),
    copyThreadBtn: document.getElementById('copy-thread-btn'),
    newTripBtn: document.getElementById('new-trip-btn'),

    // Hero & Planner
    heroSection: document.getElementById('hero-section'),
    plannerCard: document.querySelector('.planner-card'),
    modeNlBtn: document.getElementById('mode-nl-btn'),
    modeStructuredBtn: document.getElementById('mode-structured-btn'),
    modeNlPanel: document.getElementById('mode-nl-panel'),
    modeStructuredPanel: document.getElementById('mode-structured-panel'),
    travelQueryInput: document.getElementById('travel-query-input'),
    clearQueryBtn: document.getElementById('clear-query-btn'),
    launchAgentBtn: document.getElementById('launch-agent-btn'),
    launchBtnLabel: document.getElementById('launch-btn-label'),
    presetPills: document.querySelectorAll('.preset-pill'),
    modChips: document.querySelectorAll('.mod-chip'),

    // Structured Builder Fields
    builderOrigin: document.getElementById('builder-origin'),
    builderDest: document.getElementById('builder-dest'),
    builderDuration: document.getElementById('builder-duration'),
    builderStyle: document.getElementById('builder-style'),
    builderBudget: document.getElementById('builder-budget'),
    applyBuilderBtn: document.getElementById('apply-builder-to-prompt-btn'),

    // Orchestrator Visualizer
    orchestratorCard: document.getElementById('orchestrator-card'),
    orchStatusMessage: document.getElementById('orch-status-message'),
    orchProgressBar: document.getElementById('orch-progress-bar'),
    orchElapsedTime: document.getElementById('orch-elapsed-time'),
    orchLogTicker: document.getElementById('orch-log-ticker'),
    agentNodes: {
      flight: document.getElementById('agent-node-flight'),
      hotel: document.getElementById('agent-node-hotel'),
      itinerary: document.getElementById('agent-node-itinerary'),
      final: document.getElementById('agent-node-final'),
    },

    // Results Dashboard
    resultsDashboard: document.getElementById('results-dashboard'),
    dossierHeadline: document.getElementById('dossier-headline'),
    dossierRouteTag: document.getElementById('dossier-route-tag'),
    dossierTimeTag: document.getElementById('dossier-time-tag'),
    metricLlmCalls: document.getElementById('metric-llm-calls'),
    metricThreadId: document.getElementById('metric-thread-id'),
    metricLatency: document.getElementById('metric-latency'),
    actionPrintBtn: document.getElementById('action-print-btn'),
    actionCopyBtn: document.getElementById('action-copy-btn'),
    actionDownloadJsonBtn: document.getElementById('action-download-json-btn'),

    // Tabs
    dashTabBtns: document.querySelectorAll('.dash-tab-btn'),
    dashPanels: document.querySelectorAll('.dash-panel'),
    executiveMarkdownOutput: document.getElementById('executive-markdown-output'),
    dossierTocLinks: document.getElementById('dossier-toc-links'),

    // Specialized views
    parsedFlightsList: document.getElementById('parsed-flights-list'),
    flightsChipCount: document.getElementById('flights-chip-count'),
    parsedHotelsGrid: document.getElementById('parsed-hotels-grid'),
    hotelsChipCount: document.getElementById('hotels-chip-count'),
    parsedItineraryTimeline: document.getElementById('parsed-itinerary-timeline'),
    telemetryFlightRaw: document.getElementById('telemetry-flight-raw'),
    telemetryHotelRaw: document.getElementById('telemetry-hotel-raw'),
    telemetryItineraryRaw: document.getElementById('telemetry-itinerary-raw'),
    telemetrySessionRaw: document.getElementById('telemetry-session-raw'),

    // Refinement Dock
    refinementInput: document.getElementById('refinement-input'),
    refineSubmitBtn: document.getElementById('refine-submit-btn'),
    refineChips: document.querySelectorAll('.refine-chip'),

    // History Drawer
    historyToggleBtn: document.getElementById('history-toggle-btn'),
    historyCountBadge: document.getElementById('history-count'),
    historyDrawer: document.getElementById('history-drawer'),
    closeHistoryBtn: document.getElementById('close-history-btn'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    historyItemsContainer: document.getElementById('history-items-container'),
    clearAllHistoryBtn: document.getElementById('clear-all-history-btn'),

    // Toast
    toastContainer: document.getElementById('toast-container'),
  };

  // ==========================================================================
  // Markdown Formatter (with fallback if CDN fails)
  // ==========================================================================
  function renderMarkdown(mdText) {
    if (!mdText) return '<p class="text-muted">No content available.</p>';

    if (window.marked && window.DOMPurify) {
      try {
        const rawHtml = window.marked.parse(mdText, { gfm: true, breaks: true });
        return window.DOMPurify.sanitize(rawHtml);
      } catch (e) {
        console.warn('Marked.js error, falling back to basic parser:', e);
      }
    }

    // High quality lightweight built-in fallback parser
    let html = mdText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\s*\n\*/gm, '<ul>\n*')
      .replace(/^(\*.+)$/gm, '<li>$1</li>')
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
      .replace(/\n\n+/g, '</p><p>');

    return `<p>${html}</p>`;
  }

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0ea5e9" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==========================================================================
  // Theme Toggle Management
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('atlasmind_theme') || 'dark';
    DOM.html.setAttribute('data-theme', savedTheme);

    DOM.themeToggleBtn.addEventListener('click', () => {
      const current = DOM.html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      DOM.html.setAttribute('data-theme', next);
      localStorage.setItem('atlasmind_theme', next);
      showToast(`Switched to ${next} theme`, 'info', 2000);
    });
  }

  // ==========================================================================
  // Backend Health Ping
  // ==========================================================================
  async function checkBackendHealth() {
    try {
      const response = await fetch('/health', { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        DOM.systemStatusPill.classList.remove('error');
        DOM.systemStatusText.textContent = 'System Online';
      } else {
        throw new Error('Health returned non-200');
      }
    } catch (err) {
      console.warn('Backend health check error:', err);
      DOM.systemStatusPill.classList.add('error');
      DOM.systemStatusText.textContent = 'Backend Reconnecting';
    }
  }

  // ==========================================================================
  // Planner Interaction & Input Builders
  // ==========================================================================
  function initPlanner() {
    // Mode switcher
    DOM.modeNlBtn.addEventListener('click', () => switchPlannerMode('nl'));
    DOM.modeStructuredBtn.addEventListener('click', () => switchPlannerMode('structured'));

    function switchPlannerMode(mode) {
      if (mode === 'nl') {
        DOM.modeNlBtn.classList.add('active');
        DOM.modeStructuredBtn.classList.remove('active');
        DOM.modeNlPanel.style.display = 'block';
        DOM.modeStructuredPanel.style.display = 'none';
        DOM.travelQueryInput.focus();
      } else {
        DOM.modeStructuredBtn.classList.add('active');
        DOM.modeNlBtn.classList.remove('active');
        DOM.modeNlPanel.style.display = 'none';
        DOM.modeStructuredPanel.style.display = 'block';
      }
    }

    // Preset pills click
    DOM.presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.getAttribute('data-query');
        DOM.travelQueryInput.value = query;
        switchPlannerMode('nl');
        DOM.travelQueryInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Preset loaded into planner', 'info', 1800);
      });
    });

    // Modifier chips click
    DOM.modChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const toAppend = chip.getAttribute('data-append');
        const current = DOM.travelQueryInput.value.trim();
        if (current) {
          DOM.travelQueryInput.value = `${current}, ${toAppend}`;
        } else {
          DOM.travelQueryInput.value = `Plan a trip ${toAppend}`;
        }
        DOM.travelQueryInput.focus();
      });
    });

    // Apply Structured Builder to prompt
    DOM.applyBuilderBtn.addEventListener('click', () => {
      const origin = DOM.builderOrigin.value.trim() || 'Chennai';
      const dest = DOM.builderDest.value.trim() || 'Tokyo';
      const duration = DOM.builderDuration.value;
      const style = DOM.builderStyle.value;
      const budget = DOM.builderBudget.value.trim();

      let prompt = `Plan a ${duration} trip to ${dest} from ${origin} focusing on ${style}.`;
      if (budget) {
        prompt += ` Special preferences: ${budget}.`;
      }

      DOM.travelQueryInput.value = prompt;
      switchPlannerMode('nl');
      showToast('Structured trip applied to prompt console', 'success', 2200);
    });

    // Clear Button
    DOM.clearQueryBtn.addEventListener('click', () => {
      DOM.travelQueryInput.value = '';
      DOM.travelQueryInput.focus();
    });

    // Keyboard shortcuts (Cmd+Enter or Ctrl+Enter)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!state.isOrchestrating) {
          if (document.activeElement === DOM.refinementInput) {
            handleRefinementSubmit();
          } else {
            handlePlanSubmit();
          }
        }
      }
    });

    // Launch Button
    DOM.launchAgentBtn.addEventListener('click', () => {
      if (!state.isOrchestrating) {
        handlePlanSubmit();
      }
    });

    // Refine Submit
    DOM.refineSubmitBtn.addEventListener('click', handleRefinementSubmit);

    // Refinement prompt chips
    DOM.refineChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt');
        DOM.refinementInput.value = text;
        handleRefinementSubmit();
      });
    });

    // New Trip Button
    DOM.newTripBtn.addEventListener('click', resetToNewTrip);
  }

  // ==========================================================================
  // Pipeline Orchestrator Animation Controller
  // ==========================================================================
  function startOrchestrator(queryText) {
    state.isOrchestrating = true;
    state.startTime = Date.now();

    DOM.launchAgentBtn.disabled = true;
    DOM.launchBtnLabel.textContent = 'Orchestrating Swarm...';
    DOM.orchestratorCard.style.display = 'flex';
    DOM.orchStatusMessage.textContent = `Analyzing travel query: "${queryText.slice(0, 50)}..."`;
    DOM.orchProgressBar.style.width = '10%';
    DOM.orchElapsedTime.textContent = '00:00';

    // Reset node states
    Object.values(DOM.agentNodes).forEach(node => {
      node.className = 'agent-node';
      const badge = node.querySelector('.node-status-badge');
      badge.className = 'node-status-badge pending';
      badge.textContent = 'Pending';
    });

    // Start timer counter
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - state.startTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      DOM.orchElapsedTime.textContent = `${mins}:${secs}`;
    }, 1000);

    // Start simulated progressive agent feedback
    runSimulatedNodeProgression();
  }

  function setAgentNodeStatus(agentKey, status, badgeText) {
    const node = DOM.agentNodes[agentKey];
    if (!node) return;

    node.className = `agent-node ${status}`;
    const badge = node.querySelector('.node-status-badge');
    badge.className = `node-status-badge ${status === 'active' ? 'running' : status === 'completed' ? 'done' : 'pending'}`;
    badge.textContent = badgeText;
  }

  function runSimulatedNodeProgression() {
    // Stage 1: Flight Agent active immediately
    setAgentNodeStatus('flight', 'active', 'Scanning');
    DOM.orchProgressBar.style.width = '25%';
    DOM.orchLogTicker.textContent = '[flight_agent] Parsing IATA codes and querying AviationStack radar...';

    // Stage 2: Hotel Agent
    const t1 = setTimeout(() => {
      if (!state.isOrchestrating) return;
      setAgentNodeStatus('flight', 'completed', 'Completed');
      setAgentNodeStatus('hotel', 'active', 'Researching');
      DOM.orchProgressBar.style.width = '50%';
      DOM.orchLogTicker.textContent = '[hotel_agent] Tavily Search intelligence scraping top-rated accommodations...';
    }, 2800);

    // Stage 3: Itinerary Agent
    const t2 = setTimeout(() => {
      if (!state.isOrchestrating) return;
      setAgentNodeStatus('hotel', 'completed', 'Completed');
      setAgentNodeStatus('itinerary', 'active', 'Synthesizing');
      DOM.orchProgressBar.style.width = '75%';
      DOM.orchLogTicker.textContent = '[itinerary_agent] LangGraph generating day-by-day itinerary schedule...';
    }, 5600);

    // Stage 4: Executive Dossier Agent
    const t3 = setTimeout(() => {
      if (!state.isOrchestrating) return;
      setAgentNodeStatus('itinerary', 'completed', 'Completed');
      setAgentNodeStatus('final', 'active', 'Compiling');
      DOM.orchProgressBar.style.width = '90%';
      DOM.orchLogTicker.textContent = '[final_agent] Formulating budget estimation and finalizing executive dossier...';
    }, 8500);

    state.simulatedStepInterval = [t1, t2, t3];
  }

  function finishOrchestrator(success = true) {
    state.isOrchestrating = false;
    clearInterval(state.timerInterval);
    if (state.simulatedStepInterval) {
      state.simulatedStepInterval.forEach(t => clearTimeout(t));
    }

    DOM.launchAgentBtn.disabled = false;
    DOM.launchBtnLabel.textContent = 'Launch Agent Swarm';

    if (success) {
      DOM.orchProgressBar.style.width = '100%';
      Object.keys(DOM.agentNodes).forEach(key => {
        setAgentNodeStatus(key, 'completed', 'Verified');
      });
      DOM.orchLogTicker.textContent = 'All multi-agent stages successfully synchronized.';

      setTimeout(() => {
        DOM.orchestratorCard.style.display = 'none';
      }, 1400);
    } else {
      DOM.orchestratorCard.style.display = 'none';
    }
  }

  // ==========================================================================
  // Plan Submission Handler
  // ==========================================================================
  async function handlePlanSubmit() {
    const query = DOM.travelQueryInput.value.trim();
    if (!query) {
      showToast('Please enter your travel details or select a preset', 'error', 3000);
      DOM.travelQueryInput.focus();
      return;
    }

    startOrchestrator(query);

    try {
      const response = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          thread_id: state.currentThreadId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server returned an execution error.');
      }

      finishOrchestrator(true);
      handleResponseSuccess(data, query);
    } catch (err) {
      console.error('Travel planning error:', err);
      finishOrchestrator(false);
      showToast(`Error: ${err.message}`, 'error', 5000);
    }
  }

  // ==========================================================================
  // Refinement Submission Handler (Stateful Follow-Up)
  // ==========================================================================
  async function handleRefinementSubmit() {
    const refineQuery = DOM.refinementInput.value.trim();
    if (!refineQuery) {
      showToast('Please enter a follow-up request to refine the itinerary', 'error', 3000);
      DOM.refinementInput.focus();
      return;
    }

    DOM.refineSubmitBtn.disabled = true;
    DOM.refineSubmitBtn.innerHTML = '<span class="status-dot"></span> Refining...';

    try {
      showToast('Transmitting refinement to LangGraph checkpoint graph...', 'info', 2500);

      const response = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: refineQuery,
          thread_id: state.currentThreadId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to refine trip.');
      }

      DOM.refinementInput.value = '';
      handleResponseSuccess(data, `Refinement: ${refineQuery}`);
      showToast('Trip itinerary updated with your refinements!', 'success', 3500);
    } catch (err) {
      console.error('Refinement error:', err);
      showToast(`Refinement failed: ${err.message}`, 'error', 5000);
    } finally {
      DOM.refineSubmitBtn.disabled = false;
      DOM.refineSubmitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <span>Update Plan</span>
      `;
    }
  }

  // ==========================================================================
  // Response Processing & UI Population
  // ==========================================================================
  function handleResponseSuccess(result, userQuery) {
    state.currentTripData = result;
    state.currentThreadId = result.thread_id;

    // Calculate latency
    const elapsed = state.startTime ? ((Date.now() - state.startTime) / 1000).toFixed(1) : '2.8';

    // Update active thread in navbar
    DOM.activeThreadBadge.style.display = 'flex';
    DOM.activeThreadIdText.textContent = result.thread_id ? `${result.thread_id.slice(0, 14)}...` : 'Session';
    DOM.metricThreadId.textContent = result.thread_id || 'Active Session';
    DOM.metricThreadId.title = result.thread_id;
    DOM.metricLlmCalls.textContent = result.llm_calls || 4;
    DOM.metricLatency.textContent = `${elapsed}s`;

    // Extract destination label for headline
    extractRouteAndTitle(result.answer, userQuery);

    // Render Tab 1: Executive Dossier Markdown
    DOM.executiveMarkdownOutput.innerHTML = renderMarkdown(result.answer);

    // Render Tab 2: Flights Radar View
    renderFlightsView(result.flight_results);

    // Render Tab 3: Curated Hotels View
    renderHotelsView(result.hotel_results);

    // Render Tab 4: Day-by-Day Timeline View
    renderItineraryTimeline(result.itinerary, result.answer);

    // Render Tab 5: Agent Telemetry
    renderTelemetryView(result);

    // Display Dashboard
    DOM.resultsDashboard.style.display = 'flex';
    DOM.resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Save to local history
    saveTripToHistory(userQuery, result);
  }

  // Extract Route and Title from LLM Answer or Query
  function extractRouteAndTitle(answer, query) {
    let headline = 'Curated Travel Intelligence Dossier';
    let route = 'Custom Destination';

    // Check for city / country mentions in query
    const words = query.split(/[\s,]+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase() === 'to' && words[i + 1]) {
        route = words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1);
        if (words[i + 2] && !['from', 'with', 'for', 'under'].includes(words[i + 2].toLowerCase())) {
          route += ' ' + words[i + 2];
        }
      }
    }

    // Try extracting from first markdown header
    const firstHeader = answer.match(/^#+\s*(.+)$/m);
    if (firstHeader && firstHeader[1].length < 70) {
      headline = firstHeader[1].replace(/[*_#]/g, '').trim();
    } else {
      headline = `Complete Travel Plan: ${route}`;
    }

    DOM.dossierHeadline.textContent = headline;
    DOM.dossierRouteTag.textContent = route;
    DOM.dossierTimeTag.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ==========================================================================
  // Specialized View Renderers
  // ==========================================================================

  // Tab 2: Flights Radar Parser & Renderer
  function renderFlightsView(flightRaw) {
    if (!flightRaw || flightRaw.trim() === '') {
      DOM.parsedFlightsList.innerHTML = `
        <div class="aviation-disclaimer-box">
          <span>No flight queries were dispatched for this request.</span>
        </div>`;
      DOM.flightsChipCount.textContent = 'None';
      return;
    }

    // Check for "No live flight data found" or API error
    if (flightRaw.includes('No live flight data found') || flightRaw.includes('Flight API error')) {
      DOM.parsedFlightsList.innerHTML = `
        <div class="aviation-disclaimer-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>AviationStack Live Feed Status:</strong>
            <p style="margin-top: 0.35rem;">${flightRaw}</p>
          </div>
        </div>`;
      DOM.flightsChipCount.textContent = 'Notice';
      return;
    }

    // Split formatted flight entries
    const flightBlocks = flightRaw.split(/\n\s*---\s*\n/);
    const parsedCards = [];

    flightBlocks.forEach((block, idx) => {
      const getField = (key) => {
        const match = block.match(new RegExp(`${key}:\\s*(.+)`, 'i'));
        return match ? match[1].trim() : 'N/A';
      };

      const airline = getField('Airline');
      const flightNum = getField('Flight');
      const status = getField('Status');

      // Departure fields
      const depMatch = block.match(/Departure:\s*([\s\S]*?)(?=Arrival:|$)/i);
      const depText = depMatch ? depMatch[1] : '';
      const depAirport = (depText.match(/Airport:\s*(.+)/i) || [])[1] || 'Origin Airport';
      const depIata = (depText.match(/IATA:\s*(.+)/i) || [])[1] || 'DEP';
      const depTerminal = (depText.match(/Terminal:\s*(.+)/i) || [])[1] || 'N/A';
      const depGate = (depText.match(/Gate:\s*(.+)/i) || [])[1] || 'N/A';
      const depSched = (depText.match(/Scheduled:\s*(.+)/i) || [])[1] || 'N/A';
      const depDelay = (depText.match(/Delay:\s*(.+)/i) || [])[1] || 'N/A';

      // Arrival fields
      const arrMatch = block.match(/Arrival:\s*([\s\S]*?)$/i);
      const arrText = arrMatch ? arrMatch[1] : '';
      const arrAirport = (arrText.match(/Airport:\s*(.+)/i) || [])[1] || 'Destination Airport';
      const arrIata = (arrText.match(/IATA:\s*(.+)/i) || [])[1] || 'ARR';
      const arrTerminal = (arrText.match(/Terminal:\s*(.+)/i) || [])[1] || 'N/A';
      const arrGate = (arrText.match(/Gate:\s*(.+)/i) || [])[1] || 'N/A';
      const arrSched = (arrText.match(/Scheduled:\s*(.+)/i) || [])[1] || 'N/A';
      const arrDelay = (arrText.match(/Delay:\s*(.+)/i) || [])[1] || 'N/A';

      if (airline !== 'N/A' || flightNum !== 'N/A') {
        const statusClass = status.toLowerCase() === 'active' ? 'status-active' :
                            status.toLowerCase() === 'scheduled' ? 'status-scheduled' : 'status-landed';

        // Format dates cleanly if ISO
        const formatTime = (iso) => {
          if (!iso || iso === 'Unknown' || iso === 'N/A') return 'TBD';
          try {
            const d = new Date(iso);
            return isNaN(d) ? iso : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          } catch {
            return iso;
          }
        };

        parsedCards.push(`
          <div class="flight-card">
            <div class="flight-card-header">
              <div class="airline-badge-group">
                <span class="airline-name">${airline}</span>
                <span class="flight-number-tag">${flightNum}</span>
              </div>
              <span class="flight-status-badge ${statusClass}">${status}</span>
            </div>

            <div class="flight-route-diagram">
              <div class="airport-col">
                <span class="iata-code">${depIata}</span>
                <span class="airport-name">${depAirport}</span>
              </div>
              <div class="flight-transit-indicator">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
                <div class="transit-line"></div>
              </div>
              <div class="airport-col dest">
                <span class="iata-code">${arrIata}</span>
                <span class="airport-name">${arrAirport}</span>
              </div>
            </div>

            <div class="flight-details-grid">
              <div class="detail-slot">
                <span class="slot-label">Departure</span>
                <span class="slot-value">${formatTime(depSched)}</span>
              </div>
              <div class="detail-slot">
                <span class="slot-label">Terminal / Gate</span>
                <span class="slot-value">T${depTerminal} • Gate ${depGate}</span>
              </div>
              <div class="detail-slot">
                <span class="slot-label">Arrival</span>
                <span class="slot-value">${formatTime(arrSched)}</span>
              </div>
              <div class="detail-slot">
                <span class="slot-label">Delay Status</span>
                <span class="slot-value">${depDelay === 'N/A' ? 'On Time' : depDelay}</span>
              </div>
            </div>
          </div>
        `);
      }
    });

    if (parsedCards.length > 0) {
      DOM.parsedFlightsList.innerHTML = parsedCards.join('');
      DOM.flightsChipCount.textContent = `${parsedCards.length} Flights`;
    } else {
      DOM.parsedFlightsList.innerHTML = `
        <div class="aviation-disclaimer-box">
          <pre style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.8rem;">${flightRaw}</pre>
        </div>`;
      DOM.flightsChipCount.textContent = 'Raw Data';
    }
  }

  // Tab 3: Curated Hotels Parser & Renderer
  function renderHotelsView(hotelRaw) {
    if (!hotelRaw || hotelRaw.trim() === '') {
      DOM.parsedHotelsGrid.innerHTML = `
        <div class="aviation-disclaimer-box">
          <span>No specific hotel recommendations returned.</span>
        </div>`;
      DOM.hotelsChipCount.textContent = '0';
      return;
    }

    // Match lines formatted as: "1. **Hotel Name**\n   https://url\n   Snippet..."
    const hotelPattern = /(\d+)\.\s+\*\*(.*?)\*\*\s*\n\s*(https?:\/\/[^\s]+)?\s*\n\s*([\s\S]*?)(?=(?:\d+\.\s+\*\*)|$)/g;
    const cards = [];
    let match;

    while ((match = hotelPattern.exec(hotelRaw)) !== null) {
      const num = match[1];
      const name = match[2];
      const url = match[3] || '#';
      const snippet = match[4].trim();

      cards.push(`
        <div class="hotel-card">
          <div class="hotel-card-header">
            <span class="hotel-num-badge">Stay #${num}</span>
            <div class="hotel-stars">★★★★★</div>
          </div>
          <h5 class="hotel-name">${name}</h5>
          <p class="hotel-snippet">${snippet}</p>
          ${url && url !== '#' ? `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="hotel-link-btn">
              <span>View Property Details</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          ` : ''}
        </div>
      `);
    }

    if (cards.length > 0) {
      DOM.parsedHotelsGrid.innerHTML = cards.join('');
      DOM.hotelsChipCount.textContent = `${cards.length} Stays`;
    } else {
      // Fallback markdown format
      DOM.parsedHotelsGrid.innerHTML = renderMarkdown(hotelRaw);
      DOM.hotelsChipCount.textContent = 'Curated';
    }
  }

  // Tab 4: Day-by-Day Timeline Parser
  function renderItineraryTimeline(itineraryText, fullAnswer) {
    const textToParse = itineraryText || fullAnswer || '';
    if (!textToParse) {
      DOM.parsedItineraryTimeline.innerHTML = '<p class="text-muted">No day-by-day itinerary data.</p>';
      return;
    }

    // Split text into days: e.g. "Day 1:", "Day 2:"
    const dayRegex = /(Day\s+\d+[^:\n]*[:\n])([\s\S]*?)(?=(?:Day\s+\d+[^:\n]*[:\n])|$)/gi;
    const cards = [];
    let match;

    while ((match = dayRegex.exec(textToParse)) !== null) {
      const header = match[1].replace(/[:*#]/g, '').trim();
      const content = match[2].trim();

      cards.push(`
        <div class="day-card">
          <div class="day-card-header">
            <span class="day-badge">${header}</span>
          </div>
          <div class="day-content">
            ${renderMarkdown(content)}
          </div>
        </div>
      `);
    }

    if (cards.length > 0) {
      DOM.parsedItineraryTimeline.innerHTML = cards.join('');
    } else {
      DOM.parsedItineraryTimeline.innerHTML = renderMarkdown(textToParse);
    }
  }

  // Tab 5: Agent Telemetry & Transparency
  function renderTelemetryView(data) {
    DOM.telemetryFlightRaw.textContent = data.flight_results || 'No raw flight results recorded.';
    DOM.telemetryHotelRaw.textContent = data.hotel_results || 'No raw hotel results recorded.';
    DOM.telemetryItineraryRaw.textContent = data.itinerary || 'No raw itinerary synthesis recorded.';

    const sessionState = {
      thread_id: data.thread_id,
      llm_calls: data.llm_calls,
      status: 'checkpointed_in_postgres',
      timestamp: new Date().toISOString(),
    };
    DOM.telemetrySessionRaw.textContent = JSON.stringify(sessionState, null, 2);
  }

  // ==========================================================================
  // Dashboard Tab Switching
  // ==========================================================================
  function initDashboardTabs() {
    DOM.dashTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        DOM.dashTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        DOM.dashPanels.forEach(panel => {
          if (panel.id === targetTab) {
            panel.style.display = 'flex';
          } else {
            panel.style.display = 'none';
          }
        });
      });
    });
  }

  // ==========================================================================
  // Copy, Print, and Download Actions
  // ==========================================================================
  function initActionButtons() {
    // Copy Thread ID
    DOM.copyThreadBtn.addEventListener('click', () => {
      if (state.currentThreadId) {
        navigator.clipboard.writeText(state.currentThreadId);
        showToast('Thread Session ID copied to clipboard', 'success', 2000);
      }
    });

    DOM.metricThreadId.addEventListener('click', () => {
      if (state.currentThreadId) {
        navigator.clipboard.writeText(state.currentThreadId);
        showToast('Thread Session ID copied to clipboard', 'success', 2000);
      }
    });

    // Print / PDF
    DOM.actionPrintBtn.addEventListener('click', () => {
      window.print();
    });

    // Copy Markdown
    DOM.actionCopyBtn.addEventListener('click', () => {
      if (state.currentTripData && state.currentTripData.answer) {
        navigator.clipboard.writeText(state.currentTripData.answer);
        showToast('Full Markdown itinerary copied to clipboard!', 'success', 2500);
      }
    });

    // Download JSON
    DOM.actionDownloadJsonBtn.addEventListener('click', () => {
      if (!state.currentTripData) return;
      const jsonStr = JSON.stringify(state.currentTripData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlasmind-dossier-${state.currentThreadId || 'trip'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded trip dossier as JSON', 'info', 2200);
    });
  }

  // ==========================================================================
  // Reset To New Trip
  // ==========================================================================
  function resetToNewTrip() {
    state.currentThreadId = null;
    state.currentTripData = null;

    DOM.activeThreadBadge.style.display = 'none';
    DOM.resultsDashboard.style.display = 'none';
    DOM.orchestratorCard.style.display = 'none';
    DOM.travelQueryInput.value = '';

    DOM.plannerCard.scrollIntoView({ behavior: 'smooth' });
    DOM.travelQueryInput.focus();
    showToast('New trip session initiated', 'info', 2000);
  }

  // ==========================================================================
  // History Drawer & LocalStorage Management
  // ==========================================================================
  function initHistory() {
    loadHistoryFromStorage();

    DOM.historyToggleBtn.addEventListener('click', openHistoryDrawer);
    DOM.closeHistoryBtn.addEventListener('click', closeHistoryDrawer);
    DOM.drawerBackdrop.addEventListener('click', closeHistoryDrawer);

    DOM.clearAllHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all saved trip dossiers?')) {
        state.history = [];
        localStorage.removeItem('atlasmind_trips');
        renderHistoryList();
        updateHistoryCount();
        showToast('Trip history cleared', 'info', 2000);
      }
    });
  }

  function openHistoryDrawer() {
    DOM.historyDrawer.classList.add('open');
    DOM.drawerBackdrop.classList.add('open');
    renderHistoryList();
  }

  function closeHistoryDrawer() {
    DOM.historyDrawer.classList.remove('open');
    DOM.drawerBackdrop.classList.remove('open');
  }

  function saveTripToHistory(query, tripData) {
    const item = {
      id: tripData.thread_id || `trip_${Date.now()}`,
      query: query,
      timestamp: new Date().toISOString(),
      data: tripData,
    };

    // Filter duplicates
    state.history = state.history.filter(h => h.id !== item.id);
    state.history.unshift(item);

    // Keep max 20 trips
    if (state.history.length > 20) {
      state.history = state.history.slice(0, 20);
    }

    localStorage.setItem('atlasmind_trips', JSON.stringify(state.history));
    updateHistoryCount();
  }

  function loadHistoryFromStorage() {
    try {
      const stored = localStorage.getItem('atlasmind_trips');
      if (stored) {
        state.history = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
      state.history = [];
    }
    updateHistoryCount();
  }

  function updateHistoryCount() {
    DOM.historyCountBadge.textContent = state.history.length;
  }

  function renderHistoryList() {
    if (state.history.length === 0) {
      DOM.historyItemsContainer.innerHTML = `
        <div class="history-empty-state">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>No past trips recorded yet.</p>
          <span>Plan your first trip above and it will automatically save here.</span>
        </div>`;
      return;
    }

    DOM.historyItemsContainer.innerHTML = state.history.map(item => {
      const dateFormatted = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="history-item-card" data-id="${item.id}">
          <div class="history-item-header">
            <span class="history-item-date">${dateFormatted}</span>
            <span class="history-item-thread">${item.id.slice(0, 10)}...</span>
          </div>
          <div class="history-item-query">${item.query}</div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    DOM.historyItemsContainer.querySelectorAll('.history-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const found = state.history.find(h => h.id === id);
        if (found) {
          closeHistoryDrawer();
          handleResponseSuccess(found.data, found.query);
          DOM.travelQueryInput.value = found.query;
          showToast(`Restored trip plan for ${found.id.slice(0, 12)}`, 'info', 2500);
        }
      });
    });
  }

  // ==========================================================================
  // Application Entrypoint
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkBackendHealth();
    initPlanner();
    initDashboardTabs();
    initActionButtons();
    initHistory();

    // Periodic health ping
    setInterval(checkBackendHealth, 30000);
  });

})();
