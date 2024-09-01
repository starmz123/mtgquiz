document.addEventListener("DOMContentLoaded", (event) => {
  // Include SortableJS library
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js";
  script.onload = initializeSortable;
  document.head.appendChild(script);

  let currentQuestionIndex = 0;
  const questions = document.querySelectorAll(".question");
  const calculateBtn = document.getElementById("calculateBtn");
  const questionsWrapper = document.querySelector(".questions-wrapper");
  const paginationContainer = document.getElementById("pagination");
  const resultsPage = document.getElementById("results-page");
  const retakeQuizBtn = document.getElementById("retake-quiz-btn");

  function showQuestion(index) {
    questions[currentQuestionIndex].classList.remove("active");
    questions[currentQuestionIndex].classList.add("inactive");
    questions[index].classList.remove("inactive");
    questions[index].classList.add("active");

    questionsWrapper.style.transform = `translateX(-${index * 100}%)`;

    currentQuestionIndex = index;

    updatePagination();
    updateCalculateBtnVisibility();
  }

  function updatePagination() {
    const pageNumbers = paginationContainer.querySelectorAll(".page-number");
    pageNumbers.forEach((pageNumber, index) => {
      if (index === currentQuestionIndex) {
        pageNumber.classList.add("active-page");
      } else {
        pageNumber.classList.remove("active-page");
      }
    });
  }

  function initializePagination() {
    questions.forEach((_, index) => {
      const pageNumber = document.createElement("button");
      pageNumber.textContent = index + 1;
      pageNumber.classList.add("page-number");
      pageNumber.addEventListener("click", () => showQuestion(index));
      paginationContainer.appendChild(pageNumber);
    });
    updatePagination();
  }

  function initializeSortable() {
    // Initialize sortable for options and each rank dropzone
    let dropzones = document.querySelectorAll(".sortable-list");

    dropzones.forEach((dropzone) => {
      new Sortable(dropzone, {
        group: "shared",
        animation: 150,
        onStart: function (evt) {
          checkIfEmpty(evt.from);
        },
        onEnd: function (evt) {
          checkIfEmpty(evt.from);
          checkIfEmpty(evt.to);
          updateCalculateBtnVisibility();
        }
      });
    });

    function checkIfEmpty(container) {
      if (!container.children.length) {
        container.classList.add("empty");
      } else {
        container.classList.remove("empty");
      }
    }

    document.querySelectorAll(".options").forEach((container) => {
      checkIfEmpty(container);
    });

    shuffleOptions();

    calculateBtn.addEventListener("click", () => {
      let scores = { White: 0, Blue: 0, Red: 0, Green: 0, Black: 0 };
      let rank1Counts = { White: 0, Blue: 0, Red: 0, Green: 0, Black: 0 };
      let rank5Counts = { White: 0, Blue: 0, Red: 0, Green: 0, Black: 0 };
      document.querySelectorAll(".question").forEach((question) => {
        let weight = question.dataset.weight;
        question
          .querySelectorAll(".rank-dropzone")
          .forEach((dropzone, rankIndex) => {
            let items = dropzone.querySelectorAll(".sortable-item");
            items.forEach((item) => {
              let color = item.dataset.color;
              let points = 0;
              if (rankIndex === 0) {
                // Rank 1
                points = 5 * weight * 2; // Double points for Rank 1
                rank1Counts[color]++;
              } else if (rankIndex === 1) {
                // Rank 2
                points = 3 * weight; // Adjusted points for Rank 2
              } else if (rankIndex === 2) {
                // Rank 3
                points = 2 * weight; // Adjusted points for Rank 3
              } else if (rankIndex === 3) {
                // Rank 4
                points = 1 * weight; // Adjusted points for Rank 4
              } // Rank 5 gives 0 points
              scores[color] += points;
              if (rankIndex === 4) {
                // Rank 5
                rank5Counts[color]++;
              }
            });
          });
      });

      // Double scores for colors ranked 1 at least three times
      Object.keys(rank1Counts).forEach((color) => {
        if (rank1Counts[color] >= 3) {
          scores[color] *= 2;
        }
      });

      // Double scores for other colors if any color is ranked 5 at least three times
      let anyRank5 = Object.values(rank5Counts).some((count) => count >= 3);
      if (anyRank5) {
        Object.keys(scores).forEach((color) => {
          scores[color] *= 2;
        });
      }

      let totalPoints = Object.values(scores).reduce((a, b) => a + b, 0);

      let sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

      let colorMap = {
        White: "#ead374",
        Blue: "#0000FF",
        Black: "#000000",
        Red: "#FF0000",
        Green: "#008000"
      };

      let colorLinks = {
        White: "https://i.imgur.com/kTOezPO.png",
        Blue: "https://i.imgur.com/l39KNAf.png",
        Black: "https://i.imgur.com/nbMqVef.png",
        Red: "https://i.imgur.com/nbMqVef.png",
        Green: "https://i.imgur.com/P7T2LAj.png"
      };

      let resultText = "Results (links lead to colour summaries): <br>";
      sortedScores.forEach(([color, score]) => {
        let percentage = Math.round((score / totalPoints) * 100);
        let colorStyle = `color: ${colorMap[color]};`;
        let colorLink = `<a href="${colorLinks[color]}" style="${colorStyle}" target="_blank">${color}</a>`;
        resultText += `<span style="${colorStyle}">${colorLink}: ${percentage}%</span>, `;
      });
      document.getElementById("result").innerHTML = resultText.slice(0, -2);

      // Show results page
      document.querySelector(".quiz-container").style.display = "none";
      resultsPage.style.display = "flex";
    });

    retakeQuizBtn.addEventListener("click", () => {
      // Reset quiz

      currentQuestionIndex = 0;
      showQuestion(currentQuestionIndex);
      document.querySelector(".quiz-container").style.display = "none";
      resultsPage.style.display = "none";
      document.getElementById("landing-page").style.display = "flex";
      resetDropZones();
    });
  }

  /* Reset drop zones after pressing reset quiz */
  function resetDropZones() {
    // Move all items back to their original options container
    document.querySelectorAll(".sortable-item").forEach((item) => {
      const originalContainer = document.querySelector(
        `#options-${item.dataset.question}`
      );
      originalContainer.appendChild(item);
    });

    // Clear all rank drop zones and reset their styles
    document.querySelectorAll(".rank-dropzone").forEach((dropzone) => {
      dropzone.innerHTML = "";
      dropzone.classList.add("empty");
      // Ensure the min-height and margin-bottom are set correctly
      dropzone.style.minHeight = "5vh";
      dropzone.style.marginBottom = "1.5vh";
    });

    // Reset the options container styles
    document.querySelectorAll(".options").forEach((optionsContainer) => {
      optionsContainer.classList.remove("empty");
    });

    shuffleOptions();
  }

  /* Only show calculate button when there are no unranked options */
  function updateCalculateBtnVisibility() {
    const allRanked = Array.from(document.querySelectorAll(".options")).every(
      (container) => container.children.length === 0
    );
    calculateBtn.style.display = allRanked ? "block" : "none";
  }

  // Function to randomize options
  function shuffleOptions() {
    document.querySelectorAll(".options").forEach((optionsContainer) => {
      const items = Array.from(optionsContainer.children);
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      items.forEach((item) => optionsContainer.appendChild(item));
    });
  }

  /* TESTING: always show the button 
  function updateCalculateBtnVisibility() {
    calculateBtn.style.display = "block";
  } */

  // Ensure the first question is shown by default and others are hidden
  questions.forEach((question, index) => {
    if (index === 0) {
      question.classList.add("active");
    } else {
      question.classList.add("inactive");
    }
  });
  initializePagination();
  updateCalculateBtnVisibility();
});