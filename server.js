// app dependencies:
const express = require('express');
const pg = require('pg');
require('dotenv').config();
const methodOverride = require('method-override');
const superagent = require('superagent');


// app setup:
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT || 3000;


//app middlewares:
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');


//routes:
app.get('/',homePageHandler);
app.post('/countryResult',countryHandler);
app.get('/allCountries',allCountriesHandler);
app.post('/addRecord',addRecordHandler);
app.get('/myRecords',myRecordsHandler);
app.post('/details/:id',detailsHandler);
app.delete('/deleteRecord',deleteHandler);



// handler functions:

function deleteHandler(req,res){
    let id = req.body.id;
    let SQL='DELETE FROM records WHERE id =$1';
    let values = [id];
    client.query(SQL,values).then(response=>{
        res.redirect('/myRecords');
    })
}

function detailsHandler (req,res){
    let id = req.params.id;
    let SQL='select * from records where id = $1';
    let values=[id];
    console.log(id)
    client.query(SQL,values).then(response=>{
        res.render('recordDetails',{data:response.rows});
        
    })
}

function myRecordsHandler(req,res){
    
    let SQL='SELECT * FROM records;'
    client.query(SQL).then(response=>{
       
        res.render('myRecords',{data:response.rows});
    })
}

function addRecordHandler(req,res){
    let {TotalConfirmed,Country,TotalDeaths,TotalRecovered,Date} = req.body;
    let SQL= 'INSERT INTO records (country,totalConfirmed,totalDeaths,totalRecovered,date) values($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING';
    let values =[Country,TotalConfirmed,TotalDeaths,TotalRecovered,Date];
    client.query(SQL,values).then(data=>{
        res.redirect('/myRecords');
    })

}

function allCountriesHandler(req,res){
    let url='https://api.covid19api.com/summary';
    superagent.get(url)
    .then(response=>{
        
        let allCountriesData = response.body.Countries.map(obj=>new AllcountriesData(obj));
        res.render('allCountries',{data:allCountriesData});
    })
    .catch(e=>{errorHandler(e,req,res)});


}

function countryHandler(req,res){
    let {country,fromDate,toDate} = req.body;
    let url=`https://api.covid19api.com/country/${country}/status/confirmed?from=${fromDate}&to=${toDate}`;
    superagent.get(url)
    .then(response=>{
        let countryDataArray = response.body.map(obj=>new CountryData(obj));
        res.render('countryResult',{data:countryDataArray});
    })
    .catch(e=>{errorHandler(e,req,res)});
}

function homePageHandler (req,res){
   
    let url = 'https://api.covid19api.com/world/total';
    superagent.get(url).then(response=>{
        let worldData = new WorldData(response.body);
        res.render('index',{data : worldData});
    })
    .catch(e=>{errorHandler(e,req,res)});

}    
    

function errorHandler (e,req,res){
    res.status(500).json(e);
}

// constructors:
function WorldData (obj){
    this.TotalConfirmed = obj.TotalConfirmed;
    this.TotalDeaths = obj.TotalDeaths;
    this.TotalRecovered= obj.TotalRecovered;
}
function CountryData(obj){
    this.date = obj.Date;
    this.cases = obj.Cases;
}
function AllcountriesData(obj){
    this.Country =obj.Country;
    this.TotalConfirmed = obj.TotalConfirmed;
    this.TotalDeaths = obj.TotalDeaths;
    this.TotalRecovered=obj.TotalRecovered;
    this.Date = obj.Date;
}




client.connect().then(()=>{

    app.listen(PORT, ()=>{console.log(`listining on port ${PORT}`)});
})