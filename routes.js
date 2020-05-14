const Router = require('express').Router;
const router = new Router();
const YTSApi = require('yts-api-pt')
const pkg = require('./package.json')
const scraper = require('./subsScraper')

const yts = new YTSApi()
const startDate = new Date();
const links = [
  '/',
  '/movies?page&limit&queryTerm&orderBy',
  '/movies/id?movieId',
  '/movies/suggestions/:id',
  '/subs/:imdb_id',
  '/subs/:imdb_id/:index'
]

router.get('/', (req, res) => {
  res.json({
    links,
    name: pkg.name,
    version: pkg.version,
    started_at: startDate,
    uptime: `${new Date() - startDate} ms`
  })
})
router.get('/movies', (req, res) => {
  yts.getMovies(req.query).then(data => res.json(data))
})
router.get('/movies/id', (req, res) => {
  const id = parseInt(req.query.movieId)  
  yts.getMovie({ movieId: id }).then(data => res.json(data))
})
router.get('/movies/suggestions/:movieId', (req, res) => {
  const id = parseInt(req.params.movieId)
  yts.getSuggestions(id).then(data => res.json(data))
  .catch(console.log)
})
router.get('/subs/:imdb_id', (req, res) => {
  scraper.scrape(req.params.imdb_id)
  .then(json => scraper.mapSubtitles(json))
  .then(data => res.json(data))
})
router.get('/subs/:imdb_id/:index', (req, res) => {
  const {imdb_id, index} = req.params
  scraper.scrapeAndConvert(imdb_id, index)
  .then(buffer => {
    res.type("text/vtt")
    res.send(buffer)
  })
})

module.exports = router
