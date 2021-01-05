INSERT INTO t_config_code_def (class, code, name, use) VALUES (1, 'PAPER', '신문', 1);
INSERT INTO t_config_code_def (class, code, name, media_id, use) VALUES (2, 'ASIAE', '아시아경제취재', 1, 1);
INSERT INTO t_config_code_def (class, code, name, media_id, use) VALUES (3, 'ASIAE', '아시아경제', 1, 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (5, 'NORMAL', '일반광고', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (6, 'PLAIN', 'plain text', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (6, 'HTML', 'html', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (6, 'MARKED', 'marked', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (7, 'BODY', '본문기사', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (7, 'TITLE', '제목기사', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (8, 'INSERT', '원본', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (8, 'EDIT', '편집', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (9, 'IMAGE', '화상', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (9, 'GRAPHIC', '그래픽', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (9, 'CUT', '컷', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (10, 'A1', 'A1', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (10, 'A2', 'A2', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (10, 'A3', 'A3', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (10, 'A4', 'A4', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (10, 'CUSTOM', '사용자정의', 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (11, 'V', '세로', 1, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (11, 'H', '가로', 2, 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (12, 'POINT', 'pt', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (12, 'CM', 'cm', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (12, 'MM', 'mm', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (12, 'INCH', '인치', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (12, 'GUB', '급', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (12, 'BAE', '배', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (13, 'ARTICLE', '기사', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (13, 'ADVER', '광고', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (13, 'IMAGE', '화상', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (14, 'PARA', 'paragraph', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (14, 'TITLE', 'title', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (14, 'IMAGE', 'image', 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (15, 'PLAN', '지면계획', 1, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (15, 'EDIT', '편집', 2, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (15, 'END', '편집완료', 3, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (16, 'WAIT', '편집대기', 1, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (16, 'END', '강판', 2, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (16, 'FILM', '필름출력', 3, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (16, 'PDF', 'PDF출력', 4, 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (17, 'INSERT', '원본', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (17, 'WORK', '리터치대기', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (17, 'COMPLATE', '리터치완료', 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (18, 'PLAN', '광고계획', 1, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (18, 'EDIT', '편집', 2, 1);
INSERT INTO t_config_code_def (class, code, name, sort, use) VALUES (18, 'END', '편집완료', 3, 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (19, 'INSERT', '원본', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (19, 'WORK', '리터치대기', 1);
INSERT INTO t_config_code_def (class, code, name, use) VALUES (19, 'COMPLATE', '리터치완료', 1);

INSERT INTO t_config_media_def (id, name, type) VALUES (1, '아시아경제', 'PAPER');

INSERT INTO t_config_local_def (code, name, media_id, sort, use) VALUES ('A', '전국', 1, 1, 1);

INSERT INTO t_config_edition_def (edition, name, media_id, use) VALUES (10, '10판', 1, 1);
INSERT INTO t_config_edition_def (edition, name, media_id, use) VALUES (40, '40판', 1, 1);
INSERT INTO t_config_edition_def (edition, name, media_id, use) VALUES (50, '50판', 1, 1);

INSERT INTO t_config_section_def (code, name, media_id, use) VALUES ('A', 'A섹션', 1, 1);
INSERT INTO t_config_section_def (code, name, media_id, use) VALUES ('B', 'B섹션', 1, 1);

INSERT INTO t_config_adver_size_def (id, name, media_id, use) VALUES (1, '1단', 1, 1);

INSERT INTO t_config_adver_local_def (code, name, media_id, sort, use) VALUES ('A', '전국', 1, 1, 1);

INSERT INTO t_config_color_def (id, name) VALUES (1, 'CMYK');
INSERT INTO t_config_color_def (id, name) VALUES (2, 'GRAYSCALE');
INSERT INTO t_config_color_def (id, name) VALUES (3, 'RGB');

INSERT INTO t_config_print_type_def (id, name) VALUES (1, 'PDF출력');
INSERT INTO t_config_print_type_def (id, name) VALUES (2, '지면출력');

INSERT INTO t_config_closing_time_def (closing_time, media_id, page, edition_id) VALUES ('160000', 1, 0, 1);
INSERT INTO t_config_closing_time_def (closing_time, media_id, page, edition_id) VALUES ('180000', 1, 0, 2);
INSERT INTO t_config_closing_time_def (closing_time, media_id, page, edition_id) VALUES ('200000', 1, 0, 3);

INSERT INTO t_config_storage_def (id, name, base_path, archive) VALUES (1, 'IMAGE', '/home/kyiimn/WWWRoot/acta_data/image', 0);
INSERT INTO t_config_storage_def (id, name, base_path, archive) VALUES (2, 'ADVER', '/home/kyiimn/WWWRoot/acta_data/adver', 0);
INSERT INTO t_config_storage_def (id, name, base_path, archive) VALUES (3, 'ARTICLE', '/home/kyiimn/WWWRoot/acta_data/article', 0);
INSERT INTO t_config_storage_def (id, name, base_path, archive) VALUES (4, 'PAGE', '/home/kyiimn/WWWRoot/acta_data/page', 0);

INSERT INTO t_config_page_size_def
 (name, paper_type, paper_width, paper_height, paper_direction, linespacing_size, linespacing_unit, linespacing_ratio, col_margin_inside, col_margin_outside, col_count, col_size, col_spacing, col_other, col_total_size, line_margin_top, line_margin_bottom, line_height, line_count, line_spacing, line_other, line_total_size) 
 VALUES ('기본판형', 'CUSTOM', 400, 548, 'V', 9.5, 'POINT', 100, 20.01, 20.01, 6, 55.63, 5, 0, 400, 3.9, 3.9, 3.35, 106, 1.5, 0, 548);
