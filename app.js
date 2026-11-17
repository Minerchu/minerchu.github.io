(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header, active navigation and mobile menu */
  const header = $("#site-header");
  const nav = $("#primary-nav");
  const menuToggle = $(".menu-toggle");
  const navLinks = $$(".primary-nav a");
  const navSections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  const setHeaderState = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const closeMenu = (restoreFocus = false) => {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "打开导航");
    if (restoreFocus) menuToggle.focus();
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      nav.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu(true);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* Scroll-linked state for main navigation and guide rail */
  const guideLinks = $$(".guide-rail a");
  const guideCards = guideLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  let scrollFrame = 0;
  const updateScrollState = () => {
    scrollFrame = 0;
    setHeaderState();

    const anchor = window.scrollY + window.innerHeight * 0.34;
    let activeSection = null;
    navSections.forEach((section) => {
      if (section.getBoundingClientRect().top + window.scrollY <= anchor) activeSection = section;
    });
    navLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        Boolean(activeSection) && link.getAttribute("href") === `#${activeSection.id}`
      );
    });

    let activeGuide = null;
    guideCards.forEach((card) => {
      if (card.getBoundingClientRect().top + window.scrollY <= anchor) activeGuide = card;
    });
    guideLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        Boolean(activeGuide) && link.getAttribute("href") === `#${activeGuide.id}`
      );
    });
  };

  const requestScrollState = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  };

  window.addEventListener("scroll", requestScrollState, { passive: true });
  window.addEventListener("resize", requestScrollState);
  updateScrollState();

  /* Interface preview tabs */
  const tabs = $$(".tour-tab");
  const panels = tabs
    .map((tab) => document.getElementById(tab.getAttribute("aria-controls")))
    .filter(Boolean);

  const activateTab = (index, moveFocus = false) => {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (panels[tabIndex]) {
        panels[tabIndex].classList.toggle("is-active", selected);
        panels[tabIndex].hidden = !selected;
      }
    });
    if (moveFocus && tabs[index]) tabs[index].focus();
  };

  if (tabs.length) {
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(index));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        }
        if (nextIndex !== null) {
          event.preventDefault();
          activateTab(nextIndex, true);
        }
      });
    });
  }

  /* Daily viewing limit demo */
  const demo = $(".time-demo");
  if (demo) {
    const chips = $$(".limit-chip", demo);
    const usedValue = $("[data-used]", demo);
    const remainingEl = $(".demo-remaining", demo);
    const progress = $("[data-progress]", demo);
    const bar = $("[data-bar]", demo);
    const watchButton = $("[data-watch]", demo);
    const resetButton = $("[data-reset]", demo);
    const normalScreen = $("[data-screen-normal]", demo);
    const lockScreen = $("[data-screen-lock]", demo);
    const screenUsed = $("[data-screen-used]", demo);
    const screenLimit = $("[data-screen-limit]", demo);
    const screenUnit = $("[data-screen-unit]", demo);

    let limit = 30;
    let used = 0;

    const renderDemo = () => {
      const unlimited = limit === 0;
      const reached = !unlimited && used >= limit;
      const percentage = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

      if (usedValue) usedValue.textContent = String(used);
      if (screenUsed) screenUsed.textContent = String(used);
      if (screenLimit) screenLimit.textContent = unlimited ? "不限时" : String(limit);
      if (screenUnit) screenUnit.hidden = unlimited;

      if (bar) bar.style.width = `${percentage}%`;
      if (progress) {
        progress.classList.toggle("is-warning", percentage >= 75 && percentage < 100);
        progress.classList.toggle("is-full", percentage >= 100);
        progress.setAttribute("aria-valuemax", unlimited ? "100" : String(limit));
        progress.setAttribute("aria-valuenow", unlimited ? "0" : String(Math.min(used, limit)));
        progress.setAttribute(
          "aria-valuetext",
          unlimited ? "今日观看不限时" : `今日已观看 ${used} 分钟，上限 ${limit} 分钟`
        );
      }

      if (remainingEl) {
        if (unlimited) {
          remainingEl.textContent = "今天不限时，按家庭节奏安排";
        } else {
          const remaining = Math.max(0, limit - used);
          remainingEl.innerHTML = `今天还可以看 <strong>${remaining}</strong> 分钟`;
        }
      }

      if (normalScreen) normalScreen.hidden = reached;
      if (lockScreen) lockScreen.hidden = !reached;
      if (watchButton) {
        watchButton.disabled = reached;
        watchButton.textContent = reached ? "今天已经到上限" : "模拟观看 10 分钟";
      }
      demo.classList.toggle("is-locked", reached);
    };

    chips.forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.classList.contains("is-active")));
      chip.addEventListener("click", () => {
        limit = Number(chip.dataset.limit) || 0;
        if (limit > 0 && used > limit) used = limit;
        chips.forEach((item) => {
          const active = item === chip;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderDemo();
      });
    });

    if (watchButton) {
      watchButton.addEventListener("click", () => {
        used += 10;
        if (limit > 0) used = Math.min(used, limit);
        renderDemo();
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        used = 0;
        renderDemo();
        if (watchButton) watchButton.focus({ preventScroll: true });
      });
    }

    renderDemo();
  }

  /* Reveal-on-scroll, with a reduced-motion fallback */
  const revealItems = $$("[data-reveal]");
  if (!reducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* Footer year */
  const year = String(new Date().getFullYear());
  $$("[data-year]").forEach((node) => {
    node.textContent = year;
  });
})();