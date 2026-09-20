const openButton = document.getElementById("openInvitation");
const invitationScreen = document.getElementById("invitationScreen");
const scrollProgress = document.getElementById("scrollProgress");
const scrollHint = document.getElementById("scrollHint");
const cardWindow = document.getElementById("cardWindow");
const cardColumn = document.getElementById("cardColumn");
const sections = [...cardColumn.querySelectorAll(".sec")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let opened = false;
let ticking = false;
let travel = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* How far the text column has to travel, and how tall the page must be for that.
   The page height = screen height + travel, so scrolling feels natural (1 : 1). */
function measure() {
  travel = Math.max(0, cardColumn.offsetHeight - cardWindow.clientHeight);
  invitationScreen.style.height = `${window.innerHeight + travel}px`;
}

/* A section fades in the first time it comes into view and then stays (never hidden again). */
function revealVisible() {
  const box = cardWindow.getBoundingClientRect();
  const line = box.top + box.height * 0.72;   // a section appears once it rises into the upper part of the window
  sections.forEach((section, index) => {
    if (index === 0 || section.classList.contains("in")) return;   // the first screen is revealed on open
    if (section.getBoundingClientRect().top < line) section.classList.add("in");
  });
}

function updateScrollScene() {
  ticking = false;
  if (!opened) return;

  const maxScroll = Math.max(1, invitationScreen.offsetHeight - window.innerHeight);
  const progress = clamp(window.scrollY / maxScroll, 0, 1);

  cardColumn.style.transform = `translate3d(0, ${-progress * travel}px, 0)`;
  scrollProgress.style.width = `${progress * 100}%`;
  scrollHint.style.opacity = progress > 0.03 ? "0" : "1";
  revealVisible();
}

function requestUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateScrollScene);
  }
}

openButton.addEventListener("click", () => {
  if (opened) return;
  opened = true;
  document.body.classList.add("opened");
  invitationScreen.setAttribute("aria-hidden", "false");
  window.scrollTo({ top: 0, behavior: "auto" });

  measure();
  requestAnimationFrame(updateScrollScene);

  // the flaps slide open (~1.5s), then the first screen appears calmly and flowers + hearts start falling
  setTimeout(() => sections[0].classList.add("in"), reduceMotion ? 0 : 1100);
  setTimeout(startShower, 450);
  startMusic();
});

/* ------------------------------------------------------------------
   Background music — starts (with sound) the moment the seal is tapped,
   since that tap is a real user gesture browsers allow audio on.
   ------------------------------------------------------------------ */
const bgMusic = document.getElementById("bgMusic");
const soundToggle = document.getElementById("soundToggle");

function startMusic() {
  if (!bgMusic) return;
  bgMusic.volume = 0.55;
  bgMusic.play().catch(() => {
    // autoplay refused for some reason (rare) — let the toggle button start it instead
    soundToggle.setAttribute("aria-pressed", "true");
  });
}

if (soundToggle && bgMusic) {
  soundToggle.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(() => {});
      soundToggle.setAttribute("aria-pressed", "false");
    } else {
      bgMusic.pause();
      soundToggle.setAttribute("aria-pressed", "true");
    }
  });
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", () => { if (opened) { measure(); requestUpdate(); } });
window.addEventListener("load", () => { if (opened) { measure(); requestUpdate(); } });

/* ------------------------------------------------------------------
   Flowers + hearts falling when the invitation is opened
   ------------------------------------------------------------------ */
function startShower() {
  if (reduceMotion) return;
  const canvas = document.getElementById("shower");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* the flower is pre-drawn once into a small sprite, so every frame is cheap on phones */
  const SPRITE = 48;
  const sprite = document.createElement("canvas");
  let spriteReady = false;
  const flowerImg = new Image();
  flowerImg.src = "assets/burgundy-flower.png";
  flowerImg.onload = () => {
    const ratio = flowerImg.naturalHeight / flowerImg.naturalWidth;
    sprite.width = SPRITE; sprite.height = Math.round(SPRITE * ratio);
    sprite.getContext("2d").drawImage(flowerImg, 0, 0, sprite.width, sprite.height);
    spriteReady = true;
  };

  const heartColors = ["#8c1c2e", "#b3243b", "#d24a63", "#e9a3ae", "#d9b25f", "#f3d9a4"];
  const small = W < 700;
  const POPULATION = small ? 22 : 40;        // kept constant — the shower never stops
  const rand = (a, b) => a + Math.random() * (b - a);
  const items = [];

  function makeItem(atTop) {
    const isFlower = Math.random() < 0.5;
    const size = isFlower ? rand(11, 24) : rand(7, 15);
    const depth = size / (isFlower ? 24 : 15);
    return {
      flower: isFlower,
      color: heartColors[(Math.random() * heartColors.length) | 0],
      x: rand(-20, W + 20),
      y: atTop ? rand(-40, -10) : rand(-H, -10),
      size,
      vy: rand(34, 62) + depth * 42,
      sway: rand(10, 34), swayFreq: rand(0.5, 1.3), phase: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2), rotSpeed: rand(-1, 1),
      flip: rand(0.6, 1.6),
      alpha: rand(0.55, 0.9)
    };
  }
  for (let i = 0; i < POPULATION; i++) items.push(makeItem(false));

  function heartPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 0.9, -s * 0.25, -s * 0.5, -s * 0.95, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.5, -s * 0.95, s * 0.9, -s * 0.25, 0, s * 0.35);
    ctx.closePath();
  }

  let last = performance.now();
  let running = true;

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;

    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < items.length; i++) {
      let it = items[i];
      it.y += it.vy * dt;
      it.rot += it.rotSpeed * dt;

      if (it.y > H + 60) { items[i] = it = makeItem(true); }      // recycled straight back to the top

      const px = it.x + Math.sin(t * it.swayFreq + it.phase) * it.sway;
      const fadeIn = clamp((it.y + 20) / 80, 0, 1);
      const fadeOut = clamp((H + 50 - it.y) / 140, 0, 1);

      ctx.save();
      ctx.globalAlpha = it.alpha * fadeIn * fadeOut;
      ctx.translate(px, it.y);
      if (it.flower) {
        ctx.rotate(it.rot);
        ctx.scale(1, Math.max(0.35, Math.abs(Math.cos(t * it.flip + it.phase))));
        if (spriteReady) {
          const h = it.size * (sprite.height / sprite.width);
          ctx.drawImage(sprite, -it.size / 2, -h / 2, it.size, h);
        }
      } else {
        ctx.rotate(Math.sin(t * it.swayFreq + it.phase) * 0.45);
        ctx.fillStyle = it.color;
        heartPath(it.size);
        ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* stop burning battery while the tab is in the background */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });
}

/* ------------------------------------------------------------------
   Wishes wall — saved live to Firebase (Firestore) so the couple can
   see every wish from any device, in real time. Each guest's browser
   is signed in anonymously (no login screen — Firebase just gives it
   a private ID), which is how we let a guest delete only their own
   wish and nobody else's. See firebase-config.js for one-time setup.
   ------------------------------------------------------------------ */
const wishForm = document.getElementById("wishForm");
const wishName = document.getElementById("wishName");
const wishText = document.getElementById("wishText");
const wishSubmit = document.getElementById("wishSubmit");
const wishList = document.getElementById("wishList");
const wishThanks = document.getElementById("wishThanks");
const wishStatus = document.getElementById("wishStatus");

const firebaseReady = typeof firebase !== "undefined"
  && typeof firebaseConfig !== "undefined"
  && firebaseConfig.apiKey
  && firebaseConfig.apiKey !== "YOUR_API_KEY";

let myUid = null;
let wishesCol = null;

function setStatus(msg) {
  if (wishStatus) wishStatus.textContent = msg;
}

function renderWishes(docs) {
  if (!wishList) return;
  wishList.innerHTML = "";
  docs.forEach(doc => {
    const w = doc.data();
    const li = document.createElement("li");

    const p = document.createElement("p");
    p.textContent = w.text;

    const span = document.createElement("span");
    span.textContent = w.name || "A guest";

    li.append(p, span);

    if (myUid && w.ownerId === myUid) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "wish-delete";
      del.setAttribute("aria-label", "Delete my wish");
      del.textContent = "✕";
      del.addEventListener("click", () => {
        li.classList.add("removing");
        wishesCol.doc(doc.id).delete().catch(() => {
          li.classList.remove("removing");
          setStatus("تعذّر حذف الأمنية، حاول تاني.");
        });
      });
      li.appendChild(del);
    }

    wishList.appendChild(li);
  });
  wishList.classList.toggle("has-items", docs.length > 0);
  if (opened) measure();
}

if (wishForm) {
  if (!firebaseReady) {
    // firebase-config.js still has placeholder keys — the form stays visible
    // but explains what's missing instead of silently failing.
    setStatus("قسم الأمنيات محتاج ضبط Firebase (راجع تعليمات firebase-config.js).");
    wishSubmit.disabled = true;
  } else {
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    wishesCol = db.collection("wishes");

    auth.onAuthStateChanged(user => {
      if (user) {
        myUid = user.uid;
        wishesCol.orderBy("createdAt", "desc").limit(30).onSnapshot(
          snap => { renderWishes(snap.docs); setStatus(""); },
          () => setStatus("تعذّر تحميل الأمنيات الآن.")
        );
      }
    });
    auth.signInAnonymously().catch(() => setStatus("تعذّر الاتصال الآن، حاول تحديث الصفحة."));

    wishForm.addEventListener("submit", event => {
      event.preventDefault();
      const name = wishName.value.trim() || "A guest";
      const text = wishText.value.trim();
      if (!text || !myUid) return;

      wishSubmit.disabled = true;
      wishesCol.add({
        name,
        text,
        ownerId: myUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        wishText.value = "";
        wishThanks.classList.add("show");
        setTimeout(() => wishThanks.classList.remove("show"), 3200);
      }).catch(() => {
        setStatus("تعذّر إرسال الأمنية، حاول تاني.");
      }).finally(() => {
        wishSubmit.disabled = false;
      });
    });
  }
}

// Wedding date: 3 October 2026, 9:00 PM (local browser time).
const weddingDate = new Date(2026, 9, 3, 21, 0, 0).getTime();
const countdownEls = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
};

function pad(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function updateCountdown() {
  const distance = weddingDate - Date.now();
  const safeDistance = Math.max(0, distance);

  const days = Math.floor(safeDistance / 86400000);
  const hours = Math.floor((safeDistance % 86400000) / 3600000);
  const minutes = Math.floor((safeDistance % 3600000) / 60000);
  const seconds = Math.floor((safeDistance % 60000) / 1000);

  countdownEls.days.textContent = pad(days);
  countdownEls.hours.textContent = pad(hours);
  countdownEls.minutes.textContent = pad(minutes);
  countdownEls.seconds.textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);
