DROP TABLE IF EXISTS records;

CREATE TABLE IF NOT EXISTS records (
    id serial primary key,
    country varchar(100)  unique,
    totalConfirmed text ,
    totalDeaths text ,
    totalRecovered text ,
    date Text);

