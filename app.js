import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// === TES CLÉS EN ENTIER, PAS DE TRONQUAGE ===
const supabaseUrl = "https://isminhbqvaesxzhwtpcu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWluaGJxdmFlc3h6aHd0cGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDcxMDEsImV4cCI6MjA2NTgyMzEwMX0.mQVT4CpljRw8MhBpxxdusj51PnnNTtPD4AbMdUEX1aY";

const supabase = createClient(supabaseUrl, supabaseKey);

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const statusEl = document.getElementById("status");

let pollId = null;
const localStoragePrefix = "voted_poll_";

async function loadPoll() {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (pollError || !poll) {
    questionEl.textContent = "Aucun sondage disponible.";
    return;
  }

  pollId = poll.id;
  questionEl.textContent = poll.question;

  const { data: options, error: optError } = await supabase
    .from("options")
    .select("id, text")
    .eq("poll_id", pollId);

  if (optError || !options?.length) {
    optionsEl.textContent = "Pas d'options pour ce sondage.";
    return;
  }

  const storageKey = localStoragePrefix + pollId;
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
  } else {
    statusEl.textContent = "Vous avez déjà voté.";
    showResults();
  }
}

async function showResults() {
  const { data: options, error } = await supabase
    .from("options")
    .select(`id, text, votes(count)`)
    .eq("poll_id", pollId);

  if (error || !options) {
    optionsEl.textContent = "Impossible de récupérer les résultats.";
    return;
  }

  optionsEl.innerHTML = "";

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.count ?? 0), 0);

  options.forEach(opt => {
    const count = opt.votes?.count ?? 0;
    const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

    const div = document.createElement("div");
    div.className = "option disabled";
    div.textContent = `${opt.text} — ${count} vote${count > 1 ? "s" : ""}`;

    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = percent + "%";

    barContainer.appendChild(bar);
    div.appendChild(barContainer);
    optionsEl.appendChild(div);
  });
}

loadPoll();
