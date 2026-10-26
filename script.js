(() => {
  "use strict";

  const stage = document.querySelector("#gameStage");
  const gameArea = document.querySelector("#gameArea");
  const title = document.querySelector("#stageTitle");
  const eyebrow = document.querySelector("#stageEyebrow");
  const instructions = document.querySelector("#gameInstructions");
  const scoreText = document.querySelector("#score");
  const status = document.querySelector("#gameStatus");
  const restartButton = document.querySelector("#restartGame");
  const closeButton = document.querySelector("#closeGame");
  const mobileControls = document.querySelector("#mobileControls");

  let activeGame = null;
  let score = 0;
  let timerId = null;
  let timeLeft = 25;
  let state = {};

  const maps = {
    pacman: [
      "###############",
      "#.....#.......#",
      "#.###.#.#####.#",
      "#.#...#.....#.#",
      "#.#.#####.#.#.#",
      "#...#...#.#...#",
      "###.#.#.#.###.#",
      "#...#.#...#...#",
      "#.###.#####.###",
      "#.............#",
      "###############"
    ],
    maze: [
      "###############",
      "#S#.....#.....#",
      "#.#.###.#.###.#",
      "#...#...#...#.#",
      "###.#.#####.#.#",
      "#...#.....#.#.#",
      "#.#####.#.#.#.#",
      "#.....#.#...#.#",
      "#.###.#.#####.#",
      "#.....#......E#",
      "###############"
    ]
  };

  function setScore(value) {
    score = value;
    scoreText.textContent = String(score);
  }

  function clearTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function openGame(game) {
    activeGame = game;
    stage.classList.remove("hidden");
    stage.scrollIntoView({ behavior: "smooth", block: "start" });
    startGame();
  }

  function startGame() {
    clearTimer();
    state = {};
    setScore(0);
    gameArea.innerHTML = "";
    status.textContent = "¡Buena suerte!";
    mobileControls.classList.toggle("hidden", activeGame === "stars");
    if (activeGame === "pacman") {
      title.textContent = "Comepuntos";
      eyebrow.textContent = "JUEGO 01 · ARCADE";
      instructions.textContent = "Flechas o controles táctiles para moverte. Evita al fantasma.";
      initGridGame("pacman");
    } else if (activeGame === "maze") {
      title.textContent = "Escape Maze";
      eyebrow.textContent = "JUEGO 02 · LABERINTO";
      instructions.textContent = "Encuentra la bandera ⚑. Usa las flechas para avanzar.";
      initGridGame("maze");
    } else if (activeGame === "stars") {
      title.textContent = "Cazador de estrellas";
      eyebrow.textContent = "JUEGO 03 · REFLEJOS";
      instructions.textContent = "Toca las estrellas tan rápido como puedas. Tienes 25 segundos.";
      initStarsGame();
    }
  }

  function initGridGame(type) {
    const source = maps[type].map(row => row.split(""));
    const board = source.map(row => row.slice());
    const start = type === "maze" ? findChar(board, "S") : { r: 1, c: 1 };
    const player = { ...start };
    let ghost = type === "pacman" ? { r: 9, c: 13 } : null;
    if (type === "maze") board[player.r][player.c] = ".";
    state = { board, player, ghost, type, over: false };

    const grid = document.createElement("div");
    grid.className = "game-grid-board";
    grid.style.gridTemplateColumns = `repeat(${board[0].length}, auto)`;
    grid.setAttribute("role", "img");
    grid.setAttribute("aria-label", type === "maze" ? "Laberinto interactivo" : "Laberinto Comepuntos");
    state.grid = grid;
    gameArea.appendChild(grid);
    renderGrid();

    if (type === "pacman") {
      status.textContent = "Recoge los puntos y evita al fantasma.";
    } else {
      status.textContent = "Llega a la bandera para escapar.";
    }
  }

  function findChar(board, char) {
    for (let r = 0; r < board.length; r++) {
      const c = board[r].indexOf(char);
      if (c !== -1) return { r, c };
    }
    return { r: 1, c: 1 };
  }

  function renderGrid() {
    const { board, player, ghost, type, grid } = state;
    grid.innerHTML = "";
    let remaining = 0;
    board.forEach((row, r) => row.forEach((cell, c) => {
      const el = document.createElement("div");
      el.className = "cell";
      if (cell === "#") el.classList.add("wall");
      if (cell === "." && type === "pacman") { el.classList.add("dot"); remaining++; }
      if (cell === "E") el.classList.add("exit");
      if (r === player.r && c === player.c) el.classList.add("player");
      else if (ghost && r === ghost.r && c === ghost.c) el.classList.add("ghost");
      grid.appendChild(el);
    }));
    state.remaining = remaining;
  }

  function movePlayer(dr, dc) {
    if (!activeGame || state.over) return;
    if (activeGame === "stars") return;
    const { board, player, ghost, type } = state;
    const nr = player.r + dr, nc = player.c + dc;
    if (!board[nr] || board[nr][nc] === undefined || board[nr][nc] === "#") return;

    if (type === "maze" && board[nr][nc] === "E") {
      player.r = nr; player.c = nc;
      finishGridGame(true, "¡Lo lograste!", "Encontraste la salida del laberinto.");
      return;
    }
    if (type === "pacman" && board[nr][nc] === ".") {
      board[nr][nc] = " ";
      setScore(score + 10);
    }
    player.r = nr; player.c = nc;

    if (type === "pacman" && ghost) {
      const options = [[-1,0],[1,0],[0,-1],[0,1]]
        .map(([y,x]) => ({ r: ghost.r+y, c: ghost.c+x }))
        .filter(p => board[p.r] && board[p.r][p.c] !== "#");
      if (options.length) {
        options.sort((a,b) => (Math.abs(a.r-player.r)+Math.abs(a.c-player.c)) - (Math.abs(b.r-player.r)+Math.abs(b.c-player.c)));
        const next = Math.random() < 0.65 ? options[0] : options[Math.floor(Math.random()*options.length)];
        ghost.r = next.r; ghost.c = next.c;
      }
      if (ghost.r === player.r && ghost.c === player.c) {
        renderGrid();
        finishGridGame(false, "¡Te atraparon!", "No pasa nada: reinicia e inténtalo otra vez.");
        return;
      }
      const remaining = board.flat().filter(cell => cell === ".").length;
      if (remaining === 0) {
        renderGrid();
        finishGridGame(true, "¡Laberinto limpio!", "Recogiste todos los puntos.");
        return;
      }
    }
    renderGrid();
  }

  function finishGridGame(won, heading, message) {
    state.over = true;
    const overlay = document.createElement("div");
    overlay.className = "status-overlay";
    overlay.innerHTML = `<h3>${heading}</h3><p>${message}</p>`;
    gameArea.appendChild(overlay);
    status.textContent = won ? "¡Nivel completado!" : "Fin de la partida.";
  }

  function initStarsGame() {
    const field = document.createElement("div");
    field.className = "stars-field";
    field.setAttribute("aria-label", "Área para recoger estrellas");
    gameArea.appendChild(field);
    state.field = field;
    state.over = false;
    timeLeft = 25;
    status.textContent = `Tiempo: ${timeLeft} s`;
    spawnStar();
    timerId = setInterval(() => {
      timeLeft--;
      status.textContent = `Tiempo: ${timeLeft} s`;
      if (timeLeft <= 0) {
        clearTimer();
        state.over = true;
        field.innerHTML = `<div class="status-overlay"><h3>¡Tiempo!</h3><p>Conseguiste ${score} puntos. ¡Vuelve a intentarlo!</p></div>`;
        status.textContent = `Fin del juego · ${score} puntos`;
      }
    }, 1000);
  }

  function spawnStar() {
    if (!state.field || state.over) return;
    state.field.innerHTML = "";
    const star = document.createElement("button");
    star.className = "target-star";
    star.type = "button";
    star.textContent = "★";
    star.setAttribute("aria-label", "Recoger estrella");
    star.style.left = `${5 + Math.random()*82}%`;
    star.style.top = `${5 + Math.random()*72}%`;
    star.addEventListener("click", () => {
      if (state.over) return;
      setScore(score + 1);
      spawnStar();
    });
    state.field.appendChild(star);
  }

  document.querySelectorAll("[data-game]").forEach(button => {
    button.addEventListener("click", () => openGame(button.dataset.game));
  });
  restartButton.addEventListener("click", startGame);
  closeButton.addEventListener("click", () => {
    clearTimer();
    activeGame = null;
    stage.classList.add("hidden");
    document.querySelector("#games").scrollIntoView({ behavior: "smooth" });
  });

  document.addEventListener("keydown", event => {
    if (stage.classList.contains("hidden")) return;
    const directions = {
      ArrowUp: [-1,0], w: [-1,0], W: [-1,0],
      ArrowDown: [1,0], s: [1,0], S: [1,0],
      ArrowLeft: [0,-1], a: [0,-1], A: [0,-1],
      ArrowRight: [0,1], d: [0,1], D: [0,1]
    };
    if (directions[event.key]) {
      event.preventDefault();
      movePlayer(...directions[event.key]);
    }
  });

  mobileControls.querySelectorAll("[data-dir]").forEach(button => {
    button.addEventListener("click", () => {
      const dirs = { up: [-1,0], down: [1,0], left: [0,-1], right: [0,1] };
      movePlayer(...dirs[button.dataset.dir]);
    });
  });
})();
