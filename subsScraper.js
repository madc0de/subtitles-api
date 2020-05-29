const cheerio = require('cheerio')
const got = require('got')
const unzipper = require('unzipper').ParseOne
const srt2vtt = require('srt2vtt');
const streamz = require('streamz');
const langs = require('./langs.json')
const {groupBy} = require('lodash')

const uri = 'https://www.yts-subtitle.com/movie-imdb'
const scrape = imdbId => {
	return got(`${uri}/${imdbId}`)
  .then(res => cheerio.load(res.body))
  .then($ => {
    return $('tbody tr').map((i, el) => {
      const $el = $(el);
      const langLong  = $el.find('.flag-cell .sub-lang').text().toLowerCase()
      const langShort = langs[langLong]
      return {
        name: $el.find('.flag-cell + td').text()
                 .replace("subtitle ", ""),
        rating: $el.find('.rating-cell').text(),
        langLong,
        langShort,
        url: $el.find('.download-cell a').attr('href')
                .replace('subtitles/', 'subtitle/') + '.zip'
      };
    }).get().map((sub, index) => ({...sub, index}))
  })
}
const convert = path => {
  const subUrl = (uri+path).replace('/movie-imdb', '')
  return new Promise((resolve, reject) => {
    let buffers = []
    got.stream(subUrl, {encoding: null})
    .pipe(unzipper())
    .on('data', chunk => {
      buffers.push(chunk)
    })
    .on('end', () => {
      const text = Buffer.concat(buffers)
      srt2vtt(text, (err, vtt) => {
        if(err) {
          reject(err)
          return
        }
        resolve(vtt)
      })
    })
    .on('error' , reject)
  })
}
const scrapeAndConvert = (imbd_id, index) => {
  return scrape(imbd_id)
  .then(movies => movies[index].url)
  .then(convert)
}
const mapSubtitles = (subs) => {
  const grouped = groupBy(subs, 'langLong')
  return Object.values(grouped).map(group => ({
    langLong:  group[0].langLong,
    langShort: group[0].langShort,
    subs: group
  }))
}
exports.scrapeAndConvert = scrapeAndConvert
exports.convert = convert
exports.scrape  = scrape
exports.mapSubtitles = mapSubtitles
