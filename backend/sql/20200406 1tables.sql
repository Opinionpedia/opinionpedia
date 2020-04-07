CREATE TABLE profile (
    id            INTEGER NOT NULL AUTO_INCREMENT,

    username      VARCHAR(300) NOT NULL,
    password      CHAR(128) NOT NULL,
    salt          CHAR(32) NOT NULL,
    description   TEXT NOT NULL,
    body          TEXT NOT NULL,

    created       DATE NOT NULL,
    updated       DATE NOT NULL,

    PRIMARY KEY (id),
    UNIQUE (username)
);

CREATE TABLE question (
    id            INTEGER NOT NULL AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,

    prompt        TEXT NOT NULL,
    description   TEXT NOT NULL,

    created       DATE NOT NULL,
    updated       DATE NOT NULL,

    PRIMARY KEY (id)
);

CREATE TABLE option_ (
    id            INTEGER NOT NULL AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,

    prompt        TEXT NOT NULL,
    description   TEXT,

    created       DATE NOT NULL,
    updated       DATE NOT NULL,

    PRIMARY KEY (id)
);

CREATE TABLE vote (
    id            INTEGER NOT NULL AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,
    option_id     INTEGER NOT NULL,

    header        INTEGER,
    body          TEXT,
    description   TEXT,
    active        INTEGER NOT NULL,

    created       DATE NOT NULL,
    updated       DATE NOT NULL,

    PRIMARY KEY (id),
    UNIQUE (profile_id, question_id, option_id)
);

CREATE TABLE tag (
    id            INTEGER NOT NULL AUTO_INCREMENT,

    profile_id    INTEGER NOT NULL,

    name          VARCHAR(100) NOT NULL,
    description   TEXT NOT NULL,

    created       DATE NOT NULL,
    updated       DATE NOT NULL,

    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE profile_tag (
    tag_id       INTEGER NOT NULL,
    profile_id   INTEGER NOT NULL,

    UNIQUE (tag_id, profile_id)
);

CREATE TABLE question_tag (
    tag_id        INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,

    UNIQUE (tag_id, question_id)
);

CREATE TABLE meta (
    id        INTEGER NOT NULL AUTO_INCREMENT,

    views     INTEGER NOT NULL,

    created   DATE NOT NULL,
    updated   DATE NOT NULL,

    PRIMARY KEY (id)
);

CREATE TABLE profile_meta (
    meta_id      INTEGER NOT NULL,
    profile_id   INTEGER NOT NULL,

    UNIQUE (profile_id)
);

CREATE TABLE question_meta (
    meta_id       INTEGER NOT NULL,
    question_id   INTEGER NOT NULL,

    UNIQUE (question_id)
);
