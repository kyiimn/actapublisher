-- DROP TABLE t_page_publish_info;
CREATE TABLE t_page_publish_info (
    id bigserial NOT NULL,
    media_id bigint NOT NULL,
    pub_date character varying (8) NOT NULL,
    page integer NOT NULL,
    section_id bigint NOT NULL,
    section_page integer NOT NULL,
    color_id bigint NOT NULL,
    page_size_id bigint NOT NULL,
    whole integer NOT NULL,
    CONSTRAINT pk_page_publish_info_id PRIMARY KEY (id),
    CONSTRAINT unique_page_publish_info UNIQUE (media_id, pub_date, page)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_object;
CREATE TABLE t_page_object (
    id bigserial NOT NULL,
    page_id bigint NOT NULL,
    object_type character varying (8) NOT NULL,
    object_id bigint NOT NULL,
    frame_id character varying (64) NOT NULL,
    frame_type character varying (8) NOT NULL,
    pos_x numeric NOT NULL,
    pos_y numeric NOT NULL,
    width numeric NOT NULL,
    height numeric NOT NULL,
    option jsonb NOT NULL,
    CONSTRAINT pk_page_object_id PRIMARY KEY (id),
    CONSTRAINT unique_page_object UNIQUE (frame_id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_adver;
CREATE TABLE t_page_adver (
    id bigint NOT NULL,
    publish_id bigint NOT NULL,
    edition_id bigint NOT NULL,
    adver_local_id bigint NOT NULL,
    adver_size_id bigint NOT NULL,
    user_id bigint NOT NULL,
    file_storage_id bigint NOT NULL,
    status character varying (8) NOT NULL,
    lock integer NOT NULL,
    lock_date timestamp with time zone,
    lock_user_id bigint,
    CONSTRAINT pk_page_adver_id PRIMARY KEY (id),
    CONSTRAINT unique_page_adver UNIQUE (publish_id, edition_id, adver_local_id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_title;
CREATE TABLE t_page_title (
    id bigserial NOT NULL,
    title character varying (1024) NOT NULL,
    CONSTRAINT pk_page_title_id PRIMARY KEY (id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page;
CREATE TABLE t_page (
    id bigint NOT NULL,
    publish_id bigint NOT NULL,
    edition_id bigint NOT NULL,
    local_id bigint NOT NULL,
    user_id bigint NOT NULL,
    file_storage_id bigint NOT NULL,
    title character varying (1024) NOT NULL,
    status character varying (8) NOT NULL,
    lock integer NOT NULL,
    lock_date timestamp with time zone,
    lock_user_id bigint,
    CONSTRAINT pk_page_id PRIMARY KEY (id),
    CONSTRAINT unique_page UNIQUE (publish_id, edition_id, local_id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_pattern;
CREATE TABLE t_page_pattern (
    id bigserial NOT NULL,
    title character varying (1024) NOT NULL,
    reg_date timestamp with time zone NOT NULL,
    reg_user_id bigint NOT NULL,
    modify_date timestamp with time zone,
    modify_user_id bigint,
    data jsonb NOT NULL,
    lock integer NOT NULL,
    lock_date timestamp with time zone,
    lock_user_id bigint,
    CONSTRAINT pk_page_pattern_id PRIMARY KEY (id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_template;
CREATE TABLE t_page_template (
    id bigserial NOT NULL,
    title character varying (1024) NOT NULL,
    page_size_id bigint NOT NULL,
    reg_date timestamp with time zone NOT NULL,
    reg_user_id bigint NOT NULL,
    modify_date timestamp with time zone,
    modify_user_id bigint,
    adver_size_id bigint,
    whole integer NOT NULL,
    file_storage_id bigint NOT NULL,
    lock integer NOT NULL,
    lock_date timestamp with time zone,
    lock_user_id bigint,
    CONSTRAINT pk_page_template_id PRIMARY KEY (id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_print;
CREATE TABLE t_page_print (
    id bigserial NOT NULL,
    publish_id bigint NOT NULL,
    edition_id bigint NOT NULL,
    local_id bigint NOT NULL,
    adver_local_id bigint NOT NULL,
    print_type_id bigint NOT NULL,
    status character varying (8) NOT NULL,
    CONSTRAINT pk_page_print_id PRIMARY KEY (id),
    CONSTRAINT unique_page_print UNIQUE (publish_id, edition_id, local_id, adver_local_id)
) WITH (OIDS = FALSE);

-- DROP TABLE t_page_week_plan;
CREATE TABLE t_page_week_plan (
    id bigserial NOT NULL,
    media_id bigint NOT NULL,
    pub_date character varying (8) NOT NULL,
    page integer NOT NULL,
    section_id bigint NULL,
    section_page integer NOT NULL,
    color_id bigint NOT NULL,
    page_size_id bigint NOT NULL,
    template_id bigint NOT NULL,
    user_id bigint NOT NULL,
    whole integer NOT NULL,
    CONSTRAINT pk_page_week_plan_id PRIMARY KEY (id),
    CONSTRAINT unique_page_week_plan UNIQUE (media_id, pub_date, page)
) WITH (OIDS = FALSE);

