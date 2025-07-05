-- Table pour stocker les sondages
CREATE TABLE sondages (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT
);

-- Table pour stocker les questions des sondages
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    sondage_id INT REFERENCES sondages(id),
    texte VARCHAR(255) NOT NULL
);

-- Table pour stocker les réponses des utilisateurs
CREATE TABLE reponses (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id),
    texte VARCHAR(255) NOT NULL
);
