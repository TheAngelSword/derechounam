-- Atrio V6.8: biblioteca con archivos separados por formato.

alter table books add column if not exists pdf_url text;
alter table books add column if not exists pdf_name text;
alter table books add column if not exists word_url text;
alter table books add column if not exists word_name text;
alter table books add column if not exists epub_url text;
alter table books add column if not exists epub_name text;

-- Conserva y clasifica los archivos heredados de versiones anteriores.
update books
set pdf_url = coalesce(pdf_url, file_url),
    pdf_name = coalesce(pdf_name, file_name)
where file_url is not null
  and lower(coalesce(file_name, file_url)) like '%.pdf%'
  and pdf_url is null;

update books
set word_url = coalesce(word_url, file_url),
    word_name = coalesce(word_name, file_name)
where file_url is not null
  and (
    lower(coalesce(file_name, file_url)) like '%.doc%'
    or lower(coalesce(file_name, file_url)) like '%.docx%'
  )
  and word_url is null;

update books
set epub_url = coalesce(epub_url, file_url),
    epub_name = coalesce(epub_name, file_name)
where file_url is not null
  and lower(coalesce(file_name, file_url)) like '%.epub%'
  and epub_url is null;
