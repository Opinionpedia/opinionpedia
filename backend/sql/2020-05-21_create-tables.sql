CREATE TABLE profile (
    id            INTEGER NOT NULL
                      AUTO_INCREMENT,

    username      VARCHAR(300) NOT NULL,
    password      CHAR(128) NOT NULL,
    salt          CHAR(32) NOT NULL,

    description   TEXT,
    body          TEXT,

    created       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    updated       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE (username)
);

CREATE TABLE question (
    id            INTEGER NOT NULL
                      AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,

    prompt        TEXT NOT NULL,
    description   TEXT NOT NULL,

    created       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    updated       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FOREIGN KEY (profile_id) REFERENCES profile(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE option_ (
    id            INTEGER NOT NULL
                      AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,

    prompt        TEXT NOT NULL,
    description   TEXT,

    created       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    updated       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FOREIGN KEY (profile_id) REFERENCES profile(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE vote (
    id            INTEGER NOT NULL
                      AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,
    option_id     INTEGER NOT NULL,

    -- Not used in multiple-choice questions.
    header        INTEGER,
    body          TEXT,
    description   TEXT,

    -- ammc @ May 14th, 2020:
    --   1=show normally
    --   0=desirable
    --   high numbers like 2 could be something like 2=promote (content)
    active        INTEGER NOT NULL,

    created       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    updated       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE (profile_id, question_id, option_id, header),
    FOREIGN KEY (profile_id) REFERENCES profile(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (option_id) REFERENCES option_(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE tag (
    id            INTEGER NOT NULL
                      AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,

    name          VARCHAR(100) NOT NULL,
    description   TEXT,

    created       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
    updated       DATETIME NOT NULL
                      DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE (name),
    FOREIGN KEY (profile_id) REFERENCES profile(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE profile_tag (
    tag_id       INTEGER NOT NULL,
    profile_id   INTEGER NOT NULL,

    PRIMARY KEY (tag_id, profile_id),
    FOREIGN KEY (tag_id) REFERENCES tag(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profile(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE question_tag (
    tag_id        INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,

    PRIMARY KEY (tag_id, question_id),
    FOREIGN KEY (tag_id) REFERENCES tag(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
