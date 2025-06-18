import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://isminhbqvaesxzhwtpcu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWluaGJxdmFlc3h6aHd0cGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDcxMDEsImV4cCI6MjA2NTgyMzEwMX0.mQVT4CpljRw8MhBpxxdusj51PnnNTtPD4AbMdUEX1aY";

const supabase = createClient(supabaseUrl, supabaseKey);

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const statusEl = document.getElementById("status");
const loaderEl = document.getElementById("loader");

let pollId = null;
const localStorageKeyPrefix = "voted_poll_";

async function loadPoll() {
  loaderEl.style.display = "block";

  try {
    // Récupérer le premier sondage
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (pollError || !poll) {
      questionEl.textContent = "Aucun sondage disponible.";
      loaderEl.style.display = "none";
      return;
    }

    pollId = poll.id;
    questionEl.textContent = poll.question;

    const { data: options, error: optionsError } = await supabase
      .from("options")
      .select("id, text")
      .eq("poll_id", pollId)
      .order("id", { ascending: true });

    if (optionsError || !options?.length) {
      optionsEl.textContent = "Pas d'options pour ce sondage.";
      loaderEl.style.display = "none";
      return;
    }

    const storageKey = localStorageKeyPrefix + pollId;
    const hasVoted = !!localStorage.getItem(storageKey);

    if (!hasVoted) {
      optionsEl.innerHTML = "";
      options.forEach(opt => {
        const div = document.createElement("div");
        div.className = "option";
        div.textContent = opt.text;

        div.addEventListener("click", async () => {
          const { error } = await supabase.from("votes").insert({ option_id: opt.id });
          if (error) {
            statusEl.textContent = "Erreur lors de l'envoi du vote.";
            return;
          }
          localStorage.setItem(storageKey, "1");
          statusEl.textContent = "Merci pour votre vote !";
          showResults();
        });

        optionsEl.appendChild(div);
      });
      statusEl.textContent = "";
    } else {
      statusEl.textContent = "Vous avez déjà voté.";
      showResults();
    }
  } catch (e) {
    questionEl.textContent = "Erreur lors du chargement.";
  } finally {
    loaderEl.style.display = "none";
  }
}

async function showResults() {
  const { data: options, error } = await supabase
    .from("options")
    .select(`
      id,
      text,
      votes: votes(count)
    `)
    .eq("poll_id", pollId);

  if (error || !options) {
    optionsEl.textContent = "Impossible de récupérer les résultats.";
    return;
  }

  optionsEl.innerHTML = "";

  // Total des votes
  const totalVotes = options.reduce((acc, opt) => acc + (opt.votes?.count ?? 0), 0);

  options.forEach(opt => {
    const votesCount = opt.votes?.count ?? 0;
    const percent = totalVotes === 0 ? 0 : Math.round((votesCount / totalVotes) * 100);

    const div = document.createElement("div");
    div.className = "option disabled";
    div.textContent = `${opt.text} — ${votesCount} vote${votesCount > 1 ? "s" : ""}`;

    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";

    const bar = document.createElement("div");
    bar.className = "bar";

    requestAnimationFrame(() => {
      bar.style.width = percent + "%";
    });

    barContainer.appendChild(bar);
    div.appendChild(barContainer);

    optionsEl.appendChild(div);
  });
}

loadPoll();
