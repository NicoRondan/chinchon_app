      // ======= STATE & STORAGE =======
      const LS_KEY = "chinchon_data_v3";
      let playerNames = ["Jugador 1", "Jugador 2"];
      let roundsArr = Array.from({ length: 10 }, () => []);
      let manualEnganches = [];
      let engancheAnimQueue = [];
      let isStickyTotal = false;
      let lastTotals = [];
      let gameOver = false;
      let winnerIndex = null;
      let enganches = []; // { idx, round, ref, total }
      let playerColors = [];
      let saveTimeout;
      let dealerIndex = 0;
      let lastDealerRound = -1;

      // References to DOM rows and cells to avoid repeated queries
      const rowRefs = [];
      const cellRefs = [];
      let addRowRef = null;
      let addRowInputs = [];

      const isManualEnganchado = (idx) =>
        manualEnganches.some((e) => e.idx === idx);

      function loadFromLS() {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) {
            const data = JSON.parse(raw);
            playerNames = data.playerNames || playerNames;
            roundsArr = data.roundsArr || roundsArr;
            manualEnganches = data.manualEnganches || [];
            gameOver = data.gameOver || false;
            winnerIndex = data.winnerIndex ?? null;
            enganches = data.enganches || [];
            playerColors = data.playerColors || playerNames.map(() => generatePastelColor());
            dealerIndex = data.dealerIndex ?? 0;
          } else {
            playerColors = playerNames.map(() => generatePastelColor());
          }
          if (playerColors.length < playerNames.length) {
            for (let i = playerColors.length; i < playerNames.length; i++) {
              playerColors.push(generatePastelColor());
            }
          }
          if (dealerIndex >= playerNames.length) {
            dealerIndex = 0;
          }
        } catch (e) {
          console.error("loadFromLS error", e);
          showNotif(
            "No se pudo cargar el almacenamiento local. Usando memoria.",
            "bg-red-600"
          );
        }
      }
      function saveToLS() {
        try {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({
              playerNames,
              roundsArr,
              manualEnganches,
              enganches,
              gameOver,
              winnerIndex,
              playerColors,
              dealerIndex,
            })
          );
        } catch (e) {
          console.error("saveToLS error", e);
          showNotif(
            "No se pudo guardar en el almacenamiento local.",
            "bg-red-600"
          );
        }
      }

      function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLS, 300);
      }

      function saveNow() {
        clearTimeout(saveTimeout);
        saveToLS();
      }

      function showNotif(msg, color = "bg-green-600") {
        const notif = document.getElementById("notif");
        const div = document.createElement("div");
        div.className = `rounded shadow-lg ${color} text-white px-6 py-2 mb-2 animate-fadein flex items-center gap-2 text-base`;
        div.textContent = msg;
        notif.innerHTML = "";
        notif.appendChild(div);
        setTimeout(() => (notif.innerHTML = ""), 1100);
      }

      function confirmAction(message, onConfirm) {
        if (confirm(message)) {
          onConfirm();
        } else {
          showNotif("Acción cancelada", "bg-gray-600");
        }
      }
      function escapeHtml(str) {
        return str.replace(/[&<>\"']/g, function (tag) {
          const chars = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          };
          return chars[tag] || tag;
        });
      }

      function generatePastelColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60;
        const lightness = 85;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }

      function getContrastColor(hsl) {
        const match = hsl.match(/\d+/g);
        if (match && match.length >= 3) {
          const l = parseInt(match[2], 10);
          return l > 70 ? "#000" : "#fff";
        }
        return "#000";
      }

      function shadeHsl(hsl, delta) {
        const match = hsl.match(/\d+/g);
        if (match && match.length >= 3) {
          let l = parseInt(match[2], 10) + delta;
          l = Math.max(0, Math.min(100, l));
          return `hsl(${match[0]}, ${match[1]}%, ${l}%)`;
        }
        return hsl;
      }

      function getPlayerCount() {
        return playerNames.length;
      }

      function getTotals() {
        normalizeRoundsArr();
        return playerNames.map((_, i) => {
          // Enganches para este jugador, ordenados por ronda
          const engs = enganches
            .filter((e) => e.idx === i)
            .sort((a, b) => a.round - b.round);

          let sum = 0;
          let engPtr = 0;
          for (let r = 0; r < roundsArr.length; r++) {
            if (engPtr < engs.length && r === engs[engPtr].round) {
              const val = +roundsArr[r][i] || 0;
              sum = engs[engPtr].total + (isNaN(val) ? 0 : val);
              engPtr++;
            } else {
              let val = +roundsArr[r][i] || 0;
              sum += val;
            }
          }
          return sum;
        });
      }

      function getProgress(i, totals = getTotals()) {
        return Math.min(1, (totals[i] || 0) / 100);
      }

      // Jugadores que pueden seguir: no superaron 100 y no están enganchados
      function getJugadoresVivos() {
        const totals = getTotals();
        return playerNames
          .map((_, i) => (totals[i] <= 100 ? i : null))
          .filter((i) => i !== null);
      }

      function getLastRoundPlayed(i) {
        for (let r = roundsArr.length - 1; r >= 0; r--) {
          if (roundsArr[r][i] !== "" && roundsArr[r][i] !== undefined) return r;
        }
        return -1;
      }

      function isRowComplete(rowIdx, totals = getTotals()) {
        for (let j = 0; j < getPlayerCount(); j++) {
          const val = roundsArr[rowIdx][j];
          if (val !== "" && val !== undefined) continue;
          if (totals[j] > 100) {
            const last = getLastRoundPlayed(j);
            if (rowIdx >= last + 1) continue;
          }
          return false;
        }
        return true;
      }

      function getCurrentRoundIndex() {
        const totals = getTotals();
        for (let r = 0; r < roundsArr.length; r++) {
          if (!isRowComplete(r, totals)) return r;
        }
        return roundsArr.length;
      }

      // ------ HEADER -----
      function renderHeader() {
        const headerRow = document.getElementById("playerHeaders");
        headerRow.innerHTML =
          '<th scope="col" class="px-2 py-2 bg-blue-600 text-white">Ronda</th>';
        playerNames.forEach((name, i) => {
          const textColor = getContrastColor(playerColors[i]);
          headerRow.innerHTML += `
          <th scope="col" class="px-2 py-2 group whitespace-nowrap ${
            isManualEnganchado(i) ? "enganchado" : ""
          }" style="background-color:${playerColors[i]};color:${textColor};">
            <div class="flex items-center gap-1 justify-center">
              ${i === dealerIndex ? '<span title="Reparte" class="dealer-icon text-lg">🂠</span>' : ''}
              <span class="editable cursor-pointer hover:underline" data-idx="${i}">${escapeHtml(
            name
          )}</span>
              <button data-idx="${i}" title="Eliminar jugador" aria-label="Eliminar jugador" class="remove-player bg-red-100 hover:bg-red-300 text-red-700 rounded-full p-1 transition" style="font-size: 1rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.293 7.293a1 1 0 011.414 0L12 8.586l1.293-1.293a1 1 0 111.414 1.414L13.414 10l1.293 1.293a1 1 0 01-1.414 1.414L12 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 10l-1.293-1.293a1 1 0 010-1.414z"/></svg>
              </button>
            </div>
          </th>
        `;
        });
        attachHeaderEvents();
      }

      function attachHeaderEvents() {
        document
          .querySelectorAll("#playerHeaders span.editable")
          .forEach((el) => {
            el.addEventListener("click", () =>
              editPlayerName(parseInt(el.dataset.idx))
            );
          });
        document
          .querySelectorAll("#playerHeaders button.remove-player")
          .forEach((btn) => {
            btn.addEventListener("click", () =>
              removePlayer(parseInt(btn.dataset.idx))
            );
          });
      }

      function shouldShowEnganchar(i, currentRound = getCurrentRoundIndex()) {
        if (gameOver || getPlayerCount() <= 2) return false;

        const totals = getTotals();
        if (totals[i] <= 100) return false; // no está pasado

        const lastRound = getLastRoundPlayed(i);
        if (lastRound === -1) return false; // nunca jugó

        return currentRound === lastRound + 1 && !isManualEnganchado(i);
      }

      function calcularPozo() {
        return playerNames.length * 500 + manualEnganches.length * 200;
      }

      function isPlayerDisabled(i, currentRound = getCurrentRoundIndex()) {
        const totals = getTotals();
        const enganchado = isManualEnganchado(i);

        if (gameOver) return true; // partida terminada

        /* 1.  Ya enganchado, y sigue arriba de 100 –– queda fuera hasta revivir */
        if (enganchado && totals[i] > 100) return true;

        const puedeEngancharAhora = shouldShowEnganchar(i, currentRound);

        /* 2.  Si AÚN puede engancharse (botón visible) => NO se bloquea   */
        if (totals[i] > 100 && puedeEngancharAhora) return false;

        /* 3. Pasó los 100 y ya perdió la chance => se bloquea            */
        if (totals[i] > 100 && !puedeEngancharAhora) return true;

        return false; // resto de los casos
      }

      function normalizeRoundsArr() {
        for (let r = 0; r < roundsArr.length; r++) {
          for (let j = 0; j < getPlayerCount(); j++) {
            if (typeof roundsArr[r][j] === "undefined") {
              roundsArr[r][j] = "";
            }
          }
        }
      }

      function renderTable(focusNew = false, focusCol = 0) {
        normalizeRoundsArr();
        const tbody = document.getElementById("tableBody");
        const playerCount = getPlayerCount();
        const isDisabled = gameOver;
        const currentRound = getCurrentRoundIndex();

        function createInputCell(rowIdx, colIdx, value, disable) {
          const td = document.createElement("td");
          td.className = "px-2 py-2";
          td.dataset.col = colIdx;
          const input = document.createElement("input");
          input.type = "number";
          input.min = "0";
          input.inputMode = "numeric";
          input.value = value;
          input.className = `w-16 md:w-20 px-1 py-1 border rounded text-center bg-gray-50 focus:ring-2 focus:ring-blue-400 transition ${
            disable ? "disabled-input" : ""
          }`;
          input.dataset.row = rowIdx;
          input.dataset.col = colIdx;
          input.setAttribute(
            "aria-label",
            `Puntaje de ${playerNames[colIdx]} en ronda ${rowIdx + 1}`
          );
          if (disable) input.disabled = true;
          input.addEventListener("input", (e) =>
            handleInput(rowIdx, colIdx, e.target.value)
          );
          input.addEventListener("focus", () => {
            handleInputFocusBlur();
            highlightRowCol(rowIdx, colIdx);
          });
          input.addEventListener("blur", () => {
            handleInputBlur();
            unhighlightRowCol(rowIdx, colIdx);
          });
          td.appendChild(input);
          return td;
        }

        for (let i = 0; i < roundsArr.length; i++) {
          const round = roundsArr[i];
          let tr = rowRefs[i];
          if (!tr) {
            tr = document.createElement("tr");
            tr.dataset.row = i;
            tr.className = `fade-enter ${isDisabled ? "disabled-row" : ""}`;
            rowRefs[i] = tr;
            cellRefs[i] = [];
            const fragment = document.createDocumentFragment();

            const controlTd = document.createElement("td");
            controlTd.className =
              "px-2 py-2 flex items-center justify-center gap-2";
            const span = document.createElement("span");
            span.textContent = i + 1;
            const btn = document.createElement("button");
            btn.dataset.idx = i;
            btn.title = "Eliminar ronda";
            btn.setAttribute("aria-label", "Eliminar ronda");
            btn.className =
              "remove-round bg-red-100 hover:bg-red-300 text-red-700 rounded-full p-1 transition ml-2";
            btn.style.fontSize = "1rem";
            btn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.293 7.293a1 1 0 011.414 0L12 8.586l1.293-1.293a1 1 0 111.414 1.414L13.414 10l1.293 1.293a1 1 0 01-1.414 1.414L12 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 10l-1.293-1.293a1 1 0 010-1.414z"/></svg>';
            btn.addEventListener("click", () =>
              removeRound(parseInt(btn.dataset.idx))
            );
            controlTd.appendChild(span);
            controlTd.appendChild(btn);
            fragment.appendChild(controlTd);

            for (let j = 0; j < playerCount; j++) {
              const value = round[j] !== undefined ? round[j] : "";
              const td = createInputCell(
                i,
                j,
                value,
                isPlayerDisabled(j, currentRound) || i > currentRound
              );
              fragment.appendChild(td);
              cellRefs[i][j] = td;
            }

            tr.appendChild(fragment);
            if (addRowRef && tbody.contains(addRowRef)) {
              tbody.insertBefore(tr, addRowRef);
            } else {
              tbody.appendChild(tr);
            }
            setTimeout(() => tr.classList.add("fade-enter-active"), 15);
          } else {
            tr.dataset.row = i;
            tr.classList.toggle("disabled-row", isDisabled);
            const controlTd = tr.children[0];
            const span = controlTd.children[0];
            if (span) span.textContent = i + 1;
            const btn = controlTd.children[1];
            if (btn) btn.dataset.idx = i;

            if (!cellRefs[i]) cellRefs[i] = [];
            for (let j = 0; j < playerCount; j++) {
              const value = round[j] !== undefined ? round[j] : "";
              const disabled =
                isPlayerDisabled(j, currentRound) || i > currentRound;
              let td = cellRefs[i][j];
              if (!td) {
                td = createInputCell(i, j, value, disabled);
                tr.appendChild(td);
                cellRefs[i][j] = td;
              } else {
                const input = td.firstElementChild;
                input.value = value;
                input.disabled = disabled;
                input.classList.toggle("disabled-input", disabled);
                input.dataset.row = i;
                input.dataset.col = j;
              }
            }
            for (let j = playerCount; j < cellRefs[i].length; j++) {
              const td = cellRefs[i][j];
              if (td && td.parentNode === tr) tr.removeChild(td);
            }
            cellRefs[i].length = playerCount;
          }
        }

        for (let i = roundsArr.length; i < rowRefs.length; i++) {
          const tr = rowRefs[i];
          if (tr && tr.parentNode === tbody) tbody.removeChild(tr);
        }
        rowRefs.length = roundsArr.length;
        cellRefs.length = roundsArr.length;

        if (isDisabled) {
          if (addRowRef && tbody.contains(addRowRef)) {
            tbody.removeChild(addRowRef);
          }
          addRowRef = null;
          addRowInputs = [];
        } else {
          if (!addRowRef) {
            addRowRef = document.createElement("tr");
            addRowRef.className = "add-round-row";
            const labelTd = document.createElement("td");
            labelTd.className =
              "px-2 py-2 text-blue-400 text-xs cursor-pointer";
            labelTd.textContent = "+ nueva";
            addRowRef.appendChild(labelTd);
            addRowInputs = [];
            for (let j = 0; j < playerCount; j++) {
              const td = document.createElement("td");
              td.className = "px-2 py-2";
              const input = document.createElement("input");
              input.type = "number";
              input.min = "0";
              input.inputMode = "numeric";
              input.value = "";
              input.className =
                "w-16 md:w-20 px-1 py-1 border rounded text-center opacity-60 bg-gray-100 focus:ring-2 focus:ring-blue-400 transition";
              input.placeholder = "Nueva...";
              input.dataset.row = "new";
              input.dataset.col = j;
              const disNew = currentRound < roundsArr.length;
              if (disNew) input.classList.add("disabled-input");
              input.disabled = disNew;
              input.addEventListener("keydown", (e) => handleNewRowKey(e, j));
              input.addEventListener("click", () => addRoundOnIntent(j));
              input.addEventListener("focus", () => {
                addRoundOnIntent(j);
                handleInputFocusBlur();
              });
              input.addEventListener("blur", handleInputBlur);
              td.appendChild(input);
              addRowRef.appendChild(td);
              addRowInputs[j] = input;
            }
            tbody.appendChild(addRowRef);
            addRowRef.addEventListener("click", () => addRoundOnIntent(0));
          } else {
            for (let j = 0; j < playerCount; j++) {
              let input = addRowInputs[j];
              if (!input) {
                const td = document.createElement("td");
                td.className = "px-2 py-2";
                input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.inputMode = "numeric";
                input.value = "";
                input.className =
                  "w-16 md:w-20 px-1 py-1 border rounded text-center opacity-60 bg-gray-100 focus:ring-2 focus:ring-blue-400 transition";
                input.placeholder = "Nueva...";
                input.dataset.row = "new";
                input.dataset.col = j;
                input.addEventListener("keydown", (e) => handleNewRowKey(e, j));
                input.addEventListener("click", () => addRoundOnIntent(j));
                input.addEventListener("focus", () => {
                  addRoundOnIntent(j);
                  handleInputFocusBlur();
                });
                input.addEventListener("blur", handleInputBlur);
                td.appendChild(input);
                addRowRef.appendChild(td);
                addRowInputs[j] = input;
              }
              const disNew = currentRound < roundsArr.length;
              input.disabled = disNew;
              input.classList.toggle("disabled-input", disNew);
              input.dataset.col = j;
            }
            for (let j = playerCount; j < addRowInputs.length; j++) {
              const inp = addRowInputs[j];
              if (inp) inp.parentElement.remove();
            }
            addRowInputs.length = playerCount;
          }
        }

        setTimeout(() => {
          if (focusNew) {
            const newRowIndex = roundsArr.length - 1;
            const inp = cellRefs[newRowIndex]?.[focusCol]?.firstElementChild;
            if (inp) {
              inp.focus();
              inp.select();
            }
          }
          if (engancheAnimQueue.length) {
            const totalRow = document.getElementById("totalRow");
            engancheAnimQueue.forEach((i) => {
              const tds = totalRow ? totalRow.children : [];
              if (tds[i + 1]) {
                tds[i + 1].classList.add("enganchado-flash");
                setTimeout(
                  () => tds[i + 1].classList.remove("enganchado-flash"),
                  950
                );
              }
            });
            engancheAnimQueue = [];
          }
        }, 15);
        renderTotalRow();
        renderWinner();
      }

      function renderTotalRow() {
        const tfootRow = document.getElementById("totalRow");
        let totals = getTotals();
        const currentRound = getCurrentRoundIndex();
        tfootRow.innerHTML = `<td class="px-2 py-2 text-blue-900">Total</td>`;
        for (let i = 0; i < getPlayerCount(); i++) {
          let puedeEnganchar = shouldShowEnganchar(i, currentRound);
          const textColor = getContrastColor(playerColors[i]);
          const progress = getProgress(i, totals);
          const barBg = shadeHsl(playerColors[i], 20);
          const barFill = shadeHsl(playerColors[i], -10);
          tfootRow.innerHTML += `<td data-col="${i}" class="px-2 py-2 font-semibold ${
            isManualEnganchado(i) ? "enganchado" : ""
          }" style="background-color:${playerColors[i]};color:${textColor};">
      <div class="flex items-center gap-1">
        <span>${totals[i]}</span>
        ${
          puedeEnganchar
            ? `<button class="enganchar-btn ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded animate-fadein" data-idx="${i}" aria-label="Enganchar a ${escapeHtml(
                playerNames[i]
              )}">Enganchar</button>`
            : ""
        }
      </div>
      <div class="progress-bg" style="background-color:${barBg};">
        <div class="progress-fill" style="width:${progress * 100}%;background-color:${barFill};"></div>
      </div>
    </td>`;
        }
        attachEngancharEvents();
        updateAllTotals();
      }

      function attachEngancharEvents(ctx = document) {
        ctx.querySelectorAll('.enganchar-btn').forEach((btn) => {
          btn.addEventListener('click', () =>
            handleEnganchar(parseInt(btn.dataset.idx))
          );
        });
      }

      function renderWinner() {
        const winnerMsg = document.getElementById("winnerMsg");
        winnerMsg.classList.add("hidden");
        if (gameOver && winnerIndex !== null) {
          winnerMsg.classList.remove("hidden");
          winnerMsg.innerHTML = `<div class="winner-badge">🏆 Ganador: ${escapeHtml(
            playerNames[winnerIndex]
          )} (Pozo: $${calcularPozo()})</div>`;
        }
      }

      // --- UX ---
      let roundAddedInThisFocus = false;
      function addRoundOnIntent(col) {
        if (roundAddedInThisFocus) return;
        if (getCurrentRoundIndex() < roundsArr.length) {
          showNotif("Completa la ronda actual antes de añadir otra", "bg-red-600");
          return;
        }
        roundAddedInThisFocus = true;
        setTimeout(() => {
          roundAddedInThisFocus = false;
        }, 100);

        roundsArr.push(Array(getPlayerCount()).fill(""));

        renderTable(true, col);
        showNotif("Ronda añadida", "bg-blue-600");
        checkDealerRotation();
        saveNow();
      }

      function handleNewRowKey(e, col) {
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          addRoundOnIntent(col);
        }
      }

      function handleInput(rondaIdx, playerIdx, value) {
        const prevRound = getCurrentRoundIndex();
        roundsArr[rondaIdx][playerIdx] = value ? +value || 0 : "";
        checkGameEnd();
        updateTotal(playerIdx);
        renderTotalRow();
        const currentRound = getCurrentRoundIndex();
        const totals = getTotals();
        if (totals[playerIdx] > 100 && !shouldShowEnganchar(playerIdx, currentRound)) {
          renderTable();
        } else if (currentRound !== prevRound) {
          renderTable();
        }
        checkDealerRotation();
        debouncedSave();
      }

      function addPlayer() {
        if (gameOver) return;
        playerNames.push(`Jugador ${playerNames.length + 1}`);
        playerColors.push(generatePastelColor());
        roundsArr.forEach((ronda) => ronda.push(""));
        lastDealerRound = getCurrentRoundIndex() - 1;
        renderHeader();
        renderTable();
        updateAllTotals();
        showNotif("Jugador añadido", "bg-blue-600");
        saveNow();
      }

      function nextDealer() {
        const vivos = getJugadoresVivos();
        if (vivos.length === 0) return;
        let next = vivos.find((i) => i > dealerIndex);
        if (next === undefined) {
          next = vivos[0];
        }
        dealerIndex = next;
        renderHeader();
        saveNow();
      }

      function checkDealerRotation() {
        const currentRound = getCurrentRoundIndex();
        const completedRound = currentRound - 1;
        if (completedRound > lastDealerRound) {
          lastDealerRound = completedRound;
          nextDealer();
        }
      }

      function removePlayer(index) {
        if (getPlayerCount() <= 1) {
          showNotif("Debe haber al menos un jugador", "bg-red-700");
          return;
        }
        confirmAction("¿Eliminar este jugador?", () => {
          playerNames.splice(index, 1);
          playerColors.splice(index, 1);
          if (index < dealerIndex) {
            dealerIndex--;
          }
          if (dealerIndex >= playerNames.length) {
            dealerIndex = 0;
          }
          manualEnganches = manualEnganches
            .filter((e) => e.idx !== index)
            .map((e) => ({ ...e, idx: e.idx > index ? e.idx - 1 : e.idx }));
          roundsArr.forEach((ronda) => ronda.splice(index, 1));
          lastDealerRound = getCurrentRoundIndex() - 1;
          renderHeader();
          renderTable();
          updateAllTotals();
          showNotif("Jugador eliminado", "bg-red-600");
          saveNow();
        });
      }
      function removeRound(idx) {
        if (roundsArr.length <= 1) {
          showNotif("Debe haber al menos una ronda", "bg-red-700");
          return;
        }
        confirmAction("¿Eliminar esta ronda?", () => {
          roundsArr.splice(idx, 1);
          manualEnganches = manualEnganches
            .filter((e) => e.round !== idx)
            .map((e) => ({ ...e, round: e.round > idx ? e.round - 1 : e.round }));
          enganches = enganches
            .filter((e) => e.round !== idx)
            .map((e) => ({ ...e, round: e.round > idx ? e.round - 1 : e.round }));
          lastDealerRound = getCurrentRoundIndex() - 1;
          renderTable();
          showNotif("Ronda eliminada", "bg-red-600");
          saveNow();
        });
      }

      function updateTotal(playerIdx) {
        normalizeRoundsArr();
        const totals = getTotals();
        const el = document.querySelector(
          `#totalRow td:nth-child(${playerIdx + 2}) span`
        );
        if (el) el.textContent = totals[playerIdx];
        const fill = document.querySelector(
          `#totalRow td:nth-child(${playerIdx + 2}) .progress-fill`
        );
        if (fill) fill.style.width = `${getProgress(playerIdx, totals) * 100}%`;
        syncStickyTotals();
      }

      function updateAllTotals() {
        document.getElementById("pozoTotal").textContent =
          "Pozo: $" + calcularPozo();
        lastTotals = getTotals();
        lastTotals.forEach((t, i) => {
          const el = document.querySelector(
            `#totalRow td:nth-child(${i + 2}) span`
          );
          if (el) el.textContent = t;
          const fill = document.querySelector(
            `#totalRow td:nth-child(${i + 2}) .progress-fill`
          );
          if (fill) fill.style.width = `${getProgress(i, lastTotals) * 100}%`;
        });
        syncStickyTotals();
        saveNow();
      }

      function resetScores() {
        confirmAction("¿Reiniciar todos los puntajes?", () => {
          roundsArr.forEach((ronda) => {
            for (let i = 0; i < getPlayerCount(); i++) ronda[i] = "";
          });
          manualEnganches = [];
          gameOver = false;
          winnerIndex = null;
          enganches = [];
          dealerIndex = 0;
          lastDealerRound = -1;
          renderHeader();
          renderTable();
          updateAllTotals();
          showNotif("Puntajes reiniciados", "bg-gray-600");
          saveNow();
        });
      }

      function editPlayerName(idx) {
        const th = document.querySelector(
          `#playerHeaders th:nth-child(${idx + 2})`
        );
        const prevName = playerNames[idx];
        th.innerHTML = `<input class="edit-input w-full px-1 py-1 rounded text-center border border-blue-400 ring-2 ring-blue-200 focus:ring-4 focus:ring-blue-400 transition text-gray-900" type="text" value="${prevName.replace(/"/g, "&quot;")}" data-idx="${idx}">`;
        const inputEl = th.querySelector("input");
        inputEl.addEventListener("blur", () => savePlayerName(inputEl, idx));
        inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") inputEl.blur();
        });
        inputEl.focus();
        inputEl.select();

      }

      function savePlayerName(input, idx) {
        let value = input.value.trim();
        if (!value) value = `Jugador ${idx + 1}`;
        playerNames[idx] = value;
        renderHeader();
        renderTable();
        updateAllTotals();
        showNotif("Nombre actualizado", "bg-green-700");
        saveNow();
      }

      function getTotalsRaw() {
        return playerNames.map((_, i) =>
          roundsArr.reduce(
            (acc, ronda) => acc + (isFinite(ronda[i]) ? Number(ronda[i]) : 0),
            0
          )
        );
      }

      // ============= ENGANCHE Y GAME END ============
      function handleEnganchar(idx) {
        if (gameOver) return;
        const totalsAntesDelEnganche = getTotalsRaw();
        const vivos = getJugadoresVivos().filter((i) => i !== idx);

        if (vivos.length === 0) {
          showNotif("No hay jugadores a los que enganchar.", "bg-red-700");
          return;
        }

        const ref = vivos
          .map((i) => ({ i, t: totalsAntesDelEnganche[i] }))
          .sort((a, b) => b.t - a.t)[0].i;
        const refTotal = getTotals()[ref];

        let engancheRound = roundsArr.findIndex(
          (ronda, rIdx) =>
            (ronda[idx] === "" || ronda[idx] === undefined) &&
            rIdx < roundsArr.length - 1
        );

        let rondaParaRegistrarEnganche = -1;
        let hayRondasExistentesSinPuntajeParaEsteJugador = false;

        for (let r = 0; r < roundsArr.length; r++) {
          if (roundsArr[r][idx] === "" || roundsArr[r][idx] === undefined) {
            rondaParaRegistrarEnganche = r;
            hayRondasExistentesSinPuntajeParaEsteJugador = true;
            break;
          }
        }

        if (!hayRondasExistentesSinPuntajeParaEsteJugador) {
          rondaParaRegistrarEnganche = roundsArr.length;
          roundsArr.push(Array(getPlayerCount()).fill(""));
        }

        enganches.push({
          idx,
          round: rondaParaRegistrarEnganche,
          ref,
          total: isFinite(refTotal) ? refTotal : 0,
        });
        manualEnganches.push({
          idx,
          round: rondaParaRegistrarEnganche,
          ts: Date.now(),
        });
        engancheAnimQueue.push(idx);

        const indiceRondaSiguienteAlEnganche = rondaParaRegistrarEnganche + 1;
        if (indiceRondaSiguienteAlEnganche >= roundsArr.length) {
          roundsArr.push(Array(getPlayerCount()).fill(""));
        }
        lastDealerRound = getCurrentRoundIndex() - 1;
        renderTable();

        showNotif(
          `${escapeHtml(playerNames[idx])} enganchado al puntaje de ${escapeHtml(
            playerNames[ref]
          )}.`,
          "bg-yellow-600"
        );
        saveNow();
      }
      // --- Ganador: siempre chequear si solo queda 1 jugador vivo
      function checkGameEnd() {
        const vivos = getJugadoresVivos();
        if (getPlayerCount() === 2) {
          let totals = getTotals();
          let loserIdx = null,
            winnerIdx_ = null;
          if (totals[0] >= 100 && totals[1] < 100) {
            loserIdx = 0;
            winnerIdx_ = 1;
          }
          if (totals[1] >= 100 && totals[0] < 100) {
            loserIdx = 1;
            winnerIdx_ = 0;
          }
          if (loserIdx !== null) {
            gameOver = true;
            winnerIndex = winnerIdx_;
            showNotif(
              `${escapeHtml(playerNames[winnerIdx_])} es el ganador!`,
              "bg-green-700"
            );
            renderTable();
            renderWinner();
            saveNow();
          }
        } else if (vivos.length === 1 && !gameOver) {
          gameOver = true;
          winnerIndex = vivos[0];
          showNotif(
            `¡${escapeHtml(playerNames[winnerIndex])} es el ganador!`,
            "bg-green-700"
          );
          renderTable();
          renderWinner();
          saveNow();
        }
      }

      function syncStickyTotals() {
        const stickyBar = document.getElementById("totalStickyBar");
        if (stickyBar && stickyBar.style.display !== "none") {
          const tfootRow = document.getElementById("totalRow");
          stickyBar.innerHTML =
            '<table class="min-w-max w-full border bg-white rounded-t shadow text-sm"><tfoot>' +
            tfootRow.outerHTML +
            "</tfoot></table>";
          attachEngancharEvents(stickyBar);
        }
      }

      function highlightRowCol(rowIdx, colIdx) {
        const row = document.querySelector(`tr[data-row='${rowIdx}']`);
        if (row) row.classList.add("highlight-row");
        document
          .querySelectorAll(`td[data-col='${colIdx}']`)
          .forEach((td) => td.classList.add("highlight-col"));
        syncStickyTotals();
      }

      function unhighlightRowCol(rowIdx, colIdx) {
        const row = document.querySelector(`tr[data-row='${rowIdx}']`);
        if (row) row.classList.remove("highlight-row");
        document
          .querySelectorAll(`td[data-col='${colIdx}']`)
          .forEach((td) => td.classList.remove("highlight-col"));
        syncStickyTotals();
      }

      // Sticky total (móvil)
      function enableStickyTotal(enable = true) {
        const totalRow = document.getElementById("totalRow");
        const stickyBar = document.getElementById("totalStickyBar");
        if (!stickyBar) return;

        if (enable) {
          stickyBar.style.display = "block";
          stickyBar.innerHTML =
            '<table class="min-w-max w-full border bg-white rounded-t shadow text-sm"><tfoot>' +
            totalRow.outerHTML +
            "</tfoot></table>";
          attachEngancharEvents(stickyBar);
          stickyBar.className =
            "sticky-total fixed left-0 right-0 bottom-0 z-50 w-full max-w-3xl mx-auto";
        } else {
          stickyBar.style.display = "none";
          stickyBar.innerHTML = "";
        }
      }

      function handleInputFocusBlur() {
        if (window.innerWidth <= 600) {
          enableStickyTotal(true);
          isStickyTotal = true;
        }
      }
      function handleInputBlur() {
        setTimeout(() => {
          if (
            !document.activeElement ||
            document.activeElement.tagName !== "INPUT"
          ) {
            enableStickyTotal(false);
            isStickyTotal = false;
          }
        }, 100);
      }
      window.addEventListener("resize", () => {
        if (isStickyTotal && window.innerWidth > 600) enableStickyTotal(false);
      });

      document.addEventListener("focusin", (e) => {
        if (e.target.tagName === "INPUT" && window.innerWidth < 800) {
          enableStickyTotal(true);
          // Oculta el tfoot original:
          document.querySelector("tfoot").style.visibility = "hidden";
        }
      });
      document.addEventListener("focusout", (e) => {
        if (e.target.tagName === "INPUT") {
          setTimeout(() => {
            if (
              !document.activeElement ||
              document.activeElement.tagName !== "INPUT"
            ) {
              enableStickyTotal(false);
              document.querySelector("tfoot").style.visibility = "";
            }
          }, 100);
        }
      });

      // Inicializar desde LS o default
      loadFromLS();
      const vivosInit = getJugadoresVivos();
      if (vivosInit.length && !vivosInit.includes(dealerIndex)) {
        dealerIndex = vivosInit[0];
      }
      lastDealerRound = getCurrentRoundIndex() - 1;
      renderHeader();
      renderTable();
      document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
      document.getElementById("resetScoresBtn").addEventListener("click", resetScores);
      document.getElementById("nextDealerBtn").addEventListener("click", nextDealer);

      let deferredPrompt;
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById("installBtn");
        if (installBtn) {
          installBtn.style.display = "inline-block";
          installBtn.addEventListener("click", () => {
            installBtn.style.display = "none";
            deferredPrompt.prompt();
            deferredPrompt.userChoice.finally(() => {
              deferredPrompt = null;
            });
          }, { once: true });
        }
      });
